import React from 'react';
import { 
  Lock, 
  Share2, 
  Plus, 
  Volume2, 
  VolumeX, 
  Wifi, 
  Users,
  Menu,
  LogOut,
  LogIn,
  Sliders,
  Video,
  Crown
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';
import { getAvatarSvg } from '../utils/avatar';
import { sound } from '../utils/sound';

export default function Header({ 
  onOpenRoomModal, 
  onOpenRoomSettingsModal,
  onOpenShareModal, 
  onOpenSettingsModal,
  onToggleSidebar,
  soundMuted,
  setSoundMuted
}) {
  const { currentRoom, roomUsers, user, leaveRoom, ipInfo } = useSocket();
  const { roomCallState, isJoinedRoomCall, startOrJoinRoomCall, setIsRoomCallModalOpen } = useWebRTC();

  const isCustomRoom = Boolean(
    currentRoom?.isCustom || 
    (currentRoom && ipInfo?.autoRoom?.roomId && currentRoom.id !== ipInfo.autoRoom.roomId)
  );

  const isHost = Boolean(
    currentRoom?.hostId && (currentRoom.hostId === user.id || currentRoom.hostId === user.name)
  );

  const callsAllowed = currentRoom?.allowAudioCalls !== false || currentRoom?.allowVideoCalls !== false;

  const handleToggleMute = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    sound.setMuted(next);
  };

  const handleLeaveRoom = () => {
    if (window.confirm('Are you sure you want to leave this room?')) {
      leaveRoom();
    }
  };

  return (
    <header className="min-h-[3.5rem] px-2.5 sm:px-4 md:px-5 bg-[#05080f] border-b border-[#161f30] flex items-center justify-between z-30 shrink-0 select-none font-mono pt-safe">
      {/* Left: Branding & Current Room Info */}
      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
        {/* Mobile Sidebar Toggle with Member Count Badge */}
        <button 
          onClick={onToggleSidebar}
          className="relative p-2 text-zinc-400 hover:text-emerald-400 rounded-lg bg-[#0b101c] border border-[#161f30] md:hidden transition active:scale-95"
          aria-label="Toggle user list"
        >
          <Menu className="w-4 h-4" />
          {roomUsers.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00ff88] text-black font-black text-[9px] rounded-full flex items-center justify-center shadow">
              {roomUsers.length}
            </span>
          )}
        </button>

        {/* Logo */}
        <div className="flex items-center shrink-0">
          <span className="font-black text-sm sm:text-base tracking-wider text-white">
            Vision<span className="text-[#00ff88]">.</span>
          </span>
        </div>

        <span className="text-[#1c283f] text-xs hidden sm:inline">|</span>

        {/* Current Room Pill */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 truncate min-w-0">
          <div className="flex items-center space-x-1.5 bg-[#080d17] border border-[#1a263d] rounded-lg px-2 sm:px-3 py-1 text-xs text-zinc-200 truncate">
            {currentRoom?.hasPassword ? (
              <Lock className="w-3.5 h-3.5 text-[#00f0ff] shrink-0" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-[#00ff88] shrink-0" />
            )}
            
            <span className="text-zinc-400 text-xs hidden lg:inline">Room:</span>
            <span className="truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[180px] md:max-w-[240px] font-semibold text-white">
              {currentRoom?.name || 'Connecting...'}
            </span>

            {currentRoom?.hasPassword && (
              <span className="px-1.5 py-0.2 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 text-[9px] sm:text-[10px] font-bold rounded shrink-0">
                Key
              </span>
            )}
          </div>

          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 rounded-lg text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            <span>{roomUsers.length} Online</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
        {/* Leave Room Button: ONLY displayed if the user has joined a room */}
        {isCustomRoom && (
          <button
            onClick={handleLeaveRoom}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-bold rounded-lg bg-[#1a0c14] hover:bg-[#2b101e] text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/60 transition active:scale-95 shadow-sm animate-fade-in"
            title="Leave current room"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden xs:inline">Leave</span>
          </button>
        )}

        {/* Join / Create Room Button */}
        <button
          onClick={onOpenRoomModal}
          className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-[#0b101c] hover:bg-[#111827] text-zinc-200 hover:text-[#00ff88] border border-[#1a263d] hover:border-[#00ff88]/40 transition active:scale-95"
          title="Create or Join Room"
        >
          <LogIn className="w-3.5 h-3.5 text-[#00ff88]" />
          <span className="hidden md:inline">Join Room</span>
        </button>

        {/* Room Call Action Button */}
        {callsAllowed && (
          <button
            onClick={() => {
              if (isJoinedRoomCall) {
                setIsRoomCallModalOpen(true);
              } else {
                startOrJoinRoomCall(true);
              }
            }}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-bold rounded-lg border transition active:scale-95 ${
              roomCallState.isLive
                ? 'bg-[#a855f7]/20 border-[#a855f7]/50 text-[#c084fc] hover:bg-[#a855f7]/30'
                : 'bg-[#0b101c] hover:bg-[#111827] text-zinc-200 hover:text-[#00f0ff] border-[#1a263d] hover:border-[#00f0ff]/40'
            }`}
            title={roomCallState.isLive ? 'Active Room Call' : 'Start Group Room Call'}
          >
            <Video className={`w-3.5 h-3.5 ${roomCallState.isLive ? 'text-[#c084fc] animate-pulse' : 'text-[#00f0ff]'}`} />
            <span className="hidden md:inline">{roomCallState.isLive ? (isJoinedRoomCall ? 'In Call' : 'Join Call') : 'Call'}</span>
          </button>
        )}

        {/* Share Room Button */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-bold rounded-lg bg-[#0b101c] hover:bg-[#111827] text-zinc-200 hover:text-[#00f0ff] border border-[#1a263d] hover:border-[#00f0ff]/40 transition active:scale-95"
          title="Share Room / Invite Link"
        >
          <Share2 className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span className="hidden lg:inline">Share</span>
        </button>

        {/* Room Settings & Permissions Button */}
        {isCustomRoom && (
          <button
            onClick={onOpenRoomSettingsModal}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-bold rounded-lg border transition active:scale-95 ${
              isHost
                ? 'bg-[#00ff88]/10 hover:bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/30 hover:border-[#00ff88]/60'
                : 'bg-[#0b101c] hover:bg-[#111827] text-zinc-200 hover:text-[#00ff88] border-[#1a263d] hover:border-[#00ff88]/40'
            }`}
            title={isHost ? 'Host Controls & Settings' : 'Room Settings & Info'}
          >
            {isHost ? <Crown className="w-3.5 h-3.5 text-[#00ff88]" /> : <Sliders className="w-3.5 h-3.5 text-[#00ff88]" />}
            <span className="hidden lg:inline">{isHost ? 'Host Settings' : 'Settings'}</span>
          </button>
        )}

        {/* Audio Mute Toggle */}
        <button
          onClick={handleToggleMute}
          className={`p-2 rounded-lg border transition active:scale-95 ${
            soundMuted 
              ? 'bg-[#0b101c] border-[#1a263d] text-zinc-500' 
              : 'bg-[#0b101c] border-[#1a263d] text-[#00ff88] hover:border-[#00ff88]/40'
          }`}
          title={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#00ff88]" />}
        </button>

        {/* User Profile Pill */}
        <button
          onClick={onOpenSettingsModal}
          className="flex items-center space-x-1.5 pl-2 sm:pl-2.5 pr-1 py-1 rounded-lg bg-[#080d17] hover:bg-[#0f1626] border border-[#1a263d] hover:border-[#00ff88]/40 transition group active:scale-95"
          title="Profile & Settings"
        >
          <span className="text-xs font-semibold text-zinc-200 group-hover:text-[#00ff88] max-w-[80px] truncate hidden md:inline">
            {user.name}
          </span>
          <div className="w-6 h-6 rounded-md overflow-hidden border border-[#1a263d] group-hover:border-[#00ff88]/50 transition">
            <img src={getAvatarSvg(user.avatar || user.name)} alt={user.name} className="w-full h-full object-cover" />
          </div>
        </button>
      </div>
    </header>
  );
}
