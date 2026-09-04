import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Phone, 
  Video, 
  Paperclip, 
  ShieldCheck, 
  KeyRound, 
  Crown, 
  Save, 
  Check, 
  Lock, 
  Info,
  Users
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function RoomSettingsModal({ isOpen, onClose }) {
  const { currentRoom, user, updateRoomSettings } = useSocket();

  const isHost = Boolean(
    currentRoom?.hostId && (currentRoom.hostId === user.id || currentRoom.hostId === user.name)
  );

  const [name, setName] = useState('');
  const [allowAudioCalls, setAllowAudioCalls] = useState(true);
  const [allowVideoCalls, setAllowVideoCalls] = useState(true);
  const [allowMediaUploads, setAllowMediaUploads] = useState(true);
  const [password, setPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentRoom) {
      setName(currentRoom.name || '');
      setAllowAudioCalls(currentRoom.allowAudioCalls !== false);
      setAllowVideoCalls(currentRoom.allowVideoCalls !== false);
      setAllowMediaUploads(currentRoom.allowMediaUploads !== false);
      setChangePassword(false);
      setPassword('');
      setError('');
      setSaveSuccess(false);
    }
  }, [currentRoom, isOpen]);

  if (!isOpen || !currentRoom) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isHost) return;

    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    const payload = {
      name: name.trim() || currentRoom.name,
      allowAudioCalls,
      allowVideoCalls,
      allowMediaUploads
    };

    if (changePassword) {
      payload.password = password.trim();
    }

    const res = await updateRoomSettings(payload);
    setIsSaving(false);

    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onClose) onClose();
      }, 1200);
    } else {
      setError(res.error || 'Failed to update room settings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-mono select-none">
      <div className="w-full max-w-md max-h-[90dvh] bg-[#080d17] rounded-2xl border border-[#1a263d] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-[#161f30] flex items-center justify-between bg-[#0a1120] shrink-0">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-[#00ff88]" />
            <h3 className="font-bold text-sm text-zinc-100">
              Room Settings & Permissions
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto scroll-touch flex-1 space-y-4">
          {/* Room Metadata Banner */}
          <div className="p-3 bg-[#05080f] rounded-xl border border-[#161f30] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Room ID
              </span>
              <span className="text-xs font-mono font-bold text-[#00f0ff]">
                {currentRoom.id}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#161f30]">
              <span className="text-zinc-400">Host / Creator:</span>
              <span className="font-semibold text-zinc-200 flex items-center space-x-1">
                <Crown className="w-3 h-3 text-[#00ff88]" />
                <span>{currentRoom.hostName || (isHost ? user.name : 'Room Admin')}</span>
                {isHost && <span className="text-[10px] text-[#00ff88] font-bold">(You)</span>}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-[#ff3366]/10 border border-[#ff3366]/30 rounded-xl text-xs text-[#ff3366] animate-fade-in">
              {error}
            </div>
          )}

          {saveSuccess && (
            <div className="p-2.5 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-xl text-xs text-[#00ff88] flex items-center space-x-2 animate-fade-in">
              <Check className="w-4 h-4 text-[#00ff88]" />
              <span>Room settings updated and broadcast to all members!</span>
            </div>
          )}

          {isHost ? (
            /* Host Edit Form */
            <form onSubmit={handleSave} className="space-y-4">
              {/* Room Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Room Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter room name"
                  className="w-full bg-[#05080f] border border-[#1a263d] rounded-xl px-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#00ff88]"
                  required
                />
              </div>

              {/* Call & Sharing Permissions Controls */}
              <div className="p-3.5 bg-[#05080f] rounded-xl border border-[#161f30] space-y-3">
                <div className="flex items-center space-x-2 text-zinc-300">
                  <ShieldCheck className="w-4 h-4 text-[#00ff88]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Call & Sharing Permissions
                  </span>
                </div>

                {/* Voice Calls Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded-lg border ${allowAudioCalls ? 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]' : 'bg-[#161f30] border-[#1f2a3e] text-zinc-500'}`}>
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Allow Voice / Audio Calls</p>
                      <p className="text-[10px] text-zinc-400">Enable peer-to-peer 1-on-1 audio calls</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowAudioCalls}
                    onChange={(e) => setAllowAudioCalls(e.target.checked)}
                    className="w-4 h-4 accent-[#00ff88] cursor-pointer"
                  />
                </div>

                {/* Video Calls Toggle */}
                <div className="flex items-center justify-between border-t border-[#161f30]/60 pt-2.5">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded-lg border ${allowVideoCalls ? 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff]' : 'bg-[#161f30] border-[#1f2a3e] text-zinc-500'}`}>
                      <Video className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Allow Video Calls</p>
                      <p className="text-[10px] text-zinc-400">Enable camera & video streaming</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowVideoCalls}
                    onChange={(e) => setAllowVideoCalls(e.target.checked)}
                    className="w-4 h-4 accent-[#00f0ff] cursor-pointer"
                  />
                </div>

                {/* File Uploads Toggle */}
                <div className="flex items-center justify-between border-t border-[#161f30]/60 pt-2.5">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded-lg border ${allowMediaUploads ? 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]' : 'bg-[#161f30] border-[#1f2a3e] text-zinc-500'}`}>
                      <Paperclip className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Allow File Sharing</p>
                      <p className="text-[10px] text-zinc-400">Allow members to share images and files</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowMediaUploads}
                    onChange={(e) => setAllowMediaUploads(e.target.checked)}
                    className="w-4 h-4 accent-[#00ff88] cursor-pointer"
                  />
                </div>
              </div>

              {/* Password Management */}
              <div className="p-3.5 bg-[#05080f] rounded-xl border border-[#161f30] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-4 h-4 text-[#00f0ff]" />
                    <span className="text-xs font-bold text-zinc-200">Update Password</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={changePassword}
                    onChange={(e) => setChangePassword(e.target.checked)}
                    className="w-4 h-4 accent-[#00f0ff] cursor-pointer"
                  />
                </div>

                {changePassword && (
                  <div className="animate-fade-in pt-1">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave empty to remove password or enter new PIN"
                      className="w-full bg-[#080d17] border border-[#1a263d] rounded-xl px-3.5 py-2 text-xs text-[#00f0ff] font-mono focus:outline-none focus:border-[#00f0ff]"
                    />
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Leave empty to make room public, or set a new password.
                    </p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-[#00ff88] hover:bg-[#00e67a] text-black font-bold text-xs rounded-xl transition shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save & Broadcast Settings'}</span>
              </button>
            </form>
          ) : (
            /* Member Read-Only View */
            <div className="space-y-3">
              <div className="p-3 bg-[#0a1120] border border-[#1a263d] rounded-xl flex items-center space-x-2 text-xs text-zinc-300">
                <Info className="w-4 h-4 text-[#00f0ff] shrink-0" />
                <span>You are viewing room permissions configured by the host. Only the host can modify these settings.</span>
              </div>

              <div className="p-3.5 bg-[#05080f] rounded-xl border border-[#161f30] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Active Permissions
                </span>

                <div className="flex items-center justify-between py-1 border-b border-[#161f30]">
                  <span className="text-xs text-zinc-300 flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Voice Calls</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${currentRoom.allowAudioCalls !== false ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                    {currentRoom.allowAudioCalls !== false ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#161f30]">
                  <span className="text-xs text-zinc-300 flex items-center space-x-2">
                    <Video className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Video Calls</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${currentRoom.allowVideoCalls !== false ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                    {currentRoom.allowVideoCalls !== false ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-zinc-300 flex items-center space-x-2">
                    <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                    <span>File Sharing</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${currentRoom.allowMediaUploads !== false ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                    {currentRoom.allowMediaUploads !== false ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
