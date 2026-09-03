import React from 'react';
import { 
  Users, 
  Smartphone, 
  Monitor, 
  Video, 
  Phone, 
  Wifi, 
  X, 
  Copy, 
  Check, 
  Crown,
  LogOut,
  LogIn,
  Settings,
  ShieldCheck,
  PhoneOff,
  VideoOff
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';
import { getAvatarSvg } from '../utils/avatar';

export default function Sidebar({ isOpen, onClose, onOpenShareModal, onOpenRoomModal, onOpenRoomSettingsModal }) {
  const { currentRoom, roomUsers, user, ipInfo, leaveRoom } = useSocket();
  const { 
    startCall, 
    roomCallState, 
    isJoinedRoomCall, 
    startOrJoinRoomCall, 
    setIsRoomCallModalOpen 
  } = useWebRTC();
  const [copied, setCopied] = React.useState(false);

  const isCustomRoom = Boolean(
    currentRoom?.isCustom || 
    (currentRoom && ipInfo?.autoRoom?.roomId && currentRoom.id !== ipInfo.autoRoom.roomId)
  );

  const isHost = Boolean(
    currentRoom?.hostId && (currentRoom.hostId === user.id || currentRoom.hostId === user.name)
  );

  const callsAllowed = currentRoom?.allowAudioCalls !== false || currentRoom?.allowVideoCalls !== false;

  const handleCopyRoomId = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = () => {
    if (window.confirm('Are you sure you want to leave this room?')) {
      leaveRoom();
      if (onClose) onClose();
    }
  };

  const handleOpenRooms = () => {
    if (onOpenRoomModal) onOpenRoomModal();
    if (onClose) onClose();
  };

  const handleOpenRoomSettings = () => {
    if (onOpenRoomSettingsModal) onOpenRoomSettingsModal();
    if (onClose) onClose();
  };

  const handleRoomCallClick = () => {
    if (isJoinedRoomCall) {
      setIsRoomCallModalOpen(true);
    } else {
      startOrJoinRoomCall(true);
    }
    if (onClose && window.innerWidth < 768) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        />
      )}

      <aside className={`
        fixed md:static top-0 right-0 bottom-0 z-50 md:z-20
        w-80 max-w-[85vw] md:w-72 bg-[#05080f] border-l border-[#161f30] flex flex-col font-mono select-none
        transition-transform duration-300 ease-in-out pt-safe pb-safe
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="h-14 px-4 border-b border-[#161f30] flex items-center justify-between shrink-0 bg-[#070b14]">
          <div className="flex items-center space-x-2 text-zinc-200">
            <Users className="w-4 h-4 text-[#00ff88]" />
            <span className="font-bold text-xs tracking-wide">Members</span>
            <span className="text-xs bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 px-2 py-0.5 rounded-full font-bold">
              {roomUsers.length}
            </span>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg md:hidden transition active:scale-95 bg-[#0b101c] border border-[#161f30]"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Room Box */}
        <div className="p-3 border-b border-[#161f30] bg-[#080d17]">
          <div className="bg-[#05080f] rounded-lg p-3 border border-[#161f30] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Current Room
              </span>
              <button 
                onClick={handleCopyRoomId}
                className="text-xs text-[#00ff88] hover:underline flex items-center space-x-1 font-semibold active:scale-95 transition"
                title="Copy Room Link / Code"
              >
                {copied ? <Check className="w-3 h-3 text-[#00ff88]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Share'}</span>
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-100 truncate">
                {currentRoom?.name || 'Local Network'}
              </p>
            </div>

            {/* Room Permission Badges */}
            {isCustomRoom && (
              <div className="flex items-center space-x-1.5 pt-1 text-[9px] font-bold">
                <span className={`px-1.5 py-0.5 rounded border ${currentRoom.allowAudioCalls !== false ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                  Audio: {currentRoom.allowAudioCalls !== false ? 'ON' : 'OFF'}
                </span>
                <span className={`px-1.5 py-0.5 rounded border ${currentRoom.allowVideoCalls !== false ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                  Video: {currentRoom.allowVideoCalls !== false ? 'ON' : 'OFF'}
                </span>
              </div>
            )}

            {/* Room Actions */}
            <div className="space-y-1.5 mt-1.5 pt-1 border-t border-[#161f30]">
              {/* Group Room Call Button */}
              {callsAllowed && (
                <button
                  onClick={handleRoomCallClick}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95 ${
                    roomCallState.isLive
                      ? 'bg-[#a855f7]/20 hover:bg-[#a855f7]/30 text-[#c084fc] border border-[#a855f7]/40 shadow-sm'
                      : 'bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30'
                  }`}
                  title={roomCallState.isLive ? 'Join Active Room Call' : 'Start Room Call'}
                >
                  <Video className={`w-3.5 h-3.5 ${roomCallState.isLive ? 'animate-pulse' : ''}`} />
                  <span>
                    {roomCallState.isLive 
                      ? (isJoinedRoomCall ? 'In Room Call (Open View)' : `Join Room Call (${roomCallState.participantCount})`) 
                      : 'Start Room Call'}
                  </span>
                </button>
              )}

              {isCustomRoom ? (
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={handleOpenRoomSettings}
                    className="flex-1 py-1.5 px-2 bg-[#0b101c] hover:bg-[#111827] text-zinc-300 hover:text-[#00ff88] border border-[#1a263d] hover:border-[#00ff88]/40 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95"
                    title="Edit Room Settings & Permissions"
                  >
                    {isHost ? <Crown className="w-3.5 h-3.5 text-[#00ff88]" /> : <Settings className="w-3.5 h-3.5 text-[#00ff88]" />}
                    <span>{isHost ? 'Host Settings' : 'Room Info'}</span>
                  </button>

                  <button
                    onClick={handleLeaveRoom}
                    className="py-1.5 px-2.5 bg-[#1a0c14] hover:bg-[#2b101e] text-rose-400 border border-rose-500/30 hover:border-rose-500/50 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition active:scale-95"
                    title="Leave Room"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Leave</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleOpenRooms}
                  className="w-full py-1.5 px-2.5 bg-[#0b101c] hover:bg-[#111827] text-[#00ff88] border border-[#1a263d] hover:border-[#00ff88]/40 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#00ff88]" />
                  <span>Join or Create Room</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scroll-touch">
          {roomUsers.map((member) => {
            const isMe = member.id === user.id || member.socketId === user.socketId;
            const audioAllowed = currentRoom?.allowAudioCalls !== false;
            const videoAllowed = currentRoom?.allowVideoCalls !== false;

            return (
              <div
                key={member.socketId || member.id}
                className={`flex items-center justify-between p-2 rounded-lg border transition ${
                  isMe 
                    ? 'bg-[#0b1424] border-[#1d3557]' 
                    : 'bg-[#080c14] hover:bg-[#0d1422] border-[#141d2e]'
                }`}
              >
                {/* User Info */}
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#1c2638]">
                      <img
                        src={getAvatarSvg(member.avatar || member.name)}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <p className="text-xs font-bold text-zinc-100 truncate">
                        {member.name}
                      </p>
                      {member.isHost && (
                        <Crown className="w-3 h-3 text-amber-400 shrink-0" title="Host" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 block">
                      {isMe ? 'You' : 'Online'}
                    </span>
                  </div>
                </div>

                {/* Direct Call Actions */}
                {!isMe && (
                  <div className="flex items-center space-x-1 shrink-0">
                    {/* Audio Call */}
                    <button
                      onClick={() => audioAllowed && startCall(member.socketId, member, false)}
                      disabled={!audioAllowed}
                      className={`p-1.5 rounded-lg transition ${
                        audioAllowed
                          ? 'text-zinc-400 hover:text-[#00ff88] hover:bg-[#00ff88]/10 active:scale-95'
                          : 'text-zinc-600 opacity-40 cursor-not-allowed'
                      }`}
                      title={audioAllowed ? 'Audio Call' : 'Voice calls disabled by room host'}
                    >
                      {audioAllowed ? <Phone className="w-3.5 h-3.5" /> : <PhoneOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Video Call */}
                    <button
                      onClick={() => videoAllowed && startCall(member.socketId, member, true)}
                      disabled={!videoAllowed}
                      className={`p-1.5 rounded-lg transition ${
                        videoAllowed
                          ? 'text-zinc-400 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 active:scale-95'
                          : 'text-zinc-600 opacity-40 cursor-not-allowed'
                      }`}
                      title={videoAllowed ? 'Video Call' : 'Video calls disabled by room host'}
                    >
                      {videoAllowed ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#161f30] bg-[#04060a] shrink-0 text-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span>Network Status</span>
            <span className="text-[#00ff88] flex items-center space-x-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
              <span>Connected</span>
            </span>
          </div>
          <p className="text-zinc-300 truncate font-semibold">
            {ipInfo?.autoRoom?.roomName || 'Local Wi-Fi Network'}
          </p>
          <p className="text-zinc-500 truncate text-[11px] mt-0.5">
            IP: {ipInfo?.ip || '127.0.0.1'}
          </p>
        </div>
      </aside>
    </>
  );
}
