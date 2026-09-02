import React, { useEffect, useRef, useState } from 'react';
import { 
  Wifi, 
  Lock, 
  Share2, 
  ChevronDown, 
  Upload, 
  MessageSquare
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import MessageItem from './MessageItem';

export default function ChatArea({ onOpenShareModal, onImageClick }) {
  const { currentRoom, messages, typingUsers, user, sendMessage } = useSocket();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

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
        className="flex-1 overflow-y-auto px-4 md:px-8 py-5 space-y-1"
      >
        {/* Welcome Room Banner */}
        <div className="max-w-md mx-auto my-5 p-5 rounded-2xl bg-[#080d17] border border-[#161f30] text-center shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] mx-auto flex items-center justify-center mb-2.5">
            {currentRoom?.hasPassword ? (
              <Lock className="w-5 h-5 text-[#ffb700]" />
            ) : (
              <Wifi className="w-5 h-5 text-[#00ff88]" />
            )}
          </div>

          <h2 className="text-sm font-bold text-white mb-1">
            Welcome to {currentRoom?.name || 'Vision Room'}
          </h2>
          
          <p className="text-xs text-zinc-400 mb-4 max-w-sm mx-auto">
            {currentRoom?.isCustom 
              ? 'This is a private room. Share the Room ID or QR code to let friends join.'
              : 'You are connected to this local Wi-Fi room. Anyone on the same network joins automatically.'}
          </p>

          <button
            onClick={onOpenShareModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#00ff88] hover:bg-[#00e67a] text-black text-xs font-bold transition shadow-md"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Room / QR Code</span>
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
