import React from 'react';
import { Sparkles, X, Radio, Check, Shield } from 'lucide-react';

export default function BetaNoticeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono select-none">
      <div className="w-full max-w-sm uiverse-modal relative p-6 sm:p-7 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-[#222222] hover:bg-black transition active:scale-95"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] flex items-center justify-center mx-auto mb-3.5 shadow-lg animate-pulse">
          <Radio className="w-7 h-7 text-[#00f0ff]" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-full text-[10px] font-bold text-[#00f0ff] uppercase tracking-wider mb-2">
          <Sparkles className="w-3 h-3" />
          <span>Feature In Beta Phase</span>
        </div>

        {/* Heading */}
        <h3 className="text-base sm:text-lg font-bold text-white mb-2 tracking-wide">
          Calling Feature Notice
        </h3>

        {/* Description */}
        <p className="text-xs text-zinc-400 leading-relaxed mb-6 px-1">
          Voice & Video Calling is currently in active <span className="text-[#00f0ff] font-semibold">Beta Phase</span>. High-speed encrypted calling is being optimized and will be fully enabled in the next update.
        </p>

        {/* Got It Button */}
        <button
          onClick={onClose}
          className="button-submit w-full"
        >
          <Check className="w-4 h-4 text-black" />
          <span>Got It</span>
        </button>
      </div>
    </div>
  );
}
