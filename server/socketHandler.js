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
        const { roomId, name, password, isPrivate, maxUsers, requireApproval, user } = data;
        
        if (!roomId || !roomId.trim()) {
          return callback && callback({ success: false, error: 'Room ID is required' });
        }

        const result = roomManager.createRoom({
          roomId,
          name: name || roomId,
          password,
          isPrivate,
          requireApproval,
          hostUser: user,
          maxUsers: maxUsers || 50
        });

        if (!result.success) {
          return callback && callback({ success: false, error: result.error });
        }

        // Auto join the creator to this room as Host
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

        // Attempt to find or create auto room
        let room = roomManager.rooms.get(targetRoomId);
        if (!room && (targetRoomId.startsWith('LAN-') || targetRoomId.startsWith('IP-'))) {
          room = roomManager.getOrCreateAutoRoom({
            roomId: targetRoomId,
            roomName: autoRoom.roomName,
            isLocal: autoRoom.isLocal,
            networkType: autoRoom.networkType
          });
        }

        if (!room) {
          return callback && callback({
            success: false,
            error: 'Room not found. Check the Room ID or create a new room.'
          });
        }

        // Check password first
        if (room.hasPassword && !roomManager.verifyPassword(room, password)) {
          return callback && callback({
            success: false,
            error: 'Incorrect room password',
            requiresPassword: true
          });
        }

        // Check Host Approval (Knocking Mode) if user is not host and approval is enabled
        const isHostUser = (room.hostId && user && user.id === room.hostId) || room.users.size === 0;
        if (room.requireApproval && !isHostUser) {
          const hostSocketId = roomManager.getHostSocketId(targetRoomId);
          if (hostSocketId && hostSocketId !== socket.id) {
            roomManager.addPendingApproval(socket.id, targetRoomId, user);
            
            // Emit to host that candidate is knocking
            io.to(hostSocketId).emit('host_approval_request', {
              candidateSocketId: socket.id,
              candidateUser: user,
              roomId: targetRoomId,
              roomName: room.name
            });

            return callback && callback({
              success: false,
              pendingApproval: true,
              message: 'Room requires host approval. Knocking request sent to host.'
            });
          }
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
     * HOST RESPOND TO APPROVAL (ACCEPT / DENY)
     */
    socket.on('respond_approval', ({ candidateSocketId, roomId, approve }, callback) => {
      try {
        const room = roomManager.rooms.get(roomId);
        if (!room) return callback && callback({ success: false, error: 'Room not found' });

        const hostSocketId = roomManager.getHostSocketId(roomId);
        if (hostSocketId !== socket.id) {
          return callback && callback({ success: false, error: 'Only the host can approve candidates' });
        }

        roomManager.removePendingApproval(candidateSocketId, roomId);

        const candidateSocket = io.sockets.sockets.get(candidateSocketId);
        if (!candidateSocket) {
          return callback && callback({ success: false, error: 'Candidate disconnected' });
        }

        if (approve) {
          const mapping = candidateSocket.handshake; // fallback user data
          // Emit approval granted to candidate so candidate can re-trigger join_room with bypass
          candidateSocket.emit('approval_granted', { roomId, roomName: room.name });
          if (callback) callback({ success: true, approved: true });
        } else {
          candidateSocket.emit('approval_denied', { roomId, message: 'Host declined your request to join the room.' });
          if (callback) callback({ success: true, approved: false });
        }
      } catch (err) {
        console.error('Error responding to approval:', err);
        if (callback) callback({ success: false, error: 'Error processing approval' });
      }
    });

    /**
     * UPDATE ROOM SETTINGS (Host)
     */
    socket.on('update_room_settings', ({ roomId, settings }, callback) => {
      try {
        const result = roomManager.updateRoomSettings(roomId, socket.id, settings);
        if (result.success) {
          io.to(roomId).emit('room_settings_updated', result.room);
          if (callback) callback({ success: true, room: result.room });
        } else {
          if (callback) callback({ success: false, error: result.error });
        }
      } catch (err) {
        console.error('Error updating room settings:', err);
        if (callback) callback({ success: false, error: 'Failed to update settings' });
      }
    });

    /**
     * LEAVE ROOM (User voluntarily leaves current room)
     */
    socket.on('leave_room', (data, callback) => {
      try {
        const removal = roomManager.removeUser(socket.id);
        if (removal) {
          const { roomId, user, remainingUsers } = removal;
          socket.leave(roomId);

          socket.to(roomId).emit('user_left', {
            user,
            users: remainingUsers
          });

          const sysMsg = roomManager.addMessage(roomId, {
            sender: { name: 'System', avatar: 'bot', color: '#6366f1' },
            text: `${user.name} left the room.`,
            type: 'system'
          });
          io.to(roomId).emit('new_message', sysMsg);
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
        io.to(targetSocketId).emit('webrtc_incoming_call', {
          callerSocketId: socket.id,
          callerUser: mapping.user,
          roomId,
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
     * DISCONNECT
     */
    socket.on('disconnect', () => {
      const removal = roomManager.removeUser(socket.id);
      if (removal) {
        const { roomId, user, remainingUsers } = removal;
        
        // Notify others
        socket.to(roomId).emit('user_left', {
          user,
          users: remainingUsers
        });

        // Add a system notification message
        const sysMsg = roomManager.addMessage(roomId, {
          sender: { name: 'System', avatar: 'bot', color: '#6366f1' },
          text: `${user.name} left the room.`,
          type: 'system'
        });
        io.to(roomId).emit('new_message', sysMsg);

        // Also end any active call the user was in
        socket.to(roomId).emit('webrtc_call_ended', {
          senderSocketId: socket.id
        });
      }
    });
  });
};
