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
  Video, 
  Paperclip, 
  ShieldCheck,
  Hash,
  Type,
  Lock,
  Crown,
  MessageSquare,
  Users
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
  const [allowAudioCalls, setAllowAudioCalls] = useState(true);
  const [allowVideoCalls, setAllowVideoCalls] = useState(true);
  const [allowMediaUploads, setAllowMediaUploads] = useState(true);
  const [allowMemberChat, setAllowMemberChat] = useState(true);
  const [maxUsers, setMaxUsers] = useState(50);
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
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-[#222222] hover:bg-black transition active:scale-95"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Heading */}
        <div className="text-center mt-1 mb-3.5">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
            {activeTab === 'create' ? 'Create Custom Room' : 'Join with Room ID'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {activeTab === 'create' 
              ? 'Configure room identity, security, and host controls' 
              : 'Enter the Room ID to connect with peers'}
          </p>
        </div>

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

            {/* Room ID / Code Box (Matching Password / PIN Protector card design) */}
            <div className="p-3.5 bg-[#121212] rounded-[18px] border border-[#222222] space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Hash className="w-3.5 h-3.5 text-[#00ff88]" />
                  <span className="text-xs font-semibold text-zinc-200">Room ID / Code</span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateRandomId}
                  className="text-xs text-[#00ff88] hover:underline font-semibold flex items-center space-x-1 active:scale-95 transition"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto Generate</span>
                </button>
              </div>

              <div className="field">
                <Hash className="input-icon text-[#00ff88]" />
                <input
                  type="text"
                  value={createId}
                  onChange={(e) => setCreateId(e.target.value.toUpperCase())}
                  placeholder="Enter room ID"
                  className="input-field text-[#00ff88] font-bold uppercase tracking-wider"
                  required
                />
              </div>
            </div>

            {/* Room Name Box (Matching card design) */}
            <div className="p-3.5 bg-[#121212] rounded-[18px] border border-[#222222] space-y-2.5 shadow-inner">
              <div className="flex items-center space-x-2">
                <Type className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span className="text-xs font-semibold text-zinc-200">Room Name (Optional)</span>
              </div>

              <div className="field">
                <Type className="input-icon text-zinc-400" />
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Enter room name"
                  className="input-field"
                />
              </div>
            </div>

            {/* Password / PIN Protector Box */}
            <div className="p-3.5 bg-[#121212] rounded-[18px] border border-[#222222] space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <KeyRound className="w-3.5 h-3.5 text-[#00f0ff]" />
                  <span className="text-xs font-semibold text-zinc-200">Password / PIN Protection</span>
                </div>
                <input
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(e) => setEnablePassword(e.target.checked)}
                  className="w-4 h-4 accent-[#00f0ff] cursor-pointer"
                />
              </div>

              {enablePassword && (
                <div className="animate-fade-in pt-1 space-y-1">
                  <div className="field">
                    <Lock className="input-icon text-[#00f0ff]" />
                    <input
                      type="password"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      placeholder="Enter room password"
                      className="input-field text-[#00f0ff]"
                      required={enablePassword}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 px-1">
                    Peers must enter this password to join.
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

              {/* Allow Voice Calls */}
              <div className="flex items-center justify-between border-t border-[#222222] pt-2">
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-[#00ff88]" />
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">Allow Voice Calls</p>
                    <p className="text-[10px] text-zinc-400">Audio calling across peers</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowAudioCalls}
                  onChange={(e) => setAllowAudioCalls(e.target.checked)}
                  className="w-4 h-4 accent-[#00ff88] cursor-pointer"
                />
              </div>

              {/* Allow Video Calls */}
              <div className="flex items-center justify-between border-t border-[#222222] pt-2">
                <div className="flex items-center space-x-2">
                  <Video className="w-3.5 h-3.5 text-[#00f0ff]" />
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">Allow Video Calls</p>
                    <p className="text-[10px] text-zinc-400">Camera & screen streaming</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowVideoCalls}
                  onChange={(e) => setAllowVideoCalls(e.target.checked)}
                  className="w-4 h-4 accent-[#00f0ff] cursor-pointer"
                />
              </div>

              {/* Allow File Sharing */}
              <div className="flex items-center justify-between border-t border-[#222222] pt-2">
                <div className="flex items-center space-x-2">
                  <Paperclip className="w-3.5 h-3.5 text-zinc-300" />
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">Allow File Sharing</p>
                    <p className="text-[10px] text-zinc-400">Upload photos & files</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowMediaUploads}
                  onChange={(e) => setAllowMediaUploads(e.target.checked)}
                  className="w-4 h-4 accent-[#00ff88] cursor-pointer"
                />
              </div>

              {/* Member Chat Permission */}
              <div className="flex items-center justify-between border-t border-[#222222] pt-2">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[#00ff88]" />
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">Allow Member Chat</p>
                    <p className="text-[10px] text-zinc-400">All members can send messages</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowMemberChat}
                  onChange={(e) => setAllowMemberChat(e.target.checked)}
                  className="w-4 h-4 accent-[#00ff88] cursor-pointer"
                />
              </div>

              {/* Member Capacity */}
              <div className="border-t border-[#222222] pt-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-200">Max Member Capacity</span>
                </div>
                <select
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(Number(e.target.value))}
                  className="bg-[#1b1b1b] border border-[#2a2a2a] rounded-lg px-2.5 py-1 text-xs text-zinc-200 font-bold focus:outline-none focus:border-[#00ff88]"
                >
                  <option value={10}>10 peers</option>
                  <option value={25}>25 peers</option>
                  <option value={50}>50 peers</option>
                  <option value={100}>100 peers</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating}
              className="button-submit"
            >
              <span>{isCreating ? 'Creating Room...' : 'Create & Join Room'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinSubmit} className="space-y-3.5">
            {/* Join Room ID Box */}
            <div className="p-3.5 bg-[#121212] rounded-[18px] border border-[#222222] space-y-2.5 shadow-inner">
              <div className="flex items-center space-x-2">
                <Hash className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span className="text-xs font-semibold text-zinc-200">Target Room ID</span>
              </div>

              <div className="field">
                <Hash className="input-icon text-[#00f0ff]" />
                <input
                  type="text"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                  placeholder="Enter room ID"
                  className="input-field text-[#00f0ff] font-bold uppercase tracking-wider"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Join Password Box */}
            <div className="p-3.5 bg-[#121212] rounded-[18px] border border-[#222222] space-y-2.5 shadow-inner">
              <div className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span className="text-xs font-semibold text-zinc-200">Password (If required)</span>
              </div>

              <div className="field">
                <Lock className="input-icon text-zinc-400" />
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Leave blank if no password"
                  className="input-field"
                />
              </div>
            </div>

            {/* Join Button */}
            <button
              type="submit"
              className="button-submit"
            >
              <LogIn className="w-4 h-4 text-[#00f0ff]" />
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
