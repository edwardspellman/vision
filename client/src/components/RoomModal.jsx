import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  Wifi, 
  PlusCircle, 
  Sparkles, 
  ArrowRight,
  KeyRound
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
            className="p-1 text-zinc-400 hover:text-white rounded transition"
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
                    className="text-xs text-[#00ff88] hover:underline font-semibold flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto Generate</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={createId}
                  onChange={(e) => setCreateId(e.target.value.toUpperCase())}
                  placeholder="e.g. ROOM-ALPHA"
                  className="w-full bg-[#05080f] border border-[#1a263d] rounded-xl px-4 py-2.5 text-xs text-[#00ff88] font-bold focus:outline-none focus:border-[#00ff88] uppercase"
                  required
                />
              </div>

              {/* Room Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Room Name (Optional)
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Engineering Team"
                  className="w-full bg-[#05080f] border border-[#1a263d] rounded-xl px-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#00ff88]"
                />
              </div>

              {/* Password Protection */}
              <div className="p-3.5 bg-[#05080f] rounded-xl border border-[#161f30] space-y-2.5">
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
                    <input
                      type="text"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      placeholder="Enter room password or PIN"
                      className="w-full bg-[#080d17] border border-[#1a263d] rounded-xl px-3.5 py-2 text-xs text-[#ffb700] font-mono focus:outline-none focus:border-[#ffb700]"
                      required={enablePassword}
                    />
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
                className="w-full py-3 bg-[#00ff88] hover:bg-[#00e67a] text-black font-bold text-xs rounded-xl transition shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
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
                <input
                  type="text"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                  placeholder="e.g. ROOM-ALPHA"
                  className="w-full bg-[#05080f] border border-[#1a263d] rounded-xl px-4 py-2.5 text-xs text-[#00f0ff] font-bold focus:outline-none focus:border-[#00f0ff] uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Password (if required)
                </label>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Leave blank if no password"
                  className="w-full bg-[#05080f] border border-[#1a263d] rounded-xl px-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#00f0ff] hover:bg-[#00d0e0] text-black font-bold text-xs rounded-xl transition shadow-lg flex items-center justify-center space-x-2"
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
