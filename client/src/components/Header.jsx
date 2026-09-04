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
  onOpenRoomSettingsModal,
  onOpenShareModal, 
  onOpenSettingsModal,
  onToggleSidebar,
  onOpenBetaModal,
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
    <header className="min-h-[3.25rem] sm:min-h-[3.5rem] px-3 sm:px-4 md:px-5 bg-[#05080f] border-b border-[#161f30] flex items-center justify-between z-30 shrink-0 select-none font-mono pt-safe">
      {/* Left: Clean Branding & Current Room Info */}
      <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
        {/* Clean Logo */}
        <div className="flex items-center shrink-0">
          <span className="font-black text-sm sm:text-base tracking-wider text-white">
            Vision<span className="text-[#00ff88]">.</span>
          </span>
        </div>

        <span className="text-[#1c283f] text-xs">|</span>

        {/* Current Room Pill */}
        <div className="flex items-center space-x-2 truncate">
          <div className="flex items-center space-x-2 bg-[#080d17] border border-[#1a263d] rounded-lg px-2.5 py-1 text-xs text-zinc-200">
            {currentRoom?.hasPassword ? (
              <Lock className="w-3.5 h-3.5 text-[#00f0ff] shrink-0" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-[#00ff88] shrink-0" />
            )}
            
            <span className="text-zinc-400 text-xs hidden md:inline">Room:</span>
            <span className="truncate max-w-[110px] sm:max-w-[180px] md:max-w-[240px] font-semibold text-white">
              {currentRoom?.name || 'Connecting...'}
            </span>

            {currentRoom?.hasPassword && (
              <span className="px-1.5 py-0.2 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 text-[9px] font-bold rounded shrink-0">
                Key
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

      {/* Right Controls: Ultra Clean on Mobile, Expanded on Desktop */}
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

        {/* Desktop-only: Room Call Button (Beta Modal) */}
        <button
          onClick={onOpenBetaModal}
          className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-[#0b101c] hover:bg-[#111827] text-zinc-200 hover:text-[#00f0ff] border border-[#1a263d] hover:border-[#00f0ff]/40 transition active:scale-95"
          title="Voice & Video Calling (Beta)"
        >
          <Video className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span>Call</span>
          <span className="px-1 py-0.2 bg-[#00f0ff]/10 text-[#00f0ff] text-[8px] font-bold rounded border border-[#00f0ff]/30">
            BETA
          </span>
        </button>

        {/* Desktop-only: Share Room Button */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#0b101c] hover:bg-[#111827] text-zinc-200 hover:text-[#00f0ff] border border-[#1a263d] hover:border-[#00f0ff]/40 transition min-h-[38px]"
          title="Share Room / Invite Link"
        >
          <Share2 className="w-4 h-4 text-[#00f0ff]" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Desktop-only: Room Settings Button */}
        {isCustomRoom && (
          <button
            onClick={onOpenRoomSettingsModal}
            className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition active:scale-95 ${
              isHost
                ? 'bg-[#00ff88]/10 hover:bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/30 hover:border-[#00ff88]/60'
                : 'bg-[#0b101c] hover:bg-[#111827] text-zinc-200 hover:text-[#00ff88] border-[#1a263d] hover:border-[#00ff88]/40'
            }`}
            title={isHost ? 'Host Controls & Settings' : 'Room Settings & Info'}
          >
            {isHost ? <Crown className="w-3.5 h-3.5 text-[#00ff88]" /> : <Sliders className="w-3.5 h-3.5 text-[#00ff88]" />}
            <span>{isHost ? 'Host Settings' : 'Settings'}</span>
          </button>
        )}

        {/* Audio Mute Toggle (Desktop only) */}
        <button
          onClick={handleToggleMute}
          className={`p-2 rounded-lg border transition min-h-[38px] min-w-[38px] flex items-center justify-center ${
            soundMuted 
              ? 'bg-[#1a0c14] text-rose-400 border-rose-500/30' 
              : 'bg-[#0b101c] hover:bg-[#111827] text-zinc-300 hover:text-[#00ff88] border-[#1a263d]'
          }`}
          title={soundMuted ? 'Unmute terminal sounds' : 'Mute terminal sounds'}
        >
          {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettingsModal}
          className="flex items-center space-x-2 pl-2.5 pr-1.5 py-1 rounded-lg bg-[#080d17] hover:bg-[#0f1626] border border-[#1a263d] hover:border-[#00ff88]/40 transition group min-h-[38px]"
          title="Profile & Settings"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Mobile Members Drawer Button (Clean & Classy with Live Count Badge) */}
        <button
          onClick={onToggleSidebar}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b101c] hover:bg-[#111827] text-zinc-200 border border-[#1a263d] hover:border-[#00ff88]/40 md:hidden transition active:scale-95"
          aria-label="Open members list"
        >
          <Users className="w-3.5 h-3.5 text-[#00ff88]" />
          <span className="text-xs font-bold text-white">{roomUsers.length}</span>
        </button>
      </div>
    </header>
  );
}
