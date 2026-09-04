import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSocket } from './SocketContext';
import { sound } from '../utils/sound';

const WebRTCContext = createContext();

// Enhanced ICE Servers with Public STUN & Free OpenRelay TURN for strict firewalls/Wi-Fi routers
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
      urls: [
        'stun:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelay',
      credential: 'openrelay'
    }
  ],
  iceCandidatePoolSize: 10
};

export function WebRTCProvider({ children }) {
  const { socket, currentRoom, user } = useSocket();

  // 1-on-1 Call States
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected'
  const [callStatusText, setCallStatusText] = useState('');
  const [isVideoCall, setIsVideoCall] = useState(true);
  const [callerInfo, setCallerInfo] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Group Room Call States
  const [roomCallState, setRoomCallState] = useState({ isLive: false, participantCount: 0, participants: [] });
  const [isJoinedRoomCall, setIsJoinedRoomCall] = useState(false);
  const [isRoomCallModalOpen, setIsRoomCallModalOpen] = useState(false);
  const [isRoomCallVideo, setIsRoomCallVideo] = useState(true);
  const [roomLocalStream, setRoomLocalStream] = useState(null);
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
  const oneOnOneIceQueueRef = useRef([]);

  // Group Call Refs
  const roomLocalStreamRef = useRef(null);
  const roomPeerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const roomLocalVideoRef = useRef(null);
  const roomIceQueuesRef = useRef(new Map()); // socketId -> Array of ICE candidates

  // Sync Room Call State when entering room
  useEffect(() => {
    if (currentRoom?.activeCall) {
      setRoomCallState(currentRoom.activeCall);
    } else {
      setRoomCallState({ isLive: false, participantCount: 0, participants: [] });
    }
  }, [currentRoom]);

  /**
   * Helper to safely acquire microphone & camera with audio fallback & browser security warnings
   */
  const getMediaStream = async (requestedVideo = true) => {
    // Check if mediaDevices API exists
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const lanHttpsUrl = `https://${window.location.hostname}:3443`;
      if (!isLocalhost && window.location.protocol !== 'https:') {
        const proceed = window.confirm(
          `📱 Mobile & Wi-Fi Camera/Microphone Access Notice\n\n` +
          `Modern browsers block camera & audio calls over plain HTTP (${window.location.origin}).\n\n` +
          `Would you like to switch to the secure HTTPS server now (${lanHttpsUrl})?`
        );
        if (proceed) {
          window.location.href = lanHttpsUrl;
        }
      }
      throw new Error('MEDIA_DEVICES_NOT_SUPPORTED');
    }

    try {
      // First attempt: Request video + audio
      if (requestedVideo) {
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user'
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
        } catch (videoErr) {
          console.warn('Camera failed or not present, falling back to audio only:', videoErr);
          setIsCameraOff(true);
        }
      }

      // Fallback attempt: Audio only
      return await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    } catch (err) {
      console.error('All media devices acquisition failed:', err);
      alert('Could not access microphone or camera. Please make sure permissions are allowed in your browser settings.');
      throw err;
    }
  };

  /**
   * Safe ICE Candidate Helpers
   */
  const add1on1IceCandidate = async (pc, candidate) => {
    if (!pc || !candidate) return;
    if (!pc.remoteDescription || !pc.remoteDescription.type) {
      oneOnOneIceQueueRef.current.push(candidate);
    } else {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('Failed adding 1-on-1 ICE candidate:', e);
      }
    }
  };

  const flush1on1IceQueue = async (pc) => {
    if (!pc) return;
    while (oneOnOneIceQueueRef.current.length > 0) {
      const candidate = oneOnOneIceQueueRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('Failed adding queued 1-on-1 candidate:', e);
      }
    }
  };

  const addRoomIceCandidate = async (pc, candidate, socketId) => {
    if (!pc || !candidate) return;
    if (!pc.remoteDescription || !pc.remoteDescription.type) {
      if (!roomIceQueuesRef.current.has(socketId)) {
        roomIceQueuesRef.current.set(socketId, []);
      }
      roomIceQueuesRef.current.get(socketId).push(candidate);
    } else {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn(`Failed adding Room ICE candidate for ${socketId}:`, e);
      }
    }
  };

  const flushRoomIceQueue = async (pc, socketId) => {
    if (!pc) return;
    const queue = roomIceQueuesRef.current.get(socketId) || [];
    while (queue.length > 0) {
      const candidate = queue.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn(`Failed adding queued Room ICE candidate for ${socketId}:`, e);
      }
    }
  };

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
      setCallStatusText('Incoming Call...');
      sound.startRingtone();
    });

    socket.on('webrtc_call_accepted', async ({ responderSocketId, responderUser, isVideo }) => {
      sound.playCallConnected();
      setRemoteUser(responderUser);
      setCallState('connected');
      setCallStatusText('Connecting peer-to-peer stream...');
      
      try {
        const pc = createPeerConnection(responderSocketId);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: isVideo
        });
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_offer', { targetSocketId: responderSocketId, sdp: offer });
      } catch (err) {
        console.error('Failed creating 1-on-1 offer:', err);
      }
    });

    socket.on('webrtc_call_rejected', ({ responderUser }) => {
      sound.stopRingtone();
      alert(`${responderUser?.name || 'Peer'} is busy or declined the call.`);
      cleanupCall();
    });

    socket.on('webrtc_offer', async ({ callerSocketId, sdp }) => {
      try {
        setCallStatusText('Negotiating connection...');
        let pc = peerConnectionRef.current;
        if (!pc) {
          pc = createPeerConnection(callerSocketId);
        }
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flush1on1IceQueue(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', { targetSocketId: callerSocketId, sdp: answer });
      } catch (err) {
        console.error('Failed handling 1-on-1 offer:', err);
      }
    });

    socket.on('webrtc_answer', async ({ responderSocketId, sdp }) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          await flush1on1IceQueue(peerConnectionRef.current);
          setCallStatusText('Connected');
        }
      } catch (err) {
        console.error('Failed handling 1-on-1 answer:', err);
      }
    });

    socket.on('webrtc_ice_candidate', async ({ senderSocketId, candidate }) => {
      if (peerConnectionRef.current) {
        await add1on1IceCandidate(peerConnectionRef.current, candidate);
      }
    });

    socket.on('webrtc_call_ended', () => {
      sound.stopRingtone();
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
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
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
      roomIceQueuesRef.current.delete(leftPeerSocketId);
      setRoomRemoteStreams((prev) => prev.filter((p) => p.socketId !== leftPeerSocketId));
    });

    // Mesh signal receiver
    socket.on('webrtc_room_signal', async ({ senderSocketId, signal }) => {
      if (!roomLocalStreamRef.current) return;

      try {
        if (signal.type === 'offer') {
          const pc = createRoomPeerConnection(senderSocketId, signal.senderParticipant);
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await flushRoomIceQueue(pc, senderSocketId);
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
            await flushRoomIceQueue(pc, senderSocketId);
          }
        } else if (signal.type === 'candidate') {
          const pc = roomPeerConnectionsRef.current.get(senderSocketId);
          if (pc) {
            await addRoomIceCandidate(pc, signal.candidate, senderSocketId);
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
    oneOnOneIceQueueRef.current = [];

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setCallStatusText('Connected');
      } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setCallStatusText('Reconnecting media...');
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        setRemoteStream(stream);
        setCallStatusText('Connected');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(() => {});
        }
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
    roomIceQueuesRef.current.set(targetSocketId, []);

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
      if (event.streams && event.streams[0]) {
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
      setCallStatusText('Requesting permissions & calling...');
      sound.startRingtone();

      const stream = await getMediaStream(isVideo);
      localStreamRef.current = stream;
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      setCallStatusText('Ringing...');

      socket.emit('webrtc_call_user', {
        targetSocketId,
        roomId: currentRoom?.id,
        isVideo
      });
    } catch (err) {
      console.error('Start call error:', err);
      sound.stopRingtone();
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    try {
      sound.stopRingtone();
      sound.playCallConnected();
      setCallState('connected');
      setCallStatusText('Connecting audio & video...');
      setRemoteUser(callerInfo?.user);

      const stream = await getMediaStream(isVideoCall);
      localStreamRef.current = stream;
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      // Pre-create peer connection
      createPeerConnection(callerInfo.socketId);

      socket.emit('webrtc_accept_call', {
        callerSocketId: callerInfo.socketId,
        isVideo: isVideoCall
      });
    } catch (err) {
      console.error('Accept call error:', err);
      sound.stopRingtone();
      cleanupCall();
    }
  };

  const rejectCall = () => {
    sound.stopRingtone();
    if (callerInfo && socket) {
      socket.emit('webrtc_reject_call', {
        callerSocketId: callerInfo.socketId
      });
    }
    cleanupCall();
  };

  const endCall = () => {
    sound.stopRingtone();
    if (activePeerSocketId.current && socket) {
      socket.emit('webrtc_end_call', {
        targetSocketId: activePeerSocketId.current
      });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    sound.stopRingtone();
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

    oneOnOneIceQueueRef.current = [];
    activePeerSocketId.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallerInfo(null);
    setRemoteUser(null);
    setCallState('idle');
    setCallStatusText('');
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
        if (!navigator.mediaDevices?.getDisplayMedia) {
          alert('Screen sharing is not supported on this browser or context.');
          return;
        }
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
          localVideoRef.current.play().catch(() => {});
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
      localVideoRef.current.play().catch(() => {});
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
      sound.playCallConnected();

      const stream = await getMediaStream(isVideo);
      roomLocalStreamRef.current = stream;
      setRoomLocalStream(stream);

      if (roomLocalVideoRef.current) {
        roomLocalVideoRef.current.srcObject = stream;
        roomLocalVideoRef.current.play().catch(() => {});
      }

      socket.emit('join_room_call', { roomId: currentRoom.id, isVideo }, (response) => {
        if (response && response.success) {
          // If there are existing participants, create mesh offers to each
          if (response.existingParticipants && response.existingParticipants.length > 0) {
            response.existingParticipants.forEach(async (participant) => {
              try {
                const pc = createRoomPeerConnection(participant.socketId, participant);
                const offer = await pc.createOffer({
                  offerToReceiveAudio: true,
                  offerToReceiveVideo: true
                });
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
    roomIceQueuesRef.current.clear();

    setRoomLocalStream(null);
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
        if (!navigator.mediaDevices?.getDisplayMedia) {
          alert('Screen sharing is not supported on this browser or context.');
          return;
        }
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace track across all mesh peer connections
        roomPeerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        if (roomLocalVideoRef.current) {
          roomLocalVideoRef.current.srcObject = screenStream;
          roomLocalVideoRef.current.play().catch(() => {});
        }

        screenTrack.onended = () => {
          stopRoomScreenSharing();
        };

        setIsRoomScreenSharing(true);
      } catch (err) {
        console.error('Error sharing screen in room call:', err);
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
      roomLocalVideoRef.current.play().catch(() => {});
    }

    setIsRoomScreenSharing(false);
  };

  const value = {
    // 1-on-1 Call state
    callState,
    callStatusText,
    isVideoCall,
    callerInfo,
    remoteUser,
    isMuted,
    isCameraOff,
    isScreenSharing,
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare,

    // Group Room Call state
    roomCallState,
    isJoinedRoomCall,
    isRoomCallModalOpen,
    setIsRoomCallModalOpen,
    isRoomCallVideo,
    roomLocalStream,
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
  };

  return <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>;
}

export function useWebRTC() {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
}
