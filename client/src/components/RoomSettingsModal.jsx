import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Save, 
  Shield, 
  KeyRound, 
  Upload, 
  PhoneCall, 
  Mic, 
  Users,
  Check
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function RoomSettingsModal({ isOpen, onClose }) {
  const { currentRoom, updateRoomSettings, isHost } = useSocket();

  const [name, setName] = useState('');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [maxUsers, setMaxUsers] = useState('50');

  // Permissions State
  const [allowFileUploads, setAllowFileUploads] = useState(true);
  const [allowCalls, setAllowCalls] = useState(true);
  const [allowVoiceNotes, setAllowVoiceNotes] = useState(true);
  const [onlyHostCanPost, setOnlyHostCanPost] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && currentRoom) {
      setName(currentRoom.name || '');
      setEnablePassword(Boolean(currentRoom.hasPassword));
      setPassword('');
      setMaxUsers(String(currentRoom.maxUsers || 50));

      const settings = currentRoom.settings || {};
      setAllowFileUploads(settings.allowFileUploads ?? true);
      setAllowCalls(settings.allowCalls ?? true);
      setAllowVoiceNotes(settings.allowVoiceNotes ?? true);
      setOnlyHostCanPost(settings.onlyHostCanPost ?? false);

      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, currentRoom]);

  if (!isOpen || !currentRoom || !isHost) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    const res = await updateRoomSettings({
      name: name.trim() || currentRoom.id,
      password: enablePassword ? password.trim() : '',
      maxUsers: Number(maxUsers) || 50,
      settings: {
        allowFileUploads,
        allowCalls,
        allowVoiceNotes,
        onlyHostCanPost
      }
    });

    setSaving(false);

    if (res.success) {
      setSuccessMsg('Room settings updated successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } else {
      setError(res.error || 'Failed to update settings');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-mono select-none">
      <div className="w-full max-w-md bg-[#080d17] rounded-2xl border border-[#1a263d] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#161f30] flex items-center justify-between bg-[#0a1120] shrink-0">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-[#00f0ff]" />
            <h3 className="font-bold text-sm text-zinc-100">
              Room Settings & Governance
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-2.5 bg-[#ff3366]/10 border border-[#ff3366]/30 rounded-xl text-xs text-[#ff3366]">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-xl text-xs text-[#00ff88] flex items-center space-x-1.5 font-bold">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isHost && currentRoom.isCustom && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
              ⚠️ Note: Only the room host can alter room permissions.
            </div>
          )}

          {/* Room Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Room Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Room Name"
              className="w-full bg-[#05080f] border border-[#1a263d] focus:border-[#00f0ff] rounded-xl px-4 py-2.5 text-xs text-zinc-100 font-bold focus:outline-none"
              disabled={!isHost && currentRoom.isCustom}
              required
            />
          </div>

          {/* Password Settings */}
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
                disabled={!isHost && currentRoom.isCustom}
              />
            </div>

            {enablePassword && (
              <div className="animate-fade-in pt-1">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new room password (leave blank to keep current)"
                  className="w-full bg-[#080d17] border border-[#1a263d] rounded-xl px-3.5 py-2 text-xs text-[#ffb700] font-mono focus:outline-none focus:border-[#ffb700]"
                  disabled={!isHost && currentRoom.isCustom}
                />
              </div>
            )}
          </div>

          {/* Permissions Suite */}
          <div className="p-3.5 bg-[#05080f] rounded-xl border border-[#161f30] space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-[#161f30]">
              <Shield className="w-4 h-4 text-[#00f0ff]" />
              <span className="text-xs font-bold text-zinc-200">Member Permissions</span>
            </div>

            {/* Announcement Mode */}
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-300 block">Announcement Mode</span>
                <span className="text-[10px] text-zinc-500 block">Only host can post messages</span>
              </div>
              <input
                type="checkbox"
                checked={onlyHostCanPost}
                onChange={(e) => setOnlyHostCanPost(e.target.checked)}
                className="w-4 h-4 accent-[#00f0ff] cursor-pointer shrink-0"
                disabled={!isHost && currentRoom.isCustom}
              />
            </div>

            {/* File Uploads */}
            <div className="flex items-center justify-between py-1 border-t border-[#121928]">
              <div className="flex items-center space-x-2">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-zinc-300">Allow File & Image Sharing</span>
              </div>
              <input
                type="checkbox"
                checked={allowFileUploads}
                onChange={(e) => setAllowFileUploads(e.target.checked)}
                className="w-4 h-4 accent-[#00ff88] cursor-pointer shrink-0"
                disabled={!isHost && currentRoom.isCustom}
              />
            </div>

            {/* Calls */}
            <div className="flex items-center justify-between py-1 border-t border-[#121928]">
              <div className="flex items-center space-x-2">
                <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-semibold text-zinc-300">Allow Audio / Video Calls</span>
              </div>
              <input
                type="checkbox"
                checked={allowCalls}
                onChange={(e) => setAllowCalls(e.target.checked)}
                className="w-4 h-4 accent-[#00f0ff] cursor-pointer shrink-0"
                disabled={!isHost && currentRoom.isCustom}
              />
            </div>

            {/* Voice Notes */}
            <div className="flex items-center justify-between py-1 border-t border-[#121928]">
              <div className="flex items-center space-x-2">
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-zinc-300">Allow Voice Notes</span>
              </div>
              <input
                type="checkbox"
                checked={allowVoiceNotes}
                onChange={(e) => setAllowVoiceNotes(e.target.checked)}
                className="w-4 h-4 accent-[#ffb700] cursor-pointer shrink-0"
                disabled={!isHost && currentRoom.isCustom}
              />
            </div>

            {/* Max Capacity */}
            <div className="pt-1.5 border-t border-[#121928] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-semibold text-zinc-300">Max Member Capacity</span>
              </div>
              <select
                value={maxUsers}
                onChange={(e) => setMaxUsers(e.target.value)}
                className="bg-[#080d17] border border-[#1a263d] text-zinc-200 text-xs rounded-lg px-2 py-1 font-mono focus:outline-none focus:border-[#00f0ff]"
                disabled={!isHost && currentRoom.isCustom}
              >
                <option value="5">5 Members</option>
                <option value="10">10 Members</option>
                <option value="25">25 Members</option>
                <option value="50">50 Members</option>
                <option value="100">100 Members</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          {isHost || !currentRoom.isCustom ? (
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-[#00f0ff] hover:bg-[#00d0e0] text-black font-bold text-xs rounded-xl transition shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Settings...' : 'Save Room Settings'}</span>
            </button>
          ) : null}
        </form>
      </div>
    </div>
  );
}
