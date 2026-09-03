import React, { useState } from 'react';
import { 
  Zap, 
  KeyRound, 
  ArrowRight, 
  Sparkles,
  Lock,
  User,
  Shield,
  Wifi
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { generateRandomName } from '../utils/avatar';

export default function AuthModal() {
  const { loginAsGuest, loginWithPasskey, user, ipInfo } = useSocket();
  const [activeTab, setActiveTab] = useState('guest'); // 'guest' | 'passkey'
  const [handle, setHandle] = useState(user.name);
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');

  const handleRandomize = () => {
    const newHandle = generateRandomName();
    setHandle(newHandle);
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    if (!handle.trim()) {
      setError('Please enter a username.');
      return;
    }
    setError('');
    loginAsGuest(handle.trim());
  };

  const handlePasskeySubmit = (e) => {
    e.preventDefault();
    if (!handle.trim() || !passkey.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    loginWithPasskey(handle.trim(), passkey.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in font-mono select-none">
      <div className="w-full max-w-md uiverse-modal relative max-h-[92dvh] overflow-y-auto scroll-touch p-5 sm:p-7">
        {/* Heading */}
        <div className="text-center mt-1 mb-3.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#202020] rounded-full border border-[#2e2e2e] text-[10px] text-[#00ff88] font-bold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            <span>Vision Messenger Online</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
            Welcome to Vision
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Fast, secure local Wi-Fi and custom room communication
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center gap-2 mb-4 bg-[#111111] p-1.5 rounded-[16px] border border-[#222222]">
          <button
            type="button"
            onClick={() => { setActiveTab('guest'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-[12px] transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'guest'
                ? 'bg-[#252525] text-[#00ff88] shadow-md border border-[#00ff88]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Quick Join</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('passkey'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-[12px] transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'passkey'
                ? 'bg-[#252525] text-[#00f0ff] shadow-md border border-[#00f0ff]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Password Sign In</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-3.5 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 text-center font-medium">
            {error}
          </div>
        )}

        {/* Form Body */}
        {activeTab === 'guest' ? (
          <form onSubmit={handleGuestSubmit} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  Your Username
                </span>
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="text-xs text-[#00ff88] hover:underline font-semibold flex items-center space-x-1 active:scale-95 transition"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Randomize</span>
                </button>
              </div>

              <div className="field">
                <User className="input-icon text-[#00ff88]" />
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="Enter your username"
                  className="input-field text-white font-bold"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="p-3.5 bg-[#121212] rounded-[18px] border border-[#222222] space-y-1.5 shadow-inner text-xs">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-zinc-500 flex items-center space-x-1">
                  <Wifi className="w-3 h-3 text-[#00ff88]" />
                  <span>Auto Network:</span>
                </span>
                <span className="text-zinc-200 font-bold truncate max-w-[180px]">
                  {ipInfo?.autoRoom?.roomName || 'Local Wi-Fi Network'}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-zinc-500 flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-[#00f0ff]" />
                  <span>Account:</span>
                </span>
                <span className="text-[#00ff88] font-bold">Zero sign-up required</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="button-submit"
            >
              <span>Enter Vision</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasskeySubmit} className="space-y-3.5">
            <div>
              <div className="px-1 mb-1.5">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  Username
                </span>
              </div>

              <div className="field">
                <User className="input-icon text-[#00f0ff]" />
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="Enter your username"
                  className="input-field text-white font-bold"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="px-1 mb-1.5">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  Password
                </span>
              </div>

              <div className="field">
                <Lock className="input-icon text-[#00f0ff]" />
                <input
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Enter account password"
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="button-submit"
            >
              <KeyRound className="w-4 h-4 text-[#00f0ff]" />
              <span>Authenticate & Enter</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
