import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  Wifi, 
  PlusCircle, 
  Sparkles, 
  ArrowRight,
  KeyRound,
  Phone,
  Upload,
  Mic
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function RoomModal({ isOpen, onClose }) {
  const { createRoom, joinRoom, ipInfo } = useSocket();
  const [activeTab, setActiveTab] = useState('create');

  // Create Room State
  const [createId, setCreateId] = useState('');
  const [createName, setCreateName] = useState('');
  const [enablePassword, setEnablePassword] = useState(false);
  const [createPassword, setCreatePassword] = useState('');
  const [allowAudio, setAllowAudio] = useState(true);
  const [allowFiles, setAllowFiles] = useState(true);
  const [allowVoice, setAllowVoice] = useState(true);
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Join Room State
  const [joinId, setJoinId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  if (!isOpen) return null;

  const handleGenerateRandomId = () => {
    const chars = '0123456789ABCDEF';
    let hex = '';
    for (let i = 0; i < 4; i++) {
      hex += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateId(`ROOM-${hex}`);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createId.trim()) {
      setCreateError('Please enter a Room ID.');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    const res = await createRoom({
      roomId: createId.trim().toUpperCase(),
      name: createName.trim() || createId.trim().toUpperCase(),
      password: enablePassword ? createPassword.trim() : '',
      allowAudio,
      allowFiles,
      allowVoice,
      isPrivate: true,
      maxUsers: Number(maxUsers) || 50,
      allowAudioCalls,
      allowVideoCalls,
      allowMediaUploads,
      allowMemberChat
    });

    setIsCreating(false);

    if (res.success) {
      onClose();
    } else {
      setCreateError(res.error || 'Failed to create room.');
    }
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!joinId.trim()) return;

    joinRoom(joinId.trim().toUpperCase(), joinPassword.trim());
    onClose();
  };

  const handleJoinLocalNetwork = () => {
    if (ipInfo?.autoRoom?.roomId) {
      joinRoom(ipInfo.autoRoom.roomId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono select-none">
      <div className="w-full max-w-md uiverse-room-modal relative max-h-[92dvh] overflow-y-auto scroll-touch p-5 sm:p-7">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-[#222222] hover:bg-black transition active:scale-95"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tab Selection Buttons */}
        <div className="flex justify-center gap-2 mb-4 bg-[#111111] p-1.5 rounded-[16px] border border-[#222222]">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 text-xs font-bold rounded-[12px] transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'create'
                ? 'bg-[#252525] text-[#00ff88] shadow-md border border-[#00ff88]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Room</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 text-xs font-bold rounded-[12px] transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'join'
                ? 'bg-[#252525] text-[#00f0ff] shadow-md border border-[#00f0ff]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Join with ID</span>
          </button>
        </div>

        {/* Forms Content */}
        {activeTab === 'create' ? (
          <form onSubmit={handleCreateSubmit} className="space-y-3.5">
            {createError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 text-center">
                {createError}
              </div>
            )}

              {/* Room ID */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    Room ID / Code
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomId}
                    className="text-xs text-[#00ff88] hover:underline font-semibold flex items-center space-x-1 min-h-[36px] px-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto Generate</span>
                  </button>
                </div>

                <div className="field">
                  <PlusCircle className="input-icon" />
                  <input
                    type="text"
                    value={createId}
                    onChange={(e) => setCreateId(e.target.value.toUpperCase())}
                    placeholder="Enter Room ID"
                    className="input-field text-[#00ff88] uppercase font-bold"
                    required
                  />
                </div>
              </div>

              {/* Room Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Room Name (Optional)
                </label>
                <div className="field">
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Enter Display Room Name"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Room Create Settings & Feature Controls */}
              <div className="p-3.5 bg-[#05080f] rounded-2xl border border-[#161f30] space-y-3">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Room Feature Settings
                </div>

                {/* Audio & Video Calls Allowed */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-[#00f0ff]" />
                    <span className="text-xs font-bold text-zinc-200">Audio & Video Calls</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowAudio}
                    onChange={(e) => setAllowAudio(e.target.checked)}
                    className="w-4 h-4 accent-[#00ff88] cursor-pointer"
                  />
                </div>

                {/* File & Media Sharing Allowed */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-[#00ff88]" />
                    <span className="text-xs font-bold text-zinc-200">File & Media Sharing</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowFiles}
                    onChange={(e) => setAllowFiles(e.target.checked)}
                    className="w-4 h-4 accent-[#00ff88] cursor-pointer"
                  />
                </div>

                {/* Voice Messaging Allowed */}
                <div className="flex items-center justify-between pt-1 border-t border-[#141d2e]">
                  <div className="flex items-center space-x-2">
                    <Mic className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-zinc-200">Voice Messaging</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowVoice}
                    onChange={(e) => setAllowVoice(e.target.checked)}
                    className="w-4 h-4 accent-[#00ff88] cursor-pointer"
                  />
                </div>
              </div>

              {/* Password Protection */}
              <div className="p-3.5 bg-[#05080f] rounded-2xl border border-[#161f30] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-4 h-4 text-[#ffb700]" />
                    <span className="text-xs font-bold text-zinc-200">Password Protection</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enablePassword}
                    onChange={(e) => setEnablePassword(e.target.checked)}
                    className="w-4 h-4 accent-[#00ff88] cursor-pointer"
                  />
                </div>

                {enablePassword && (
                  <div className="animate-fade-in pt-1">
                    <div className="field">
                      <KeyRound className="input-icon text-[#ffb700]" />
                      <input
                        type="text"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        placeholder="Enter room password or PIN"
                        className="input-field text-[#ffb700] font-mono"
                        required={enablePassword}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Anyone joining will need to enter this password.
                    </p>
                  </div>
                )}
              </div>

            {/* Host Settings & Controls Box */}
            <div className="p-3.5 bg-[#121212] rounded-[18px] border border-[#222222] space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-[#00ff88]" />
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Host Settings & Controls
                  </span>
                </div>
                <span className="text-[10px] text-[#00ff88] font-bold px-2 py-0.5 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-full">
                  You are Host
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating}
              className="w-full button2 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isCreating ? 'Creating Room...' : 'Create & Join Room'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Room ID
              </label>
              <div className="field">
                <LogIn className="input-icon text-[#00f0ff]" />
                <input
                  type="text"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                  placeholder="Enter Room ID"
                  className="input-field text-[#00f0ff] font-bold uppercase"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Password (if required)
              </label>
              <div className="field">
                <KeyRound className="input-icon text-zinc-400" />
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Leave blank if no password"
                  className="input-field"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full button2 flex items-center justify-center space-x-2 bg-[#00f0ff] hover:bg-[#00d0e0]"
            >
              <LogIn className="w-4 h-4" />
              <span>Join Room</span>
            </button>
          </form>
        )}

        {/* Back to Local Network Option */}
        <div className="mt-4 pt-3.5 border-t border-[#222222] text-center">
          <button
            onClick={handleJoinLocalNetwork}
            className="text-xs text-zinc-400 hover:text-[#00ff88] inline-flex items-center space-x-1.5 transition font-semibold"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Return to Local Wi-Fi Network</span>
          </button>
        </div>
      </div>
    </div>
  );
}
