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
  UserCheck
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { getAvatarSvg } from '../utils/avatar';
import { sound } from '../utils/sound';

export default function Header({ 
  onOpenRoomModal, 
  onOpenShareModal, 
  onOpenSettingsModal,
  onToggleSidebar,
  soundMuted,
  setSoundMuted
}) {
  const { currentRoom, roomUsers, user, leaveRoom, hostApprovalRequests } = useSocket();

  const handleToggleMute = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    sound.setMuted(next);
  };

  return (
    <header className="h-14 px-3 md:px-5 bg-[#05080f] border-b border-[#161f30] flex items-center justify-between z-30 shrink-0 select-none font-mono">
      {/* Left: Branding & Current Room Info */}
      <div className="flex items-center space-x-2.5 md:space-x-4 min-w-0">
        <button 
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-zinc-400 hover:text-[#00ff88] rounded-xl bg-[#0b101c] border border-[#161f30] transition min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label="Toggle user list"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center shrink-0">
          <span className="font-black text-base tracking-wider text-white">
            Vision<span className="text-[#00ff88]">.</span>
          </span>
        </div>

        <span className="text-[#1c283f] text-xs hidden sm:inline">|</span>

        {/* Current Room Pill */}
        <div className="flex items-center space-x-2 truncate">
          <div className="flex items-center space-x-2 bg-[#080d17] border border-[#1a263d] rounded-lg px-2.5 py-1 text-xs text-zinc-200">
            {currentRoom?.hasPassword ? (
              <Lock className="w-3.5 h-3.5 text-[#ffb700] shrink-0" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-[#00ff88] shrink-0" />
            )}
            
            <span className="text-zinc-400 text-xs hidden md:inline">Room:</span>
            <span className="truncate max-w-[110px] sm:max-w-[180px] md:max-w-[240px] font-semibold text-white">
              {currentRoom?.name || 'Connecting...'}
            </span>

            {currentRoom?.hasPassword && (
              <span className="px-1.5 py-0.2 bg-[#ffb700]/10 text-[#ffb700] border border-[#ffb700]/30 text-[10px] font-bold rounded">
                Protected
              </span>
            )}
          </div>

          {/* Leave Room Button (Appears ONLY when user joins a custom room) */}
          {currentRoom?.isCustom && (
            <button
              onClick={leaveRoom}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition shrink-0 min-h-[36px]"
              title="Leave Custom Room"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Leave</span>
            </button>
          )}

          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 rounded-lg text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            <span>{roomUsers.length} Online</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {/* Knock Requests Notification Pill for Host */}
        {hostApprovalRequests && hostApprovalRequests.length > 0 && (
          <div 
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#00f0ff]/10 border border-[#00f0ff]/50 rounded-lg text-xs text-[#00f0ff] font-bold animate-bounce"
            title="User knocking for host approval"
          >
            <UserCheck className="w-4 h-4" />
            <span>{hostApprovalRequests.length} Knocking</span>
          </div>
        )}

        {/* Switch / Create Room Button */}
        <button
          onClick={onOpenRoomModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#0b101c] hover:bg-[#111827] text-zinc-200 hover:text-[#00ff88] border border-[#1a263d] hover:border-[#00ff88]/40 transition min-h-[38px]"
          title="Create or Join Room"
        >
          <Plus className="w-4 h-4 text-[#00ff88]" />
          <span className="hidden sm:inline">Rooms</span>
        </button>

        {/* Share Room Button */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#0b101c] hover:bg-[#111827] text-zinc-200 hover:text-[#00f0ff] border border-[#1a263d] hover:border-[#00f0ff]/40 transition min-h-[38px]"
          title="Share Room / Invite Link"
        >
          <Share2 className="w-4 h-4 text-[#00f0ff]" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Audio Mute Toggle */}
        <button
          onClick={handleToggleMute}
          className={`p-2 rounded-lg border transition min-h-[38px] min-w-[38px] flex items-center justify-center ${
            soundMuted 
              ? 'bg-[#0b101c] border-[#1a263d] text-zinc-500' 
              : 'bg-[#0b101c] border-[#1a263d] text-[#00ff88] hover:border-[#00ff88]/40'
          }`}
          title={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* User Profile Pill */}
        <button
          onClick={onOpenSettingsModal}
          className="flex items-center space-x-2 pl-2.5 pr-1.5 py-1 rounded-lg bg-[#080d17] hover:bg-[#0f1626] border border-[#1a263d] hover:border-[#00ff88]/40 transition group min-h-[38px]"
          title="Profile & Settings"
        >
          <span className="text-xs font-semibold text-zinc-200 group-hover:text-[#00ff88] max-w-[90px] truncate hidden md:inline">
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
