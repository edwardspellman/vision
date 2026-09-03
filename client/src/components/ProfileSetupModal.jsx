import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  Monitor, 
  Smartphone,
  ArrowRight,
  RefreshCw,
  User,
  MessageSquare
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in font-mono select-none">
      <div className="w-full max-w-md uiverse-modal relative max-h-[92dvh] overflow-y-auto scroll-touch p-5 sm:p-7">
        {/* Heading */}
        <div className="text-center mt-1 mb-3.5">
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-[#202020] rounded-full border border-[#2e2e2e] text-[10px] text-[#00ff88] font-bold mb-2">
            <span>Step 1 of 1</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
            Set Up Your Profile
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Customize how other peers in rooms and on your local Wi-Fi see you
          </p>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Avatar Preview Box */}
          <div className="flex items-center space-x-4 p-3.5 bg-[#121212] rounded-[18px] border border-[#222222] shadow-inner">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-[16px] border-2 border-[#00ff88]/50 overflow-hidden shadow-lg bg-black">
                <img
                  src={getAvatarSvg(avatarSeed)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-zinc-200">
                  Profile Avatar
                </span>
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="text-xs text-[#00ff88] hover:underline flex items-center space-x-1 font-semibold active:scale-95 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Randomize</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">
                Auto-generated cyber avatar
              </p>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <div className="px-1 mb-1.5">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                Display Name / Nickname
              </span>
            </div>

            <div className="field">
              <User className="input-icon text-[#00ff88]" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setAvatarSeed(e.target.value);
                }}
                placeholder="Enter your name"
                className="input-field text-white font-bold"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Device Profile */}
          <div>
            <div className="px-1 mb-1.5">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                Current Device
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`py-2 px-3 rounded-[14px] border text-xs font-bold flex items-center justify-center space-x-2 transition active:scale-95 ${
                  device === 'desktop'
                    ? 'bg-[#252525] border-[#00ff88]/50 text-[#00ff88] shadow-md'
                    : 'bg-[#121212] border-[#222222] text-zinc-400 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Desktop</span>
              </button>

              <button
                type="button"
                onClick={() => setDevice('mobile')}
                className={`py-2 px-3 rounded-[14px] border text-xs font-bold flex items-center justify-center space-x-2 transition active:scale-95 ${
                  device === 'mobile'
                    ? 'bg-[#252525] border-[#00f0ff]/50 text-[#00f0ff] shadow-md'
                    : 'bg-[#121212] border-[#222222] text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          {/* Status Tagline */}
          <div>
            <div className="px-1 mb-1.5">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                Status Message (Optional)
              </span>
            </div>

            <div className="field">
              <MessageSquare className="input-icon text-zinc-400" />
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Status message"
                className="input-field"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="button-submit"
          >
            <span>Complete Setup & Enter</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
