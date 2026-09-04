import React, { useEffect, useRef, useState } from 'react';
import { 
  Wifi, 
  Lock, 
  Share2, 
  ChevronDown, 
  Upload, 
  MessageSquare,
  PlusCircle,
  LogIn,
  PhoneCall,
  Video,
  ShieldCheck,
  User
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';
import { getAvatarSvg } from '../utils/avatar';
import MessageItem from './MessageItem';

export default function ChatArea({ onOpenRoomModal, onOpenShareModal, onOpenSettingsModal, onImageClick }) {
  const { currentRoom, messages, typingUsers, user, sendMessage } = useSocket();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const isCustomRoom = Boolean(
    currentRoom?.isCustom || 
    (currentRoom && ipInfo?.autoRoom?.roomId && currentRoom.id !== ipInfo.autoRoom.roomId)
  );

  const isHost = Boolean(
    currentRoom?.hostId && (currentRoom.hostId === user.id || currentRoom.hostId === user.name)
  );

  const callsAllowed = currentRoom?.allowAudioCalls !== false || currentRoom?.allowVideoCalls !== false;

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, typingUsers]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isUp);
  };

  const handleLeave = () => {
    if (window.confirm('Are you sure you want to leave this room?')) {
      leaveRoom();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.success) {
          sendMessage({
            text: '',
            type: data.type,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileSize: data.fileSize
          });
        }
      } catch (err) {
        console.error('File drop error:', err);
      }
    }
  };

  return (
    <div
      className="flex-1 flex flex-col min-w-0 bg-[#030508] relative overflow-hidden font-mono"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Active Live Room Call Banner */}
      {roomCallState.isLive && (
        <div className="bg-[#0e0717] border-b border-[#a855f7]/30 px-3.5 py-2 flex items-center justify-between text-xs text-zinc-200 z-20 animate-fade-in shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-bold text-white flex items-center space-x-1.5">
              <span>Live Room Call</span>
              <span className="px-1.5 py-0.2 bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/40 rounded-full text-[9px]">
                {roomCallState.participantCount} in call
              </span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {!isJoinedRoomCall ? (
              <button
                onClick={() => startOrJoinRoomCall(true)}
                className="px-3 py-1 bg-[#00ff88] hover:bg-[#00e67a] text-black font-bold rounded-lg text-xs flex items-center space-x-1.5 transition active:scale-95 shadow"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Join Call</span>
              </button>
            ) : (
              <button
                onClick={() => setIsRoomCallModalOpen(true)}
                className="px-3 py-1 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 transition active:scale-95 shadow"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Open Call View</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* File Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-30 bg-black/90 border-2 border-dashed border-[#00ff88] m-4 rounded-2xl flex flex-col items-center justify-center text-center p-6 pointer-events-none animate-fade-in">
          <Upload className="w-12 h-12 text-[#00ff88] mb-2 animate-bounce" />
          <h3 className="text-sm font-bold text-[#00ff88]">Drop files to share</h3>
          <p className="text-xs text-zinc-400 mt-1">Images, audio notes, and documents will be shared instantly</p>
        </div>
      )}

      {/* Messages Feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2.5 sm:px-4 md:px-8 py-4 space-y-1 scroll-touch"
      >
        {/* Compact & Clean Welcome Room Banner */}
        <div className="max-w-md mx-auto my-3 p-4 rounded-2xl bg-[#080d17]/90 border border-[#00ff88]/30 shadow-lg text-center font-mono relative overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] mx-auto flex items-center justify-center mb-2">
            {currentRoom?.hasPassword ? (
              <Lock className="w-4 h-4 text-[#ffb700]" />
            ) : (
              <Wifi className="w-4 h-4 text-[#00ff88]" />
            )}
          </div>

          <h2 className="text-sm font-bold text-white mb-0.5 tracking-wide">
            Welcome to <span className="text-[#00ff88]">{currentRoom?.name || 'Local Wi-Fi Network'}</span>
          </h2>
          
          <p className="text-[11px] text-zinc-400 mb-3 max-w-xs mx-auto">
            {currentRoom?.isCustom 
              ? 'Private room. Share ID or QR code to let teammates join.'
              : 'Devices on the same Wi-Fi or LAN join automatically.'}
          </p>

          {/* Sleek Compact Action Buttons Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {/* Create or Join Room (Combined 1 Section) */}
            <button
              onClick={onOpenRoomModal}
              className="py-2 px-2 bg-[#05080f] hover:bg-[#0c1424] active:scale-[0.98] border border-[#00ff88]/40 hover:border-[#00ff88] text-[#00ff88] rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 min-h-[40px]"
              title="Create new room or enter room ID to join"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Rooms</span>
            </button>

            {/* P2P Calls */}
            <button
              onClick={onOpenShareModal}
              className="py-2 px-2 bg-[#05080f] hover:bg-[#0c1424] active:scale-[0.98] border border-[#00f0ff]/40 hover:border-[#00f0ff] text-[#00f0ff] rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 min-h-[40px]"
              title="Start P2P Audio or Video Calls"
            >
              <Video className="w-3.5 h-3.5 shrink-0" />
              <span>Calls</span>
            </button>

            {/* Profile & Settings Section */}
            <button
              onClick={onOpenSettingsModal}
              className="py-2 px-2 bg-[#05080f] hover:bg-[#0c1424] active:scale-[0.98] border border-[#ffb700]/40 hover:border-[#ffb700] text-[#ffb700] rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 min-h-[40px]"
              title="Profile Settings & Avatar Customization"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>Profile</span>
            </button>
          </div>

          {/* Compact Share Action */}
          <button
            onClick={onOpenShareModal}
            className="w-full py-2 rounded-xl bg-[#00ff88] hover:bg-[#00e67a] active:scale-[0.98] text-black text-xs font-bold transition shadow-md flex items-center justify-center space-x-1.5 min-h-[36px]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Room & Live QR</span>
          </button>
        </div>

        {/* Message Stream */}
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} onImageClick={onImageClick} />
        ))}

        {/* Live Typing */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 py-1.5 text-xs text-[#00ff88] animate-pulse">
            <div className="flex space-x-1">
              <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll-to-Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-4 right-6 p-2.5 bg-[#0a0e17] hover:bg-[#121826] text-[#00ff88] border border-[#1c283f] rounded-full shadow-xl transition z-20"
          title="Jump to latest messages"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
