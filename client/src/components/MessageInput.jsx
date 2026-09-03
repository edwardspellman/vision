import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  Loader2, 
  X
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import VoiceRecorder from './VoiceRecorder';

const EMOJI_LIST = [
  '😀', '😂', '😍', '🔥', '👍', '🎉', '🚀', '❤️', '👀', '💯',
  '😎', '🥳', '🤔', '🙌', '✨', '⚡', '💀', '🛡️', '🎯', '✅'
];

export default function MessageInput() {
  const { sendMessage, setTyping, currentRoom } = useSocket();
  const [text, setText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const mediaAllowed = currentRoom?.allowMediaUploads !== false;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    setTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 1500);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();

    if (selectedFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.success) {
          sendMessage({
            text: text.trim(),
            type: data.type,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileSize: data.fileSize
          });
          clearFileSelection();
          setText('');
        }
      } catch (err) {
        console.error('File upload error:', err);
        alert('File upload failed.');
      } finally {
        setIsUploading(false);
      }
      return;
    }

    if (!text.trim()) return;

    sendMessage({ text: text.trim(), type: 'text' });
    setText('');
    setTyping(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  if (isRecordingVoice) {
    return (
      <div className="p-2.5 sm:p-3 bg-[#05080f] border-t border-[#161f30] shrink-0 font-mono pb-safe">
        <VoiceRecorder
          onSendAudio={(audioData) => {
            sendMessage({
              ...audioData,
              text: '',
              type: 'audio'
            });
            setIsRecordingVoice(false);
          }}
          onCancel={() => setIsRecordingVoice(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 md:p-4 bg-[#05080f] border-t border-[#161f30] shrink-0 relative font-mono pb-safe">
      {/* File Attachment Preview */}
      {selectedFile && (
        <div className="mb-2 p-2 bg-[#080d17] border border-[#1a263d] rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2.5 min-w-0">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-9 h-9 object-cover rounded-lg border border-[#161f30]" />
            ) : (
              <div className="p-2 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
                <Paperclip className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0 text-xs">
              <p className="font-semibold text-zinc-200 truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-zinc-500 font-mono">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={clearFileSelection}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Popover (Responsive Mobile Bounds) */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full left-2 sm:left-4 mb-2 p-2.5 bg-[#080d17] border border-[#1a263d] rounded-xl w-[calc(100vw-1rem)] sm:w-64 max-w-xs max-h-56 overflow-y-auto grid grid-cols-5 gap-1.5 z-40 shadow-2xl animate-fade-in scroll-touch"
        >
          {EMOJI_LIST.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => handleAddEmoji(emoji)}
              className="p-2 hover:bg-[#111827] rounded-lg text-lg flex items-center justify-center hover:scale-125 transition active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Row */}
      <form onSubmit={handleSend} className="flex items-end space-x-1.5 sm:space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.txt,.json,.js,.py,.rs"
        />

        {/* Action Controls (Left) */}
        <div className="flex items-center space-x-1 pb-0.5">
          <button
            type="button"
            onClick={() => mediaAllowed && fileInputRef.current?.click()}
            disabled={!mediaAllowed}
            className={`p-2 sm:p-2.5 rounded-xl border transition ${
              mediaAllowed
                ? 'text-zinc-400 hover:text-[#00f0ff] bg-[#080d17] border-[#161f30] hover:border-[#00f0ff]/40 active:scale-95'
                : 'text-zinc-600 bg-[#080d17]/50 border-[#161f30]/50 opacity-40 cursor-not-allowed'
            }`}
            title={mediaAllowed ? 'Attach file or image' : 'File sharing disabled by room host'}
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 sm:p-2.5 text-zinc-400 hover:text-[#ffb700] rounded-xl bg-[#080d17] border border-[#161f30] hover:border-[#ffb700]/40 transition active:scale-95"
            title="Add emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>

        {/* Text Input Box */}
        <div className="flex-1 bg-[#080d17] border border-[#1a263d] focus-within:border-[#00ff88] rounded-xl px-3 py-2 transition min-w-0">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message or paste a code snippet..."
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-sm sm:text-xs focus:outline-none resize-none max-h-24 overflow-y-auto font-mono scroll-touch"
          />
        </div>

        {/* Action Controls (Right) */}
        <div className="flex items-center space-x-1 pb-0.5">
          {!text.trim() && !selectedFile ? (
            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              className="p-2 sm:p-2.5 text-zinc-400 hover:text-[#ff3366] rounded-xl bg-[#080d17] border border-[#161f30] hover:border-[#ff3366]/40 transition active:scale-95"
              title="Record voice note"
            >
              <Mic className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isUploading}
              className="p-2 sm:p-2.5 bg-[#00ff88] hover:bg-[#00e67a] text-black font-bold rounded-xl transition shadow-md flex items-center justify-center disabled:opacity-50 active:scale-95"
              title="Send"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
