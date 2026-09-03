import React, { useState, useEffect } from 'react';
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
  Crown
} from 'lucide-react';
import { useWebRTC } from '../context/WebRTCContext';
import { useSocket } from '../context/SocketContext';
import { getAvatarSvg } from '../utils/avatar';

function RemoteVideoTile({ remote }) {
  const videoRef = React.useRef(null);

  useEffect(() => {
    if (videoRef.current && remote.stream) {
      videoRef.current.srcObject = remote.stream;
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
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#161f30] shadow-md">
            <img
              src={getAvatarSvg(remote.participant?.avatar || remote.participant?.name)}
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
              className={`w-full h-full object-cover mirror ${!isRoomCameraOff ? 'block' : 'hidden'}`}
            />

            {isRoomCameraOff && (
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#00ff88]/40 shadow-md">
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

            {/* Overlay Badge */}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-md rounded-lg text-[10px] font-bold text-[#00ff88] flex items-center space-x-1.5 border border-[#00ff88]/30">
              <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
              <span>You {isRoomMuted && '(Muted)'}</span>
            </div>
          </div>

          {/* Remote Participants */}
          {roomRemoteStreams.map((remote) => (
            <RemoteVideoTile key={remote.socketId} remote={remote} />
          ))}

          {/* Waiting for more peers placeholder if only 1 */}
          {roomRemoteStreams.length === 0 && (
            <div className="border-2 border-dashed border-[#161f30] rounded-2xl aspect-video flex flex-col items-center justify-center p-6 text-center text-zinc-500">
              <Users className="w-8 h-8 text-zinc-600 mb-2 animate-pulse" />
              <p className="text-xs font-bold text-zinc-400">Waiting for members to join...</p>
              <p className="text-[10px] text-zinc-600 mt-1">Anyone in this room can click "Join Call"</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom Control Dock */}
      <div className="p-3 bg-[#05080f]/90 border-t border-[#161f30] rounded-b-2xl flex items-center justify-center space-x-3 shrink-0">
        {/* Toggle Mute */}
        <button
          onClick={toggleRoomMic}
          className={`p-3 rounded-xl border transition active:scale-95 ${
            isRoomMuted 
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' 
              : 'bg-[#0b101c] border-[#1a263d] text-zinc-200 hover:text-[#00ff88] hover:border-[#00ff88]/40'
          }`}
          title={isRoomMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isRoomMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Toggle Camera */}
        <button
          onClick={toggleRoomCamera}
          className={`p-3 rounded-xl border transition active:scale-95 ${
            isRoomCameraOff 
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' 
              : 'bg-[#0b101c] border-[#1a263d] text-zinc-200 hover:text-[#00f0ff] hover:border-[#00f0ff]/40'
          }`}
          title={isRoomCameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isRoomCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </button>

        {/* Toggle Screen Share */}
        <button
          onClick={toggleRoomScreenShare}
          className={`p-3 rounded-xl border transition active:scale-95 ${
            isRoomScreenSharing 
              ? 'bg-[#00ff88]/20 border-[#00ff88]/40 text-[#00ff88]' 
              : 'bg-[#0b101c] border-[#1a263d] text-zinc-200 hover:text-[#00ff88] hover:border-[#00ff88]/40'
          }`}
          title={isRoomScreenSharing ? 'Stop screen sharing' : 'Share your screen'}
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Leave Call Button */}
        <button
          onClick={leaveRoomCall}
          className="px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-lg active:scale-95"
          title="Leave Room Call"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Leave Call</span>
        </button>
      </div>
    </div>
  );
}
