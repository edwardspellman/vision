const roomManager = require('./roomManager');
const { getClientIp, getAutoRoomForIp } = require('./ipUtils');

module.exports = function socketHandler(io) {
  io.on('connection', (socket) => {
    const clientIp = getClientIp(socket);
    const autoRoom = getAutoRoomForIp(clientIp);

    // Initial IP and network info
    socket.emit('client_ip_info', {
      ip: clientIp,
      autoRoom
    });

    /**
     * CREATE CUSTOM ROOM
     */
    socket.on('create_room', (data, callback) => {
      try {
        const { 
          roomId, 
          name, 
          password, 
          isPrivate, 
          maxUsers, 
          user, 
          allowAudioCalls = true, 
          allowVideoCalls = true, 
          allowMediaUploads = true 
        } = data;
        
        if (!roomId || !roomId.trim()) {
          return callback && callback({ success: false, error: 'Room ID is required' });
        }

        const result = roomManager.createRoom({
          roomId,
          name: name || roomId,
          password,
          isPrivate,
          hostUser: user,
          maxUsers: maxUsers || 50,
          allowAudioCalls,
          allowVideoCalls,
          allowMediaUploads
        });

        if (!result.success) {
          return callback && callback({ success: false, error: result.error });
        }

        // Auto join the creator to this room
        const joinRes = roomManager.addUser(socket.id, result.room.id, user || { name: 'Host' }, password);
        if (joinRes.success) {
          socket.join(result.room.id);
        }

        if (callback) {
          callback({
            success: true,
            room: roomManager.getRoomPublicInfo(result.room.id)
          });
        }
      } catch (err) {
        console.error('Error creating room:', err);
        if (callback) callback({ success: false, error: 'Internal server error creating room' });
      }
    });

    /**
     * UPDATE ROOM SETTINGS (Host only)
     */
    socket.on('update_room_settings', (data, callback) => {
      try {
        const { roomId, settings } = data;
        const mapping = roomManager.socketMap.get(socket.id);

        if (!mapping || mapping.roomId !== roomId) {
          return callback && callback({ success: false, error: 'Not authorized in this room' });
        }

        const result = roomManager.updateRoomSettings(roomId, mapping.user.id, settings);
        if (result.success) {
          io.to(roomId).emit('room_settings_updated', result.room);

          const sysMsg = roomManager.addMessage(roomId, {
            sender: { name: 'System', avatar: 'bot', color: '#6366f1' },
            text: `Room settings & permissions updated by Host (${mapping.user.name}).`,
            type: 'system'
          });
          io.to(roomId).emit('new_message', sysMsg);

          if (callback) callback({ success: true, room: result.room });
        } else {
          if (callback) callback({ success: false, error: result.error });
        }
      } catch (err) {
        console.error('Error updating room settings:', err);
        if (callback) callback({ success: false, error: 'Failed to update room settings' });
      }
    });

    /**
     * JOIN ROOM (Auto or Custom)
     */
    socket.on('join_room', (data, callback) => {
      try {
        const { roomId, password, user } = data;
        let targetRoomId = roomId;

        // If no roomId provided, use default Auto-Network room
        if (!targetRoomId || targetRoomId === 'auto') {
          const auto = roomManager.getOrCreateAutoRoom(autoRoom);
          targetRoomId = auto.id;
        }

        // Attempt to find room by ID or Name
        let room = roomManager.findRoom(targetRoomId);

        if (!room && (targetRoomId.startsWith('LAN-') || targetRoomId.startsWith('IP-'))) {
          room = roomManager.getOrCreateAutoRoom({
            roomId: targetRoomId,
            roomName: autoRoom.roomName,
            isLocal: autoRoom.isLocal,
            networkType: autoRoom.networkType
          });
        }

        if (room) {
          targetRoomId = room.id;
        } else {
          return callback && callback({
            success: false,
            error: 'Room not found. Check the room name or code.'
          });
        }

        // Add user to room
        const joinResult = roomManager.addUser(socket.id, targetRoomId, user || {}, password);

        if (!joinResult.success) {
          return callback && callback({
            success: false,
            error: joinResult.error,
            requiresPassword: joinResult.requiresPassword
          });
        }

        // Leave previous socket rooms and join target room
        Array.from(socket.rooms).forEach(r => {
          if (r !== socket.id) socket.leave(r);
        });
        socket.join(targetRoomId);

        const publicRoom = roomManager.getRoomPublicInfo(targetRoomId);
        const users = roomManager.getUsers(targetRoomId);
        const messages = roomManager.getMessages(targetRoomId);

        // Notify caller of success
        if (callback) {
          callback({
            success: true,
            room: publicRoom,
            user: joinResult.user,
            users,
            messages
          });
        }

        // Broadcast to other users in room
        socket.to(targetRoomId).emit('user_joined', {
          user: joinResult.user,
          users
        });

        // Add a system notification message
        const sysMsg = roomManager.addMessage(targetRoomId, {
          sender: { name: 'System', avatar: 'bot', color: '#6366f1' },
          text: `${joinResult.user.name} joined the room.`,
          type: 'system'
        });
        io.to(targetRoomId).emit('new_message', sysMsg);

      } catch (err) {
        console.error('Error joining room:', err);
        if (callback) callback({ success: false, error: 'Internal server error joining room' });
      }
    });

    /**
     * LEAVE ROOM
     */
    socket.on('leave_room', (callback) => {
      try {
        const removal = roomManager.removeUser(socket.id);
        if (removal) {
          const { roomId, user, remainingUsers } = removal;
          
          Array.from(socket.rooms).forEach(r => {
            if (r !== socket.id) socket.leave(r);
          });

          // Notify other users in the room
          socket.to(roomId).emit('user_left', {
            user,
            users: remainingUsers
          });

          // Add system notification message
          const sysMsg = roomManager.addMessage(roomId, {
            sender: { name: 'System', avatar: 'bot', color: '#6366f1' },
            text: `${user.name} left the room.`,
            type: 'system'
          });
          io.to(roomId).emit('new_message', sysMsg);

          // End any active calls for this socket
          socket.to(roomId).emit('webrtc_call_ended', {
            senderSocketId: socket.id
          });
        }

        if (callback) callback({ success: true });
      } catch (err) {
        console.error('Error leaving room:', err);
        if (callback) callback({ success: false, error: 'Failed to leave room' });
      }
    });

    /**
     * SEND MESSAGE
     */
    socket.on('send_message', (data, callback) => {
      try {
        const { roomId, text, type, fileUrl, fileName, fileSize, audioDuration } = data;
        const mapping = roomManager.socketMap.get(socket.id);

        if (!mapping || mapping.roomId !== roomId) {
          return callback && callback({ success: false, error: 'Not in this room' });
        }

        const message = roomManager.addMessage(roomId, {
          sender: mapping.user,
          text,
          type: type || 'text',
          fileUrl,
          fileName,
          fileSize,
          audioDuration
        });

        if (message) {
          io.to(roomId).emit('new_message', message);
          // Stop typing on message send
          roomManager.setTyping(roomId, mapping.user.name, false);
          io.to(roomId).emit('typing_update', Array.from(roomManager.rooms.get(roomId)?.typingUsers || []));
          if (callback) callback({ success: true, message });
        }
      } catch (err) {
        console.error('Error sending message:', err);
        if (callback) callback({ success: false, error: 'Failed to send message' });
      }
    });

    /**
     * TYPING STATUS
     */
    socket.on('typing', ({ roomId, isTyping }) => {
      const mapping = roomManager.socketMap.get(socket.id);
      if (mapping && mapping.roomId === roomId) {
        const typingList = roomManager.setTyping(roomId, mapping.user.name, isTyping);
        socket.to(roomId).emit('typing_update', typingList);
      }
    });

    /**
     * EMOJI REACTION
     */
    socket.on('toggle_reaction', ({ roomId, messageId, emoji }) => {
      const mapping = roomManager.socketMap.get(socket.id);
      if (mapping && mapping.roomId === roomId) {
        const result = roomManager.toggleReaction(roomId, messageId, emoji, mapping.user.name);
        if (result) {
          io.to(roomId).emit('reaction_update', result);
        }
      }
    });

    /**
     * WEBRTC AUDIO/VIDEO CALL SIGNALING
     */
    // Initiate Call Request to a peer
    socket.on('webrtc_call_user', ({ targetSocketId, roomId, isVideo }) => {
      const mapping = roomManager.socketMap.get(socket.id);
      if (mapping) {
        const targetRoomId = roomId || mapping.roomId;
        const room = roomManager.rooms.get(targetRoomId);

        if (room) {
          if (isVideo && room.allowVideoCalls === false) {
            return socket.emit('call_error', { message: 'Video calls have been disabled by the room admin.' });
          }
          if (!isVideo && room.allowAudioCalls === false) {
            return socket.emit('call_error', { message: 'Voice calls have been disabled by the room admin.' });
          }
        }

        io.to(targetSocketId).emit('webrtc_incoming_call', {
          callerSocketId: socket.id,
          callerUser: mapping.user,
          roomId: targetRoomId,
          isVideo
        });
      }
    });

    // Accept Incoming Call
    socket.on('webrtc_accept_call', ({ callerSocketId, isVideo }) => {
      const mapping = roomManager.socketMap.get(socket.id);
      if (mapping) {
        io.to(callerSocketId).emit('webrtc_call_accepted', {
          responderSocketId: socket.id,
          responderUser: mapping.user,
          isVideo
        });
      }
    });

    // Reject Call
    socket.on('webrtc_reject_call', ({ callerSocketId }) => {
      const mapping = roomManager.socketMap.get(socket.id);
      io.to(callerSocketId).emit('webrtc_call_rejected', {
        responderUser: mapping ? mapping.user : { name: 'User' }
      });
    });

    // WebRTC SDP Offer
    socket.on('webrtc_offer', ({ targetSocketId, sdp }) => {
      io.to(targetSocketId).emit('webrtc_offer', {
        callerSocketId: socket.id,
        sdp
      });
    });

    // WebRTC SDP Answer
    socket.on('webrtc_answer', ({ targetSocketId, sdp }) => {
      io.to(targetSocketId).emit('webrtc_answer', {
        responderSocketId: socket.id,
        sdp
      });
    });

    // WebRTC ICE Candidate
    socket.on('webrtc_ice_candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('webrtc_ice_candidate', {
        senderSocketId: socket.id,
        candidate
      });
    });

    // End Call
    socket.on('webrtc_end_call', ({ targetSocketId }) => {
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_call_ended', {
          senderSocketId: socket.id
        });
      }
    });

    /**
     * GROUP / ROOM CALL SIGNALING
     */
    socket.on('join_room_call', ({ roomId, isVideo = true }, callback) => {
      try {
        const mapping = roomManager.socketMap.get(socket.id);
        if (!mapping || mapping.roomId !== roomId) {
          return callback && callback({ success: false, error: 'Not in this room' });
        }

        const room = roomManager.rooms.get(roomId);
        if (room) {
          if (isVideo && room.allowVideoCalls === false) {
            return callback && callback({ success: false, error: 'Video calls disabled by room host' });
          }
          if (!isVideo && room.allowAudioCalls === false) {
            return callback && callback({ success: false, error: 'Voice calls disabled by room host' });
          }
        }

        const result = roomManager.addCallParticipant(roomId, socket.id, mapping.user, isVideo);
        if (result.success) {
          // Notify entire room of active live call status
          io.to(roomId).emit('room_call_state_updated', result.callState);

          // Notify other participants in the call to create mesh connections
          socket.to(roomId).emit('room_call_user_joined', {
            participant: result.participant,
            socketId: socket.id
          });

          // Add automated system notice if this starts the call
          if (result.callState.participantCount === 1) {
            const sysMsg = roomManager.addMessage(roomId, {
              sender: { name: 'System', avatar: 'bot', color: '#6366f1' },
              text: `🎙️ ${mapping.user.name} started a Room Call. Click "Join Call" to connect!`,
              type: 'system'
            });
            io.to(roomId).emit('new_message', sysMsg);
          }

          if (callback) {
            callback({
              success: true,
              participant: result.participant,
              existingParticipants: result.existingParticipants,
              callState: result.callState
            });
          }
        } else {
          if (callback) callback({ success: false, error: result.error });
        }
      } catch (err) {
        console.error('Error joining room call:', err);
        if (callback) callback({ success: false, error: 'Failed to join room call' });
      }
    });

    socket.on('leave_room_call', ({ roomId }, callback) => {
      try {
        const mapping = roomManager.socketMap.get(socket.id);
        const targetRoomId = roomId || (mapping ? mapping.roomId : null);
        if (!targetRoomId) return;

        const updatedState = roomManager.removeCallParticipant(targetRoomId, socket.id);
        if (updatedState) {
          io.to(targetRoomId).emit('room_call_state_updated', updatedState);
          socket.to(targetRoomId).emit('room_call_user_left', {
            socketId: socket.id
          });
        }
        if (callback) callback({ success: true });
      } catch (err) {
        console.error('Error leaving room call:', err);
      }
    });

    // Multi-peer Mesh Signal Forwarding
    socket.on('webrtc_room_signal', ({ targetSocketId, signal }) => {
      io.to(targetSocketId).emit('webrtc_room_signal', {
        senderSocketId: socket.id,
        signal
      });
    });

    /**
     * DISCONNECT
     */
    socket.on('disconnect', () => {
      const removal = roomManager.removeUser(socket.id);
      if (removal) {
        const { roomId, user, remainingUsers, callState } = removal;
        
        // Notify others
        socket.to(roomId).emit('user_left', {
          user,
          users: remainingUsers
        });

        // Notify room call peers
        if (callState) {
          io.to(roomId).emit('room_call_state_updated', callState);
          socket.to(roomId).emit('room_call_user_left', {
            socketId: socket.id
          });
        }

        // Add a system notification message
        const sysMsg = roomManager.addMessage(roomId, {
          sender: { name: 'System', avatar: 'bot', color: '#6366f1' },
          text: `${user.name} left the room.`,
          type: 'system'
        });
        io.to(roomId).emit('new_message', sysMsg);

        // Also end any active 1-on-1 call
        socket.to(roomId).emit('webrtc_call_ended', {
          senderSocketId: socket.id
        });
      }
    });
  });
};
