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
      roomId: createId.trim(),
      name: createName.trim() || createId.trim(),
      password: enablePassword ? createPassword.trim() : '',
      allowAudio,
      allowFiles,
      allowVoice,
      isPrivate: true,
      maxUsers: 50
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-mono select-none">
      <div className="w-full max-w-md bg-[#080d17] rounded-2xl border border-[#1a263d] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#161f30] flex items-center justify-between bg-[#0a1120]">
          <div className="flex items-center space-x-2">
            <PlusCircle className="w-4 h-4 text-[#00ff88]" />
            <h3 className="font-bold text-sm text-zinc-100">
              Rooms
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded transition min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 pb-0 flex space-x-2 border-b border-[#161f30] bg-[#0a1120]">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 pb-3 text-xs font-bold border-b-2 transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'create'
                ? 'border-[#00ff88] text-[#00ff88]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Create Room</span>
          </button>

          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 pb-3 text-xs font-bold border-b-2 transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'join'
                ? 'border-[#00f0ff] text-[#00f0ff]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Join with ID</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'create' ? (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {createError && (
                <div className="p-2.5 bg-[#ff3366]/10 border border-[#ff3366]/30 rounded-lg text-xs text-[#ff3366]">
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

          {/* Return to Wi-Fi Room */}
          <div className="mt-5 pt-3.5 border-t border-[#161f30] text-center">
            <button
              onClick={handleJoinLocalNetwork}
              className="text-xs text-zinc-400 hover:text-[#00ff88] flex items-center justify-center space-x-1.5 mx-auto transition font-medium"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Back to Local Wi-Fi Network</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
