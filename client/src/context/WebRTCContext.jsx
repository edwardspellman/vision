import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSocket } from './SocketContext';

const WebRTCContext = createContext();

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export function WebRTCProvider({ children }) {
  const { socket, currentRoom, user } = useSocket();

  // 1-on-1 Call States
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected'
  const [isVideoCall, setIsVideoCall] = useState(true);
  const [callerInfo, setCallerInfo] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Group Room Call States
  const [roomCallState, setRoomCallState] = useState({ isLive: false, participantCount: 0, participants: [] });
  const [isJoinedRoomCall, setIsJoinedRoomCall] = useState(false);
  const [isRoomCallModalOpen, setIsRoomCallModalOpen] = useState(false);
  const [isRoomCallVideo, setIsRoomCallVideo] = useState(true);
  const [roomRemoteStreams, setRoomRemoteStreams] = useState([]); // [{ socketId, participant, stream }]
  const [isRoomMuted, setIsRoomMuted] = useState(false);
  const [isRoomCameraOff, setIsRoomCameraOff] = useState(false);
  const [isRoomScreenSharing, setIsRoomScreenSharing] = useState(false);

  // 1-on-1 Refs
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const activePeerSocketId = useRef(null);

  // Group Call Refs
  const roomLocalStreamRef = useRef(null);
  const roomPeerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const roomLocalVideoRef = useRef(null);

  // Sync Room Call State when entering room
  useEffect(() => {
    if (currentRoom?.activeCall) {
      setRoomCallState(currentRoom.activeCall);
    } else {
      setRoomCallState({ isLive: false, participantCount: 0, participants: [] });
    }
  }, [currentRoom]);

  // Setup WebRTC socket listeners
  useEffect(() => {
    if (!socket) return;

    // --- 1-ON-1 CALL LISTENERS ---
    socket.on('webrtc_incoming_call', ({ callerSocketId, callerUser, isVideo }) => {
      if (callState !== 'idle' || isJoinedRoomCall) {
        socket.emit('webrtc_reject_call', { callerSocketId });
        return;
      }
      activePeerSocketId.current = callerSocketId;
      setCallerInfo({ socketId: callerSocketId, user: callerUser });
      setIsVideoCall(isVideo);
      setCallState('incoming');
    });

    socket.on('webrtc_call_accepted', async ({ responderSocketId, responderUser, isVideo }) => {
      setRemoteUser(responderUser);
      setCallState('connected');
      
      try {
        const pc = createPeerConnection(responderSocketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_offer', { targetSocketId: responderSocketId, sdp: offer });
      } catch (err) {
        console.error('Failed creating offer:', err);
      }
    });

    socket.on('webrtc_call_rejected', ({ responderUser }) => {
      alert(`${responderUser?.name || 'User'} declined the call.`);
      cleanupCall();
    });

    socket.on('webrtc_offer', async ({ callerSocketId, sdp }) => {
      try {
        const pc = createPeerConnection(callerSocketId);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', { targetSocketId: callerSocketId, sdp: answer });
      } catch (err) {
        console.error('Failed handling offer:', err);
      }
    });

    socket.on('webrtc_answer', async ({ responderSocketId, sdp }) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        }
      } catch (err) {
        console.error('Failed handling answer:', err);
      }
    });

    socket.on('webrtc_ice_candidate', async ({ senderSocketId, candidate }) => {
      try {
        if (peerConnectionRef.current && candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Failed adding ICE candidate:', err);
      }
    });

    socket.on('webrtc_call_ended', () => {
      cleanupCall();
    });

    // --- GROUP ROOM CALL LISTENERS ---
    socket.on('room_call_state_updated', (callState) => {
      setRoomCallState(callState);
    });

    // When another peer joins the group call
    socket.on('room_call_user_joined', async ({ participant, socketId: newPeerSocketId }) => {
      if (!roomLocalStreamRef.current) return;

      try {
        const pc = createRoomPeerConnection(newPeerSocketId, participant);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('webrtc_room_signal', {
          targetSocketId: newPeerSocketId,
          signal: { type: 'offer', sdp: offer, senderParticipant: { ...user, socketId: socket.id } }
        });
      } catch (err) {
        console.error('Failed creating mesh offer to new participant:', err);
      }
    });

    // When another peer leaves the group call
    socket.on('room_call_user_left', ({ socketId: leftPeerSocketId }) => {
      const pc = roomPeerConnectionsRef.current.get(leftPeerSocketId);
      if (pc) {
        pc.close();
        roomPeerConnectionsRef.current.delete(leftPeerSocketId);
      }
      setRoomRemoteStreams((prev) => prev.filter((p) => p.socketId !== leftPeerSocketId));
    });

    // Mesh signal receiver
    socket.on('webrtc_room_signal', async ({ senderSocketId, signal }) => {
      if (!roomLocalStreamRef.current) return;

      try {
        if (signal.type === 'offer') {
          const pc = createRoomPeerConnection(senderSocketId, signal.senderParticipant);
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('webrtc_room_signal', {
            targetSocketId: senderSocketId,
            signal: { type: 'answer', sdp: answer }
          });
        } else if (signal.type === 'answer') {
          const pc = roomPeerConnectionsRef.current.get(senderSocketId);
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          }
        } else if (signal.type === 'candidate') {
          const pc = roomPeerConnectionsRef.current.get(senderSocketId);
          if (pc && signal.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
      } catch (err) {
        console.error('Error handling mesh WebRTC room signal:', err);
      }
    });

    return () => {
      socket.off('webrtc_incoming_call');
      socket.off('webrtc_call_accepted');
      socket.off('webrtc_call_rejected');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
      socket.off('webrtc_call_ended');
      socket.off('room_call_state_updated');
      socket.off('room_call_user_joined');
      socket.off('room_call_user_left');
      socket.off('webrtc_room_signal');
    };
  }, [socket, callState, isJoinedRoomCall, user]);

  /**
   * Helper to create 1-on-1 RTCPeerConnection
   */
  const createPeerConnection = (targetSocketId) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_ice_candidate', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    return pc;
  };

  /**
   * Helper to create Mesh RTCPeerConnection for a room participant
   */
  const createRoomPeerConnection = (targetSocketId, participant) => {
    let pc = roomPeerConnectionsRef.current.get(targetSocketId);
    if (pc) {
      pc.close();
    }

    pc = new RTCPeerConnection(ICE_SERVERS);
    roomPeerConnectionsRef.current.set(targetSocketId, pc);

    // Add local room tracks to this peer connection
    if (roomLocalStreamRef.current) {
      roomLocalStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, roomLocalStreamRef.current);
      });
    }

    // When remote media track arrives
    pc.ontrack = (event) => {
      if (event.streams[0]) {
        const stream = event.streams[0];
        setRoomRemoteStreams((prev) => {
          const filtered = prev.filter((p) => p.socketId !== targetSocketId);
          return [...filtered, { socketId: targetSocketId, participant, stream }];
        });
      }
    };

    // Forward ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_room_signal', {
          targetSocketId,
          signal: { type: 'candidate', candidate: event.candidate }
        });
      }
    };

    return pc;
  };

  // --- 1-ON-1 CALL ACTIONS ---
  const startCall = async (targetSocketId, targetUser, isVideo = true) => {
    try {
      activePeerSocketId.current = targetSocketId;
      setRemoteUser(targetUser);
      setIsVideoCall(isVideo);
      setCallState('calling');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socket.emit('webrtc_call_user', {
        targetSocketId,
        roomId: currentRoom?.id,
        isVideo
      });
    } catch (err) {
      console.error('Media devices access failed:', err);
      alert('Could not access camera or microphone. Please check browser permissions.');
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    try {
      setCallState('connected');
      setRemoteUser(callerInfo.user);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoCall,
        audio: true
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socket.emit('webrtc_accept_call', {
        callerSocketId: callerInfo.socketId,
        isVideo: isVideoCall
      });
    } catch (err) {
      console.error('Accept call failed:', err);
      alert('Could not access camera/mic to accept the call.');
      cleanupCall();
    }
  };

  const rejectCall = () => {
    if (callerInfo && socket) {
      socket.emit('webrtc_reject_call', {
        callerSocketId: callerInfo.socketId
      });
    }
    cleanupCall();
  };

  const endCall = () => {
    if (activePeerSocketId.current && socket) {
      socket.emit('webrtc_end_call', {
        targetSocketId: activePeerSocketId.current
      });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    activePeerSocketId.current = null;
    setCallerInfo(null);
    setRemoteUser(null);
    setCallState('idle');
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');

        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenSharing();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen sharing error:', err);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = async () => {
    if (!localStreamRef.current) return;
    const cameraTrack = localStreamRef.current.getVideoTracks()[0];
    const sender = peerConnectionRef.current
      ?.getSenders()
      ?.find((s) => s.track && s.track.kind === 'video');

    if (sender && cameraTrack) {
      sender.replaceTrack(cameraTrack);
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    setIsScreenSharing(false);
  };

  // --- GROUP ROOM CALL ACTIONS ---
  const startOrJoinRoomCall = async (isVideo = true) => {
    if (!socket || !currentRoom) return;

    try {
      setIsRoomCallVideo(isVideo);
      setIsJoinedRoomCall(true);
      setIsRoomCallModalOpen(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });
      roomLocalStreamRef.current = stream;

      if (roomLocalVideoRef.current) {
        roomLocalVideoRef.current.srcObject = stream;
      }

      socket.emit('join_room_call', { roomId: currentRoom.id, isVideo }, (response) => {
        if (response && response.success) {
          // If there are existing participants, mesh connect to them
          if (response.existingParticipants && response.existingParticipants.length > 0) {
            response.existingParticipants.forEach(async (participant) => {
              try {
                const pc = createRoomPeerConnection(participant.socketId, participant);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                socket.emit('webrtc_room_signal', {
                  targetSocketId: participant.socketId,
                  signal: { type: 'offer', sdp: offer, senderParticipant: { ...user, socketId: socket.id } }
                });
              } catch (err) {
                console.error('Failed to create offer to existing call peer:', err);
              }
            });
          }
        } else {
          alert(response?.error || 'Could not join room call');
          leaveRoomCall();
        }
      });
    } catch (err) {
      console.error('Error starting room call:', err);
      alert('Could not access microphone/camera for Room Call.');
      leaveRoomCall();
    }
  };

  const leaveRoomCall = () => {
    if (roomLocalStreamRef.current) {
      roomLocalStreamRef.current.getTracks().forEach((track) => track.stop());
      roomLocalStreamRef.current = null;
    }

    roomPeerConnectionsRef.current.forEach((pc) => pc.close());
    roomPeerConnectionsRef.current.clear();

    setRoomRemoteStreams([]);
    setIsJoinedRoomCall(false);
    setIsRoomCallModalOpen(false);
    setIsRoomMuted(false);
    setIsRoomCameraOff(false);
    setIsRoomScreenSharing(false);

    if (socket && currentRoom) {
      socket.emit('leave_room_call', { roomId: currentRoom.id });
    }
  };

  const toggleRoomMic = () => {
    if (roomLocalStreamRef.current) {
      const audioTrack = roomLocalStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsRoomMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleRoomCamera = () => {
    if (roomLocalStreamRef.current) {
      const videoTrack = roomLocalStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsRoomCameraOff(!videoTrack.enabled);
      }
    }
  };

  const toggleRoomScreenShare = async () => {
    if (!roomLocalStreamRef.current) return;

    if (!isRoomScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace track across all peer connections in the mesh
        roomPeerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        if (roomLocalVideoRef.current) {
          roomLocalVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopRoomScreenSharing();
        };

        setIsRoomScreenSharing(true);
      } catch (err) {
        console.error('Room screen share failed:', err);
      }
    } else {
      stopRoomScreenSharing();
    }
  };

  const stopRoomScreenSharing = () => {
    if (!roomLocalStreamRef.current) return;
    const cameraTrack = roomLocalStreamRef.current.getVideoTracks()[0];

    roomPeerConnectionsRef.current.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender && cameraTrack) {
        sender.replaceTrack(cameraTrack);
      }
    });

    if (roomLocalVideoRef.current) {
      roomLocalVideoRef.current.srcObject = roomLocalStreamRef.current;
    }
    setIsRoomScreenSharing(false);
  };

  return (
    <WebRTCContext.Provider
      value={{
        // 1-on-1 Call
        callState,
        isVideoCall,
        callerInfo,
        remoteUser,
        isMuted,
        isCameraOff,
        isScreenSharing,
        localVideoRef,
        remoteVideoRef,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMic,
        toggleCamera,
        toggleScreenShare,

        // Group Room Call
        roomCallState,
        isJoinedRoomCall,
        isRoomCallModalOpen,
        setIsRoomCallModalOpen,
        isRoomCallVideo,
        roomRemoteStreams,
        roomLocalVideoRef,
        isRoomMuted,
        isRoomCameraOff,
        isRoomScreenSharing,
        startOrJoinRoomCall,
        leaveRoomCall,
        toggleRoomMic,
        toggleRoomCamera,
        toggleRoomScreenShare
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
}

export const useWebRTC = () => useContext(WebRTCContext);
