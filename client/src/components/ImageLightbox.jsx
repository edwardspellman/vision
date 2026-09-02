import React from 'react';
import { X, Download, Terminal } from 'lucide-react';

export default function ImageLightbox({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in font-mono"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
      >
        <div className="absolute top-2 right-2 flex items-center space-x-1.5 z-10">
          <a
            href={imageUrl}
            download="payload-image"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded bg-[#080d17] hover:bg-[#111827] text-zinc-300 hover:text-[#00ff88] border border-[#1a263d] transition"
            title="Download Raw Payload"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={onClose}
            className="p-1.5 rounded bg-[#080d17] hover:bg-[#111827] text-zinc-300 hover:text-[#ff3366] border border-[#1a263d] transition"
            title="Close Viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded border border-[#1a263d] overflow-hidden max-h-[85vh] shadow-2xl bg-[#04060a]">
          <img
            src={imageUrl}
            alt="Expanded payload"
            className="w-full h-full object-contain max-h-[85vh]"
          />
        </div>
      </div>
    </div>
  );
}
