import React from 'react';
import { 
  MessageSquare, 
  Users, 
  Video, 
  LogIn, 
  Settings,
  Radio
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';

export default function MobileNavBar({ 
  onToggleSidebar, 
  onOpenRoomModal, 
  onOpenSettingsModal 
}) {
  const { roomUsers, currentRoom } = useSocket();
  const { 
    roomCallState, 
    isJoinedRoomCall, 
    startOrJoinRoomCall, 
    setIsRoomCallModalOpen 
  } = useWebRTC();

  const callsAllowed = currentRoom?.allowAudioCalls !== false || currentRoom?.allowVideoCalls !== false;
  const isCallLive = roomCallState?.isLive || roomCallState?.participantCount > 0;

  const handleRoomCallClick = () => {
    if (isJoinedRoomCall) {
      setIsRoomCallModalOpen(true);
    } else {
      startOrJoinRoomCall(true);
    }
  };

  return (
    <nav 
      className="md:hidden bg-[#05080f]/95 backdrop-blur-lg border-t border-[#161f30] px-2 py-1.5 flex items-center justify-around z-30 shrink-0 select-none pb-safe"
      aria-label="Mobile Navigation"
    >
      {/* 1. Chat Tab */}
      <button
        onClick={() => {
          // Scroll chat to bottom
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="flex flex-col items-center justify-center p-1.5 text-[#00ff88] transition active:scale-90 flex-1"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-0.5">Chat</span>
      </button>

      {/* 2. Members & Calling Sidebar Drawer */}
      <button
        onClick={onToggleSidebar}
        className="relative flex flex-col items-center justify-center p-1.5 text-zinc-400 hover:text-white transition active:scale-90 flex-1"
      >
        <div className="relative">
          <Users className="w-5 h-5" />
          {roomUsers.length > 0 && (
            <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 min-w-[16px] h-4 bg-[#00ff88] text-black font-black text-[9px] rounded-full flex items-center justify-center shadow">
              {roomUsers.length}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold mt-0.5">Members</span>
      </button>

      {/* 3. Live Room Call Action */}
      {callsAllowed && (
        <button
          onClick={handleRoomCallClick}
          className={`relative flex flex-col items-center justify-center p-1.5 transition active:scale-90 flex-1 ${
            isJoinedRoomCall
              ? 'text-[#00ff88]'
              : isCallLive
              ? 'text-[#00f0ff] animate-pulse'
              : 'text-zinc-400 hover:text-[#00f0ff]'
          }`}
        >
          <div className="relative">
            <Video className="w-5 h-5" />
            {isCallLive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00ff88] rounded-full animate-ping" />
            )}
          </div>
          <span className="text-[10px] font-bold mt-0.5">
            {isJoinedRoomCall ? 'In Call' : isCallLive ? 'Join Call' : 'Call'}
          </span>
        </button>
      )}

      {/* 4. Rooms Switcher */}
      <button
        onClick={onOpenRoomModal}
        className="flex flex-col items-center justify-center p-1.5 text-zinc-400 hover:text-white transition active:scale-90 flex-1"
      >
        <LogIn className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-0.5">Rooms</span>
      </button>

      {/* 5. Settings */}
      <button
        onClick={onOpenSettingsModal}
        className="flex flex-col items-center justify-center p-1.5 text-zinc-400 hover:text-white transition active:scale-90 flex-1"
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-0.5">Settings</span>
      </button>
    </nav>
  );
}
