import React from 'react';
import { 
  Users, 
  Smartphone, 
  Monitor, 
  Video, 
  Phone, 
  Wifi, 
  X, 
  Copy, 
  Check,
  Crown,
  LogOut
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';
import { getAvatarSvg } from '../utils/avatar';

export default function Sidebar({ isOpen, onClose, onOpenShareModal }) {
  const { currentRoom, roomUsers, user, ipInfo, leaveRoom } = useSocket();
  const { startCall } = useWebRTC();
  const [copied, setCopied] = React.useState(false);

  const handleCopyRoomId = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside className={`
        fixed md:static top-0 right-0 bottom-0 z-50 md:z-20
        w-72 bg-[#05080f] border-l border-[#161f30] flex flex-col font-mono select-none
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="h-14 px-4 border-b border-[#161f30] flex items-center justify-between shrink-0 bg-[#070b14]">
          <div className="flex items-center space-x-2 text-zinc-200">
            <Users className="w-4 h-4 text-[#00ff88]" />
            <span className="font-bold text-xs tracking-wide">Members</span>
            <span className="text-xs bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 px-2 py-0.5 rounded-full font-bold">
              {roomUsers.length}
            </span>
          </div>

          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded md:hidden transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Room Box */}
        <div className="p-3 border-b border-[#161f30] bg-[#080d17]">
          <div className="bg-[#05080f] rounded-lg p-3 border border-[#161f30]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Current Room
              </span>
              <button 
                onClick={handleCopyRoomId}
                className="text-xs text-[#00ff88] hover:underline flex items-center space-x-1 font-semibold"
                title="Copy Room ID"
              >
                {copied ? <Check className="w-3 h-3 text-[#00ff88]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy ID'}</span>
              </button>
            </div>

            <p className="text-xs font-bold text-zinc-100 truncate">
              {currentRoom?.name || 'Local Network'}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5 truncate font-mono">
              ID: <span className="text-[#00f0ff]">{currentRoom?.id}</span>
            </p>
          </div>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {roomUsers.map((member) => {
            const isMe = member.id === user.id || member.socketId === user.socketId;
            return (
              <div
                key={member.socketId || member.id}
                className={`flex items-center justify-between p-2 rounded-lg border transition ${
                  isMe 
                    ? 'bg-[#0b1424] border-[#1d3557]' 
                    : 'bg-[#080c14] hover:bg-[#0d1422] border-[#141d2e]'
                }`}
              >
                {/* User Info */}
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#1c2638]">
                      <img
                        src={getAvatarSvg(member.avatar || member.name)}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <p className="text-xs font-bold text-zinc-100 truncate">
                        {member.name}
                      </p>
                      {member.isHost && (
                        <Crown className="w-3 h-3 text-amber-400 shrink-0" title="Host" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 block">
                      {isMe ? 'You' : 'Online'}
                    </span>
                  </div>
                </div>

                {/* Direct Call Actions */}
                {!isMe && (
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => startCall(member.socketId, member, false)}
                      className="p-1.5 text-zinc-400 hover:text-[#00ff88] hover:bg-[#00ff88]/10 rounded-lg transition"
                      title="Audio Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => startCall(member.socketId, member, true)}
                      className="p-1.5 text-zinc-400 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 rounded-lg transition"
                      title="Video Call"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#161f30] bg-[#04060a] shrink-0 text-xs space-y-2">
          {currentRoom?.isCustom && (
            <button
              onClick={() => {
                leaveRoom();
                if (onClose) onClose();
              }}
              className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 active:scale-[0.98] border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 min-h-[40px]"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Room</span>
            </button>
          )}

          <div className="flex items-center justify-between text-zinc-400">
            <span>Network Status</span>
            <span className="text-[#00ff88] flex items-center space-x-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
              <span>Connected</span>
            </span>
          </div>
          <p className="text-zinc-300 truncate font-semibold">
            {ipInfo?.autoRoom?.roomName || 'Local Wi-Fi Network'}
          </p>
          <p className="text-zinc-500 truncate text-[11px] mt-0.5">
            IP: {ipInfo?.ip || '127.0.0.1'}
          </p>
        </div>
      </aside>
    </>
  );
}
