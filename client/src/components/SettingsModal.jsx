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
  const { user, updateUserProfile, logout, currentRoom, leaveRoom } = useSocket();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-mono select-none">
      <div className="form w-full max-w-md relative !border-[#1a263d] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pt-2 pb-1 border-b border-[#161f30] mb-2">
          <p id="heading" className="!m-0 text-left flex items-center gap-2">
            <User className="w-5 h-5 text-zinc-200" />
            <span>Profile & Settings</span>
          </p>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl bg-[#05080f] border border-[#161f30] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative mb-2 group">
              <div className="w-16 h-16 rounded-2xl border border-[#1a263d] overflow-hidden shadow-lg">
                <img
                  src={getAvatarSvg(avatarSeed)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={handleRandomize}
                className="absolute -bottom-1 -right-1 p-1.5 bg-[#0b101c] text-zinc-200 border border-[#1a263d] rounded-full shadow transition hover:text-[#00ff88]"
                title="Randomize Avatar"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleRandomize}
              className="text-xs text-zinc-400 hover:text-[#00ff88] hover:underline flex items-center space-x-1 font-semibold transition"
            >
              <Sparkles className="w-3 h-3 text-zinc-400" />
              <span>Randomize Avatar</span>
            </button>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              Display Name
            </label>
            <div className="field">
              <User className="input-icon text-zinc-400" />
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
              Device Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition min-h-[44px] ${
                  device === 'desktop'
                    ? 'bg-[#080d17] border-[#00f0ff]/50 text-[#00f0ff]'
                    : 'bg-[#05080f] border-[#161f30] text-zinc-400'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Desktop</span>
              </button>

              <button
                type="button"
                onClick={() => setDevice('mobile')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition min-h-[44px] ${
                  device === 'mobile'
                    ? 'bg-[#080d17] border-[#00f0ff]/50 text-[#00f0ff]'
                    : 'bg-[#05080f] border-[#161f30] text-zinc-400'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          {/* Audio Notifications */}
          <div className="p-3 bg-[#05080f] rounded-2xl border border-[#161f30] flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-zinc-200">
              {soundMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-zinc-300" />}
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
              className="w-4 h-4 accent-zinc-200 cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              className="button2 w-full flex items-center justify-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>

            {currentRoom?.isCustom && (
              <button
                type="button"
                onClick={() => {
                  leaveRoom();
                  onClose();
                }}
                className="button1 w-full flex items-center justify-center space-x-1.5 text-amber-400 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave Custom Room</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="button3 w-full flex items-center justify-center space-x-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out / Switch User</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
