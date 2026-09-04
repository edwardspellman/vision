import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Share2, 
  Minimize2, 
  Maximize2,
  Users, 
  Radio, 
  Volume2,
  Crown,
  Monitor,
  MonitorOff
} from 'lucide-react';
import { useWebRTC } from '../context/WebRTCContext';
import { useSocket } from '../context/SocketContext';
import { getAvatarSvg } from '../utils/avatar';

function RemoteVideoTile({ remote }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && remote.stream) {
      videoRef.current.srcObject = remote.stream;
      videoRef.current.play().catch(() => {});
    }
  }, [remote.stream]);

  const hasVideoTrack = remote.stream && remote.stream.getVideoTracks().some(t => t.enabled && t.readyState === 'live');

  return (
    <div className="relative bg-[#05080f] rounded-2xl overflow-hidden border border-[#161f30] aspect-video flex items-center justify-center shadow-lg group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${hasVideoTrack ? 'block' : 'hidden'}`}
      />

      {!hasVideoTrack && (
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#161f30] shadow-md bg-black">
            <img
              src={getAvatarSvg(remote.participant?.avatar || remote.participant?.name || 'peer')}
              alt={remote.participant?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs font-bold text-zinc-300">
            {remote.participant?.name || 'Participant'}
          </p>
        </div>
      )}

      {/* Overlay Badge */}
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-md rounded-lg text-[10px] font-bold text-white flex items-center space-x-1.5 border border-white/10">
        <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
        <span className="truncate max-w-[120px]">{remote.participant?.name || 'Peer'}</span>
      </div>
    </div>
  );
}

export default function RoomCallModal() {
  const { currentRoom, user } = useSocket();
  const { 
    isJoinedRoomCall,
    isRoomCallModalOpen,
    setIsRoomCallModalOpen,
    roomLocalStream,
    roomRemoteStreams,
    roomLocalVideoRef,
    isRoomMuted,
    isRoomCameraOff,
    isRoomScreenSharing,
    leaveRoomCall,
    toggleRoomMic,
    toggleRoomCamera,
    toggleRoomScreenShare
  } = useWebRTC();

  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Attach local stream to local video element
  useEffect(() => {
    if (roomLocalVideoRef.current && roomLocalStream) {
      roomLocalVideoRef.current.srcObject = roomLocalStream;
      roomLocalVideoRef.current.play().catch(() => {});
    }
  }, [roomLocalStream, isJoinedRoomCall, roomLocalVideoRef]);

  useEffect(() => {
    let interval = null;
    if (isJoinedRoomCall) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isJoinedRoomCall]);

  if (!isJoinedRoomCall || !isRoomCallModalOpen) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalParticipants = roomRemoteStreams.length + 1; // +1 for local user
  const hasLocalVideo = roomLocalStream && roomLocalStream.getVideoTracks().some(t => t.enabled && t.readyState === 'live');

  return (
    <div className={`fixed z-50 transition-all duration-300 font-mono select-none ${
      isMinimized 
        ? 'bottom-4 right-4 w-72 sm:w-80 shadow-2xl rounded-2xl overflow-hidden border border-[#00ff88]/40 bg-[#080d17]' 
        : 'inset-0 bg-black/90 backdrop-blur-md flex flex-col p-3 sm:p-6'
    }`}>
      {/* Header Bar */}
      <div className="h-14 px-4 bg-[#05080f]/90 border-b border-[#161f30] rounded-t-2xl flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                {currentRoom?.name || 'Room Call'}
              </span>
              <span className="px-1.5 py-0.2 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 rounded text-[9px] font-bold">
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              {formatDuration(callDuration)} • {totalParticipants} in call
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-[#0b101c] border border-[#161f30] transition active:scale-95"
            title={isMinimized ? 'Expand call view' : 'Minimize call'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center justify-center max-w-6xl mx-auto w-full scroll-touch">
          {/* Local User Tile */}
          <div className="relative bg-[#05080f] rounded-2xl overflow-hidden border-2 border-[#00ff88]/40 aspect-video flex items-center justify-center shadow-xl">
            <video
              ref={roomLocalVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${hasLocalVideo && !isRoomCameraOff ? 'block' : 'hidden'}`}
            />

            {(!hasLocalVideo || isRoomCameraOff) && (
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#00ff88]/30 shadow-md bg-black">
                  <img
                    src={getAvatarSvg(user.avatar || user.name)}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs font-bold text-zinc-300">
                  {user.name} (You)
                </p>
              </div>
            )}

            {/* Local Badge */}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-md rounded-lg text-[10px] font-bold text-[#00ff88] flex items-center space-x-1 border border-[#00ff88]/30">
              <span>You {isRoomMuted && '(Muted)'}</span>
            </div>
          </div>

          {/* Remote Participants Tiles */}
          {roomRemoteStreams.map((remote) => (
            <RemoteVideoTile key={remote.socketId} remote={remote} />
          ))}

          {/* Empty Waiting State */}
          {roomRemoteStreams.length === 0 && (
            <div className="col-span-full py-8 text-center text-zinc-500 text-xs">
              <p>Waiting for other peers in this room to join the call...</p>
              <p className="text-[11px] text-zinc-600 mt-1">Other members will see the live call banner in chat.</p>
            </div>
          )}
        </div>
      )}

      {/* Controls Bar */}
      <div className={`flex items-center justify-center space-x-3 bg-[#05080f] border-t border-[#161f30] rounded-b-2xl pb-safe ${
        isMinimized ? 'p-2.5' : 'p-4 shrink-0'
      }`}>
        <button
          onClick={toggleRoomMic}
          className={`p-3 rounded-full border transition active:scale-90 ${
            isRoomMuted 
              ? 'bg-[#ff3366] text-black border-[#ff3366]' 
              : 'bg-[#0b101c] text-zinc-300 border-[#1a263d] hover:border-[#00ff88]'
          }`}
          title={isRoomMuted ? 'Unmute' : 'Mute'}
        >
          {isRoomMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleRoomCamera}
          className={`p-3 rounded-full border transition active:scale-90 ${
            isRoomCameraOff 
              ? 'bg-[#ff3366] text-black border-[#ff3366]' 
              : 'bg-[#0b101c] text-zinc-300 border-[#1a263d] hover:border-[#00ff88]'
          }`}
          title={isRoomCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isRoomCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </button>

        {!isMinimized && (
          <button
            onClick={toggleRoomScreenShare}
            className={`p-3 rounded-full border transition active:scale-90 ${
              isRoomScreenSharing 
                ? 'bg-[#00f0ff] text-black border-[#00f0ff]' 
                : 'bg-[#0b101c] text-zinc-300 border-[#1a263d] hover:border-[#00f0ff]'
            }`}
            title={isRoomScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            {isRoomScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </button>
        )}

        <button
          onClick={leaveRoomCall}
          className="p-3 bg-[#ff3366] hover:bg-[#ff1a53] text-black rounded-full font-bold transition flex items-center space-x-1 shadow-lg active:scale-90"
          title="Leave Room Call"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
