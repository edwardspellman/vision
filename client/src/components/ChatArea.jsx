import React, { useEffect, useRef, useState } from 'react';
import { 
  Wifi, 
  Lock, 
  Share2, 
  ChevronDown, 
  Upload, 
  MessageSquare,
  LogOut,
  LogIn,
  Phone,
  Video,
  Radio,
  Settings,
  Crown
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';
import MessageItem from './MessageItem';

export default function ChatArea({ 
  onOpenShareModal, 
  onOpenRoomModal, 
  onOpenRoomSettingsModal, 
  onOpenBetaModal,
  onImageClick 
}) {
  const { currentRoom, messages, typingUsers, user, sendMessage, leaveRoom, ipInfo } = useSocket();
  const { roomCallState, isJoinedRoomCall, startOrJoinRoomCall, setIsRoomCallModalOpen } = useWebRTC();
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
        {/* Welcome Room Banner */}
        <div className="max-w-md mx-auto my-3 sm:my-5 p-4 sm:p-5 rounded-2xl bg-[#080d17] border border-[#161f30] text-center shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] mx-auto flex items-center justify-center mb-2.5">
            {currentRoom?.hasPassword ? (
              <Lock className="w-5 h-5 text-[#00f0ff]" />
            ) : (
              <Wifi className="w-5 h-5 text-[#00ff88]" />
            )}
          </div>

          <h2 className="text-sm font-bold text-white mb-1">
            Welcome to {currentRoom?.name || 'Local Wi-Fi Network'}
          </h2>
          
          <p className="text-xs text-zinc-400 mb-3.5 max-w-sm mx-auto">
            {isCustomRoom 
              ? 'This is a private room. Share the Room ID or QR code to let friends join.'
              : 'You are connected to this local Wi-Fi network. Anyone on the same network joins automatically.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Host Controls Quick Edit Button */}
            {isCustomRoom && isHost && (
              <button
                onClick={onOpenRoomSettingsModal}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#00ff88]/10 hover:bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30 text-xs font-bold transition active:scale-95"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Host Settings</span>
              </button>
            )}

            {/* Room Group Call Button (Beta Modal) */}
            <button
              onClick={onOpenBetaModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 text-xs font-bold transition active:scale-95"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Room Call</span>
              <span className="px-1 py-0.2 bg-[#00f0ff]/20 text-[#00f0ff] text-[8px] font-bold rounded">BETA</span>
            </button>

            {isCustomRoom ? (
              <>
                <button
                  onClick={onOpenShareModal}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#00ff88] hover:bg-[#00e67a] text-black text-xs font-bold transition shadow-md active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Room</span>
                </button>

                <button
                  onClick={handleLeave}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#1a0c14] hover:bg-[#2b101e] text-rose-400 border border-rose-500/30 text-xs font-bold transition active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Leave Room</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onOpenRoomModal}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#00ff88] hover:bg-[#00e67a] text-black text-xs font-bold transition shadow-md active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Join or Create Room</span>
                </button>

                <button
                  onClick={onOpenShareModal}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#0b101c] hover:bg-[#111827] text-zinc-200 hover:text-[#00f0ff] border border-[#1a263d] text-xs font-bold transition active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#00f0ff]" />
                  <span>Share Network</span>
                </button>
              </>
            )}
          </div>
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
