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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in font-mono select-none">
      <form onSubmit={handleSubmit} className="form w-full max-w-md">
        <p id="heading" className="flex items-center justify-center gap-2">
          <User className="w-5 h-5 text-[#00ff88]" />
          <span>Set Up Your Profile</span>
        </p>

        {/* Avatar Preview */}
        <div className="flex items-center space-x-4 p-3.5 bg-[#05080f] rounded-2xl border border-[#1a263d]">
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
              Click randomize to generate a unique avatar
            </p>
          </div>
        </div>

        {/* Name Input */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1">
            Display Name / Nickname
          </label>
          <div className="field">
            <User className="input-icon" />
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setAvatarSeed(e.target.value);
              }}
              placeholder="Enter display name"
              className="input-field"
              required
            />
          </div>
        </div>

        {/* Device Profile */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1">
            Current Device
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition min-h-[44px] ${
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
              className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition min-h-[44px] ${
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
          <div className="field">
            <Sparkles className="input-icon" />
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Enter status message"
              className="input-field"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="btn">
          <button type="submit" className="button2 w-full flex items-center justify-center space-x-2">
            <span>Save & Start Chatting</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
