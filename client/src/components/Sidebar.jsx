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
  LogOut, 
  LogIn, 
  Sliders, 
  Share2,
  Sparkles
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { getAvatarSvg } from '../utils/avatar';

export default function Sidebar({ 
  isOpen, 
  onClose, 
  onOpenShareModal, 
  onOpenRoomModal, 
  onOpenRoomSettingsModal,
  onOpenBetaModal
}) {
  const { currentRoom, roomUsers, user, ipInfo, leaveRoom } = useSocket();
  const [copied, setCopied] = useState(false);

  const isCustomRoom = Boolean(
    currentRoom?.isCustom || 
    (currentRoom && ipInfo?.autoRoom?.roomId && currentRoom.id !== ipInfo.autoRoom.roomId)
  );

  const isHost = Boolean(
    currentRoom?.hostId && (currentRoom.hostId === user.id || currentRoom.hostId === user.name)
  );

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

  const handleCallClick = () => {
    if (onOpenBetaModal) onOpenBetaModal();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay (Tap anywhere to close) */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-fade-in touch-manipulation"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Drawer */}
      <aside className={`
        fixed md:static top-0 right-0 bottom-0 z-50 md:z-20
        w-80 max-w-[85vw] sm:max-w-xs md:w-72 bg-[#05080f] border-l border-[#161f30] flex flex-col font-mono select-none
        transition-transform duration-300 ease-in-out h-full h-[100dvh] pt-safe pb-safe shadow-2xl md:shadow-none
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="h-14 px-4 border-b border-[#161f30] flex items-center justify-between shrink-0 bg-[#070b14]">
          <div className="flex items-center space-x-2 text-zinc-200">
            <Users className="w-4 h-4 text-[#00ff88]" />
            <span className="font-bold text-xs tracking-wide">Members Online</span>
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

        {/* Current Room Information Card */}
        <div className="p-3 border-b border-[#161f30] bg-[#080d17]">
          <div className="bg-[#05080f] rounded-xl p-3 border border-[#161f30] space-y-2.5 shadow-inner">
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
                {currentRoom?.name || 'Local Wi-Fi Network'}
              </p>
              <p className="text-[10px] text-[#00f0ff] font-bold tracking-wider truncate">
                ID: {currentRoom?.id || 'LAN'}
              </p>
            </div>

            {/* Room Actions */}
            <div className="space-y-1.5 pt-1.5 border-t border-[#161f30]">
              {/* Host Settings Button */}
              {isCustomRoom && isHost && (
                <button
                  onClick={handleOpenRoomSettings}
                  className="w-full py-1.5 px-2.5 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Host Room Settings</span>
                </button>
              )}

              {/* Group Room Call Quick Action (Beta Popup) */}
              <button
                onClick={handleCallClick}
                className="w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95 bg-[#0b101c] hover:bg-[#111827] text-zinc-300 border border-[#1a263d] hover:border-[#00f0ff]/40"
              >
                <Video className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span>Room Group Call</span>
                <span className="px-1 py-0.2 bg-[#00f0ff]/10 text-[#00f0ff] text-[8px] font-bold rounded border border-[#00f0ff]/30">
                  BETA
                </span>
              </button>

              {isCustomRoom ? (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      if (onOpenShareModal) onOpenShareModal();
                      if (onClose && window.innerWidth < 768) onClose();
                    }}
                    className="py-1.5 px-2 bg-[#0b101c] hover:bg-[#111827] text-[#00ff88] border border-[#1a263d] rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition active:scale-95"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Invite</span>
                  </button>

                  <button
                    onClick={handleLeaveRoom}
                    className="py-1.5 px-2 bg-[#1a0c14] hover:bg-[#2b101e] text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition active:scale-95"
                  >
                    <LogOut className="w-3 h-3" />
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

        {/* Member List with Clean Call Buttons */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scroll-touch">
          {roomUsers.map((member) => {
            const isMe = member.id === user.id || member.socketId === user.socketId;

            return (
              <div
                key={member.socketId || member.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                  isMe 
                    ? 'bg-[#0b1424] border-[#1d3557]' 
                    : 'bg-[#080c14] hover:bg-[#0d1422] border-[#141d2e]'
                }`}
              >
                {/* User Info */}
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#1c2638] bg-black">
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
                        <Crown className="w-3.5 h-3.5 text-[#00ff88] shrink-0" title="Host" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 block">
                      {isMe ? 'You (Active)' : 'Online Peer'}
                    </span>
                  </div>
                </div>

                {/* Direct Call Actions (Triggers Beta Notice) */}
                {!isMe && (
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {/* Audio Call */}
                    <button
                      onClick={handleCallClick}
                      className="p-2 rounded-xl transition min-w-[36px] min-h-[36px] flex items-center justify-center text-zinc-300 hover:text-[#00ff88] bg-[#0b101c] hover:bg-[#00ff88]/10 border border-[#1a263d] active:scale-95"
                      title="Audio Call (Beta)"
                    >
                      <Phone className="w-4 h-4 text-[#00ff88]" />
                    </button>

                    {/* Video Call */}
                    <button
                      onClick={handleCallClick}
                      className="p-2 rounded-xl transition min-w-[36px] min-h-[36px] flex items-center justify-center text-zinc-300 hover:text-[#00f0ff] bg-[#0b101c] hover:bg-[#00f0ff]/10 border border-[#1a263d] active:scale-95"
                      title="Video Call (Beta)"
                    >
                      <Video className="w-4 h-4 text-[#00f0ff]" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Identity & Status */}
        <div className="p-3 border-t border-[#161f30] bg-[#04060a] shrink-0 text-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span>Network Status</span>
            <span className="text-[#00ff88] flex items-center space-x-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
              <span>Connected</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>IP Subnet</span>
            <span className="font-mono text-zinc-400">{ipInfo?.maskedIp || 'Protected'}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
