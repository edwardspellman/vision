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
  const { currentRoom, roomUsers, user, leaveRoom, ipInfo } = useSocket();

  const isCustomRoom = Boolean(
    currentRoom?.isCustom || 
    (currentRoom && ipInfo?.autoRoom?.roomId && currentRoom.id !== ipInfo.autoRoom.roomId)
  );

  const isHost = Boolean(
    currentRoom?.hostId && (currentRoom.hostId === user.id || currentRoom.hostId === user.name)
  );

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
        <div className="flex items-center space-x-1.5 truncate min-w-0">
          <div className="flex items-center space-x-1.5 bg-[#080d17] border border-[#1a263d] rounded-lg px-2 sm:px-2.5 py-1 text-xs text-zinc-200 truncate">
            {currentRoom?.hasPassword ? (
              <Lock className="w-3.5 h-3.5 text-[#00f0ff] shrink-0" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-[#00ff88] shrink-0" />
            )}
            
            <span className="truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[200px] md:max-w-[240px] font-semibold text-white text-xs">
              {currentRoom?.name || 'Local Wi-Fi'}
            </span>

            {currentRoom?.hasPassword && (
              <span className="px-1.5 py-0.2 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 text-[9px] font-bold rounded shrink-0">
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

      {/* Right Controls: Ultra Clean on Mobile, Expanded on Desktop */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {/* Desktop-only: Leave Room Button */}
        {isCustomRoom && (
          <button
            onClick={handleLeaveRoom}
            className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-[#1a0c14] hover:bg-[#2b101e] text-rose-400 border border-rose-500/30 transition active:scale-95"
            title="Leave current room"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Leave</span>
          </button>
        )}

        {/* Desktop-only: Join / Create Room Button */}
        <button
          onClick={onOpenRoomModal}
          className="hidden md:flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-[#0b101c] hover:bg-[#111827] text-zinc-200 hover:text-[#00ff88] border border-[#1a263d] hover:border-[#00ff88]/40 transition active:scale-95"
          title="Create or Join Room"
        >
          <LogIn className="w-3.5 h-3.5 text-[#00ff88]" />
          <span>Join Room</span>
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
          className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-[#0b101c] hover:bg-[#111827] text-zinc-200 hover:text-[#00f0ff] border border-[#1a263d] hover:border-[#00f0ff]/40 transition active:scale-95"
          title="Share Room / Invite Link"
        >
          <Share2 className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span>Share</span>
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
          className={`hidden md:flex p-2 rounded-lg border transition active:scale-95 ${
            soundMuted 
              ? 'bg-[#1a0c14] text-rose-400 border-rose-500/30' 
              : 'bg-[#0b101c] hover:bg-[#111827] text-zinc-300 hover:text-[#00ff88] border-[#1a263d]'
          }`}
          title={soundMuted ? 'Unmute terminal sounds' : 'Mute terminal sounds'}
        >
          {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettingsModal}
          className="p-2 text-zinc-300 hover:text-[#00ff88] rounded-lg bg-[#0b101c] hover:bg-[#111827] border border-[#1a263d] hover:border-[#00ff88]/40 transition active:scale-95"
          title="Terminal Settings"
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
