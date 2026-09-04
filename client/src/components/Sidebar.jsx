import React, { useState } from 'react';
import { 
  Users, 
  Video, 
  Phone, 
  Wifi, 
  X, 
  Copy, 
  Check,
  Crown,
  LogOut
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { getAvatarSvg } from '../utils/avatar';
import { sound } from '../utils/sound';

export default function Sidebar({ isOpen, onClose, onOpenShareModal }) {
  const { currentRoom, roomUsers, user, ipInfo, leaveRoom } = useSocket();
  const { startCall } = useWebRTC();
  const [copied, setCopied] = React.useState(false);

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

  const handleReturnToLocalWifi = () => {
    if (ipInfo?.autoRoom?.roomId) {
      joinRoom(ipInfo.autoRoom.roomId);
      if (onClose) onClose();
    }
  };

  const handleToggleSound = () => {
    if (setSoundMuted) {
      const next = !soundMuted;
      setSoundMuted(next);
      sound.setMuted(next);
    }
  };

  const handleAction = (callback) => {
    if (callback) callback();
    if (onClose && window.innerWidth < 768) onClose();
  };

  return (
    <>
      {/* Mobile Glass Backdrop (Tap to close) */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-fade-in touch-manipulation"
          aria-hidden="true"
        />
      )}

      {/* Main Slide-Over Drawer */}
      <aside className={`
        fixed md:static top-0 right-0 bottom-0 z-50 md:z-20
        w-84 max-w-[88vw] sm:max-w-sm md:w-72 bg-[#05080f] border-l border-[#161f30] flex flex-col font-mono select-none
        transition-transform duration-300 ease-in-out h-full h-[100dvh] pt-safe pb-safe shadow-2xl md:shadow-none
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {/* Drawer Top Header */}
        <div className="h-14 px-4 border-b border-[#161f30] flex items-center justify-between shrink-0 bg-[#070b14]">
          <div className="flex items-center space-x-2 text-zinc-200">
            <span className="font-bold text-sm tracking-wider text-white">
              VISION<span className="text-[#00ff88]">.</span>HUB
            </span>
            <span className="text-[10px] bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 px-2 py-0.5 rounded-full font-bold">
              {roomUsers.length} Online
            </span>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg md:hidden transition active:scale-95 bg-[#0b101c] border border-[#161f30] min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Identity Card */}
        <div className="p-3 border-b border-[#161f30] bg-[#080d17]/80">
          <div className="flex items-center justify-between p-2.5 bg-[#05080f] rounded-xl border border-[#161f30]">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#00ff88]/40 bg-black shrink-0">
                <img
                  src={getAvatarSvg(user.avatar || user.name)}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  {isHost && (
                    <span className="text-[9px] px-1.5 py-0.2 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 font-bold rounded">
                      HOST
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 truncate">
                  {user.status || 'Active on Network'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleAction(onOpenSettingsModal)}
              className="p-1.5 text-zinc-400 hover:text-[#00ff88] rounded-lg bg-[#0b101c] border border-[#161f30] transition active:scale-95 shrink-0"
              title="Edit Profile & Settings"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Section Tabs (Features & Rooms vs Members List) */}
        <div className="flex border-b border-[#161f30] bg-[#070b14] p-1.5 gap-1 shrink-0 md:hidden">
          <button
            onClick={() => setActiveTab('features')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'features'
                ? 'bg-[#111a2e] text-[#00ff88] border border-[#00ff88]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Features & Rooms</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'members'
                ? 'bg-[#111a2e] text-[#00f0ff] border border-[#00f0ff]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({roomUsers.length})</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#161f30] bg-[#04060a] shrink-0 text-xs space-y-2">
          {currentRoom?.isCustom && (
            <button
              onClick={() => {
                leaveRoom();
                if (onClose) onClose();
              }}
              className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 active:scale-[0.98] border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 min-h-[40px]"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Room</span>
            </button>
          )}

          <div className="flex items-center justify-between text-zinc-400">
            <span>Network Status</span>
            <span className="text-[#00ff88] flex items-center space-x-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
              <span>Encrypted LAN</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>Zero-Trace Protected</span>
            <span className="font-mono text-zinc-400">{ipInfo?.maskedIp || 'Active'}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
