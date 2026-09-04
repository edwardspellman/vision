import React, { useState } from 'react';
import { 
  Zap, 
  KeyRound, 
  ArrowRight, 
  Sparkles,
  Lock,
  MessageSquare
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in font-mono select-none">
      <div className="w-full max-w-md bg-[#080d17] rounded-2xl border border-[#1a263d] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#161f30] flex items-center justify-between bg-[#0a1120]">
          <div>
            <h3 className="font-bold text-base text-zinc-100 flex items-center space-x-1.5">
              <span>Vision</span>
              <span className="text-[#00ff88] text-xs font-normal px-1.5 py-0.5 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded">
                Messenger
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Instant room & Wi-Fi communication
            </p>
          </div>

          <div className="flex items-center space-x-1 px-2.5 py-1 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-full text-[10px] text-[#00ff88] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            <span>Online</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 pb-0 flex space-x-2 border-b border-[#161f30] bg-[#0a1120]">
          <button
            onClick={() => { setActiveTab('guest'); setError(''); }}
            className={`flex-1 pb-3 text-xs font-bold border-b-2 transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'guest'
                ? 'border-[#00ff88] text-[#00ff88]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Quick Join (Instant)</span>
          </button>

          <button
            onClick={() => { setActiveTab('passkey'); setError(''); }}
            className={`flex-1 pb-3 text-xs font-bold border-b-2 transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'passkey'
                ? 'border-[#00f0ff] text-[#00f0ff]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Password Sign In</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-2.5 bg-[#ff3366]/10 border border-[#ff3366]/30 rounded-lg text-xs text-[#ff3366] text-center font-medium">
              {error}
            </div>
          )}

          {activeTab === 'guest' ? (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    Your Username
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomize}
                    className="text-xs text-[#00ff88] hover:underline font-semibold flex items-center space-x-1 min-h-[36px] px-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Randomize</span>
                  </button>
                </div>

                <div className="field">
                  <MessageSquare className="input-icon" />
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="Enter your username"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="p-3.5 bg-[#05080f] rounded-2xl border border-[#161f30] text-xs text-zinc-400 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Your Network:</span>
                  <span className="text-zinc-200 font-semibold truncate max-w-[200px]">{ipInfo?.autoRoom?.roomName || 'Local Wi-Fi Network'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Privacy:</span>
                  <span className="text-[#00ff88]">Zero sign-up required</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full button2 flex items-center justify-center space-x-2"
              >
                <span>Enter Vision</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasskeySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Username
                </label>
                <div className="field">
                  <MessageSquare className="input-icon text-[#00f0ff]" />
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="Enter username"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Password / PIN
                </label>
                <div className="field">
                  <Lock className="input-icon text-[#00f0ff]" />
                  <input
                    type="password"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Enter private key or password"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full button2 flex items-center justify-center space-x-2 bg-[#00f0ff] hover:bg-[#00d0e0]"
              >
                <Lock className="w-4 h-4" />
                <span>Sign In & Continue</span>
              </button>
            </form>
          )}

          <p className="text-[11px] text-zinc-500 text-center mt-4">
            No emails or phone numbers needed. Chat instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
