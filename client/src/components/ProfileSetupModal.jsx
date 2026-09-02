import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  Monitor, 
  Smartphone,
  ArrowRight,
  RefreshCw,
  User
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { getAvatarSvg, generateRandomName, getColorForString } from '../utils/avatar';
import { sound } from '../utils/sound';

export default function ProfileSetupModal() {
  const { user, showProfileSetup, completeProfileSetup } = useSocket();
  const [name, setName] = useState(user.name);
  const [avatarSeed, setAvatarSeed] = useState(user.avatar || user.name);
  const [tagline, setTagline] = useState(user.tagline || 'Hey there! I am using Vision.');
  const [device, setDevice] = useState(user.device || 'desktop');

  if (!showProfileSetup) return null;

  const handleRandomize = () => {
    const newName = generateRandomName();
    setName(newName);
    setAvatarSeed(newName);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    sound.playMessageSend();
    completeProfileSetup({
      name: name.trim(),
      avatar: avatarSeed.trim(),
      tagline: tagline.trim(),
      color: getColorForString(name.trim()).accent,
      device
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in font-mono select-none">
      <div className="w-full max-w-md bg-[#080d17] rounded-2xl border border-[#00ff88]/40 shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#161f30] flex items-center justify-between bg-[#0a1120]">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-[#00ff88]" />
            <h3 className="font-bold text-sm text-zinc-100">
              Set Up Your Profile
            </h3>
          </div>

          <span className="text-xs text-[#00ff88] font-bold">
            Step 1 of 1
          </span>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Avatar Preview */}
          <div className="flex items-center space-x-4 p-3.5 bg-[#05080f] rounded-xl border border-[#161f30]">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-xl border border-[#00ff88]/50 overflow-hidden shadow-lg">
                <img
                  src={getAvatarSvg(avatarSeed)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-zinc-300">
                  Profile Avatar
                </span>
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="text-xs text-[#00ff88] hover:underline flex items-center space-x-1 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Randomize</span>
                </button>
              </div>
              <p className="text-xs text-zinc-400">
                Click randomize to generate a unique look
              </p>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-zinc-300">
                Display Name / Nickname
              </label>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setAvatarSeed(e.target.value);
              }}
              placeholder="Your name"
              className="w-full bg-[#05080f] border border-[#1a263d] focus:border-[#00ff88] rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none"
              required
            />
          </div>

          {/* Device Profile */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Current Device
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                  device === 'desktop'
                    ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]'
                    : 'bg-[#05080f] border-[#161f30] text-zinc-400'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Desktop / Laptop</span>
              </button>

              <button
                type="button"
                onClick={() => setDevice('mobile')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                  device === 'mobile'
                    ? 'bg-[#00f0ff]/10 border-[#00f0ff] text-[#00f0ff]'
                    : 'bg-[#05080f] border-[#161f30] text-zinc-400'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Mobile Phone</span>
              </button>
            </div>
          </div>

          {/* Status Tagline */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              Status Message (Optional)
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Working remotely, Chilling"
              className="w-full bg-[#05080f] border border-[#1a263d] focus:border-[#00ff88] rounded-xl px-4 py-2 text-xs text-zinc-200 focus:outline-none"
            />
          </div>

          {/* Confirm Button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#00ff88] hover:bg-[#00e67a] text-black font-bold text-xs rounded-xl transition shadow-lg flex items-center justify-center space-x-2 mt-2"
          >
            <span>Save & Start Chatting</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
