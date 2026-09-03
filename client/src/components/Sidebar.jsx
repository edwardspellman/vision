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
  Sparkles,
  ShieldCheck,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Radio,
  Paperclip,
  ExternalLink,
  UserCheck
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { getAvatarSvg } from '../utils/avatar';
import { sound } from '../utils/sound';

export default function Sidebar({ 
  isOpen, 
  onClose, 
  onOpenShareModal, 
  onOpenRoomModal, 
  onOpenRoomSettingsModal,
  onOpenSettingsModal,
  onOpenBetaModal,
  soundMuted,
  setSoundMuted
}) {
  const { currentRoom, roomUsers, user, ipInfo, leaveRoom, joinRoom } = useSocket();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('features'); // 'features' | 'members'

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

        {/* Main Scrollable Drawer Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scroll-touch">
          
          {/* SECTION 1: ROOM DETAILS & ACTIONS (Visible on Desktop OR when activeTab is 'features') */}
          <div className={`space-y-3 ${activeTab === 'members' ? 'hidden md:block' : 'block'}`}>
            
            {/* Current Room Hub Card */}
            <div className="bg-[#080d17] rounded-xl p-3 border border-[#161f30] space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Active Room
                </span>
                <button 
                  onClick={handleCopyRoomId}
                  className="text-xs text-[#00ff88] hover:underline flex items-center space-x-1 font-semibold active:scale-95 transition"
                  title="Copy Room Link / Code"
                >
                  {copied ? <Check className="w-3 h-3 text-[#00ff88]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Share Code'}</span>
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

              {/* Quick Room Action Buttons */}
              <div className="space-y-1.5 pt-1.5 border-t border-[#161f30]">
                {/* Join / Create Custom Room */}
                <button
                  onClick={() => handleAction(onOpenRoomModal)}
                  className="w-full py-2 px-2.5 bg-[#0b101c] hover:bg-[#111827] text-[#00ff88] border border-[#1a263d] hover:border-[#00ff88]/40 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#00ff88]" />
                  <span>Join or Create Room</span>
                </button>

                {/* Share Room / QR Code */}
                <button
                  onClick={() => handleAction(onOpenShareModal)}
                  className="w-full py-2 px-2.5 bg-[#0b101c] hover:bg-[#111827] text-zinc-200 hover:text-[#00f0ff] border border-[#1a263d] hover:border-[#00f0ff]/40 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#00f0ff]" />
                  <span>Share Room & QR Code</span>
                </button>

                {/* Host Settings (If Host) */}
                {isCustomRoom && isHost && (
                  <button
                    onClick={() => handleAction(onOpenRoomSettingsModal)}
                    className="w-full py-2 px-2.5 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Host Controls & Permissions</span>
                  </button>
                )}

                {/* Return to Local Wi-Fi (if in custom room) */}
                {isCustomRoom && (
                  <button
                    onClick={handleReturnToLocalWifi}
                    className="w-full py-1.5 px-2.5 bg-[#0b101c] hover:bg-[#111827] text-zinc-400 hover:text-zinc-200 border border-[#1a263d] rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1.5 transition active:scale-95"
                  >
                    <Wifi className="w-3.5 h-3.5 text-[#00ff88]" />
                    <span>Return to Local Wi-Fi</span>
                  </button>
                )}

                {/* Leave Room Button */}
                {isCustomRoom && (
                  <button
                    onClick={handleLeaveRoom}
                    className="w-full py-1.5 px-2.5 bg-[#1a0c14] hover:bg-[#2b101e] text-rose-400 border border-rose-500/30 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1.5 transition active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Leave Room</span>
                  </button>
                )}
              </div>
            </div>

            {/* SECTION 2: PLATFORM FEATURES & TOOLS */}
            <div className="bg-[#080d17] rounded-xl p-3 border border-[#161f30] space-y-2.5 shadow-inner">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Platform Tools & Features
              </span>

              <div className="space-y-1.5">
                {/* Voice & Video Calling (Beta) */}
                <button
                  onClick={() => handleAction(onOpenBetaModal)}
                  className="w-full py-2 px-2.5 bg-[#0b101c] hover:bg-[#111827] text-zinc-200 border border-[#1a263d] hover:border-[#00f0ff]/40 rounded-lg text-xs font-bold flex items-center justify-between transition active:scale-95"
                >
                  <div className="flex items-center space-x-2">
                    <Video className="w-3.5 h-3.5 text-[#00f0ff]" />
                    <span>Voice & Video Calling</span>
                  </div>
                  <span className="px-1.5 py-0.2 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 text-[9px] font-bold rounded">
                    BETA
                  </span>
                </button>

                {/* Terminal Sound Toggle */}
                <button
                  onClick={handleToggleSound}
                  className="w-full py-2 px-2.5 bg-[#0b101c] hover:bg-[#111827] text-zinc-200 border border-[#1a263d] rounded-lg text-xs font-bold flex items-center justify-between transition active:scale-95"
                >
                  <div className="flex items-center space-x-2">
                    {soundMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#00ff88]" />}
                    <span>Terminal Audio Effects</span>
                  </div>
                  <span className={`text-[10px] font-bold ${soundMuted ? 'text-rose-400' : 'text-[#00ff88]'}`}>
                    {soundMuted ? 'MUTED' : 'ON'}
                  </span>
                </button>

                {/* Settings & Config */}
                <button
                  onClick={() => handleAction(onOpenSettingsModal)}
                  className="w-full py-2 px-2.5 bg-[#0b101c] hover:bg-[#111827] text-zinc-200 border border-[#1a263d] rounded-lg text-xs font-bold flex items-center justify-between transition active:scale-95"
                >
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                    <span>System Settings</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold">Configure</span>
                </button>
              </div>
            </div>

          </div>

          {/* SECTION 3: MEMBERS LIST (Visible on Desktop OR when activeTab is 'members') */}
          <div className={`space-y-2 ${activeTab === 'features' ? 'hidden md:block' : 'block'}`}>
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Online Members ({roomUsers.length})
              </span>
            </div>

            <div className="space-y-1.5">
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

                    {/* Direct Call Actions (Beta Modal Trigger) */}
                    {!isMe && (
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => handleAction(onOpenBetaModal)}
                          className="p-2 rounded-xl transition min-w-[36px] min-h-[36px] flex items-center justify-center text-zinc-300 hover:text-[#00ff88] bg-[#0b101c] hover:bg-[#00ff88]/10 border border-[#1a263d] active:scale-95"
                          title="Audio Call (Beta)"
                        >
                          <Phone className="w-4 h-4 text-[#00ff88]" />
                        </button>

                        <button
                          onClick={() => handleAction(onOpenBetaModal)}
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
          </div>

        </div>

        {/* Footer Identity & Status */}
        <div className="p-3 border-t border-[#161f30] bg-[#04060a] shrink-0 text-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
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
