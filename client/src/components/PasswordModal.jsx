import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function PasswordModal() {
  const { 
    passwordModalOpen, 
    setPasswordModalOpen, 
    pendingRoomId, 
    passwordError, 
    joinRoom,
    ipInfo 
  } = useSocket();
  const [password, setPassword] = useState('');

  if (!passwordModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim() || !pendingRoomId) return;
    joinRoom(pendingRoomId, password.trim());
  };

  const handleCancel = () => {
    setPasswordModalOpen(false);
    if (ipInfo?.autoRoom?.roomId) {
      joinRoom(ipInfo.autoRoom.roomId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in font-mono select-none">
      <div className="w-full max-w-sm bg-[#080d17] rounded-2xl border border-[#00f0ff]/40 shadow-2xl p-6">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] mx-auto flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-100 mb-1">
            Password Required
          </h3>
          <p className="text-xs text-zinc-400">
            Room <span className="text-[#00f0ff] font-bold">{pendingRoomId}</span> is password-protected.
          </p>
        </div>

        {passwordError && (
          <div className="mb-4 p-2.5 bg-[#ff3366]/10 border border-[#ff3366]/30 rounded-lg text-xs text-[#ff3366] text-center font-bold">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter room password"
              className="w-full bg-[#05080f] border border-[#1a263d] focus:border-[#00f0ff] rounded-xl px-4 py-2.5 text-xs text-[#00f0ff] focus:outline-none pr-9 font-mono"
              required
            />
            <KeyRound className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#00f0ff] hover:bg-[#00d8e8] text-black font-bold text-xs rounded-xl transition shadow-lg flex items-center justify-center space-x-2 active:scale-95"
          >
            <span>Unlock & Join Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-[#161f30] text-center">
          <button
            onClick={handleCancel}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition font-medium"
          >
            Cancel & Return to Local Network
          </button>
        </div>
      </div>
    </div>
  );
}
