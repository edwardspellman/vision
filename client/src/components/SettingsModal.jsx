import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Save, 
  Sparkles,
  Smartphone,
  Monitor,
  User,
  LogOut
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { getAvatarSvg, generateRandomName, getColorForString } from '../utils/avatar';
import { sound } from '../utils/sound';

export default function SettingsModal({ isOpen, onClose, soundMuted, setSoundMuted }) {
  const { user, updateUserProfile, logout } = useSocket();
  const [name, setName] = useState(user.name);
  const [avatarSeed, setAvatarSeed] = useState(user.avatar || user.name);
  const [device, setDevice] = useState(user.device || 'desktop');

  if (!isOpen) return null;

  const handleRandomize = () => {
    const newName = generateRandomName();
    setName(newName);
    setAvatarSeed(newName);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateUserProfile({
      name: name.trim(),
      avatar: avatarSeed.trim(),
      color: getColorForString(name.trim()).accent,
      device
    });
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono select-none">
      <div className="w-full max-w-sm uiverse-modal relative max-h-[92dvh] overflow-y-auto scroll-touch p-5 sm:p-7">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-[#222222] hover:bg-black transition active:scale-95"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mt-1 mb-3.5">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
            Profile & Settings
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Update your handle, avatar, and client preferences
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center p-3.5 bg-[#121212] rounded-[18px] border border-[#222222] shadow-inner">
            <div className="relative mb-2 group">
              <div className="w-16 h-16 rounded-[16px] border-2 border-[#00ff88]/50 overflow-hidden shadow-lg bg-black">
                <img
                  src={getAvatarSvg(avatarSeed)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={handleRandomize}
                className="absolute -bottom-1 -right-1 p-1.5 bg-[#00ff88] text-black rounded-full shadow transition hover:scale-105 active:scale-95"
                title="Randomize Avatar"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleRandomize}
              className="text-xs text-[#00ff88] hover:underline flex items-center space-x-1 font-semibold active:scale-95 transition"
            >
              <Sparkles className="w-3 h-3" />
              <span>Randomize Avatar</span>
            </button>
          </div>

          {/* Name Input */}
          <div>
            <div className="px-1 mb-1.5">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                Display Name
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
              />
            </div>
          </div>

          {/* Device Profile */}
          <div>
            <div className="px-1 mb-1.5">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                Device Type
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

          {/* Audio Notifications */}
          <div className="p-3.5 bg-[#121212] rounded-[18px] border border-[#222222] flex items-center justify-between shadow-inner">
            <div className="flex items-center space-x-2 text-xs font-bold text-zinc-200">
              {soundMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-[#00ff88]" />}
              <span>Sound Effects</span>
            </div>
            <input
              type="checkbox"
              checked={!soundMuted}
              onChange={(e) => {
                const muted = !e.target.checked;
                setSoundMuted(muted);
                sound.setMuted(muted);
              }}
              className="w-4 h-4 accent-[#00ff88] cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="submit"
              className="button-submit"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 bg-[#202020] hover:bg-rose-950/60 text-rose-400 hover:text-rose-200 font-bold text-xs rounded-[12px] transition flex items-center justify-center space-x-1.5 border border-rose-500/20 active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out / Switch User</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
