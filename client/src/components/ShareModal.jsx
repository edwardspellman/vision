import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Copy, 
  Check, 
  Lock, 
  QrCode, 
  Share2, 
  ExternalLink,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Phone,
  Video
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';

export default function ShareModal({ isOpen, onClose }) {
  const { currentRoom, roomUsers, user } = useSocket();
  const { startCall } = useWebRTC();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const canvasRef = useRef(null);

  const roomUrl = `${window.location.origin}/#room=${encodeURIComponent(currentRoom?.id || '')}`;

  useEffect(() => {
    if (isOpen && currentRoom && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        roomUrl,
        {
          width: 165,
          margin: 1.5,
          color: {
            dark: '#ffffff',
            light: '#05080f'
          }
        },
        (error) => {
          if (error) console.error('QR code generation error:', error);
        }
      );
    }
  }, [isOpen, currentRoom, roomUrl]);

  if (!isOpen || !currentRoom) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(currentRoom.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyAll = () => {
    let textToCopy = `⚡ Join my Vision Room!\nRoom ID: ${currentRoom.id}`;
    if (currentRoom.hasPassword) {
      textToCopy += `\nPassword: (Shared privately)`;
    }
    textToCopy += `\nDirect Link: ${roomUrl}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const peerMembers = roomUsers.filter((m) => m.id !== user.id && m.socketId !== user.socketId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-fade-in font-mono select-none">
      <div className="form w-full max-w-sm relative !gap-3 !border-[#1a263d] shadow-2xl !p-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#161f30]">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff]">
              <Share2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <p id="heading" className="!m-0 text-left text-sm font-bold flex items-center space-x-1.5">
                <span>Share Room</span>
                <span className="px-1.5 py-0.5 text-[9px] bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] rounded-md font-mono font-semibold">
                  LIVE QR
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition min-h-[34px] min-w-[34px] flex items-center justify-center bg-[#05080f] border border-[#161f30]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cyber Live QR Canvas Container */}
        <div className="flex flex-col items-center justify-center p-3 bg-[#05080f] rounded-xl border border-[#1a263d] relative">
          {/* Corner Cyber Accents */}
          <div className="absolute top-1.5 left-2 text-[9px] text-zinc-600 font-mono">+</div>
          <div className="absolute top-1.5 right-2 text-[9px] text-zinc-600 font-mono">+</div>
          <div className="absolute bottom-1.5 left-2 text-[9px] text-zinc-600 font-mono">+</div>
          <div className="absolute bottom-1.5 right-2 text-[9px] text-zinc-600 font-mono">+</div>

          <div className="p-2 bg-[#05080f] rounded-xl border border-[#1a263d] shadow-md mb-2">
            <canvas ref={canvasRef} className="rounded-lg block" />
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] text-zinc-300 bg-[#080d17] px-2.5 py-0.5 rounded-full border border-[#1a263d]">
            <Smartphone className="w-3 h-3 text-[#00f0ff] animate-pulse" />
            <span>Scan with mobile camera</span>
          </div>
        </div>

        {/* Live P2P Calling Action Bar */}
        <div className="p-2.5 bg-[#05080f] rounded-xl border border-[#1a263d] flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Video className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="text-[11px] font-bold text-zinc-200">Direct P2P Call</span>
          </div>

          {peerMembers.length > 0 ? (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => {
                  startCall(peerMembers[0].socketId, peerMembers[0], false);
                  onClose();
                }}
                className="px-2 py-1 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 rounded-lg text-[11px] font-bold transition flex items-center space-x-1"
                title={`Call ${peerMembers[0].name}`}
              >
                <Phone className="w-3 h-3" />
                <span>Call</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  startCall(peerMembers[0].socketId, peerMembers[0], true);
                  onClose();
                }}
                className="px-2 py-1 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 rounded-lg text-[11px] font-bold transition flex items-center space-x-1"
                title={`Video Call ${peerMembers[0].name}`}
              >
                <Video className="w-3 h-3" />
                <span>Video</span>
              </button>
            </div>
          ) : (
            <span className="text-[10px] text-zinc-500 font-mono italic">Waiting for peers...</span>
          )}
        </div>

        {/* Room Metadata Details */}
        <div className="bg-[#05080f] rounded-xl p-3 border border-[#1a263d] space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                Active Room Name
              </span>
              <p className="text-xs font-bold text-white truncate max-w-[150px]">
                {currentRoom.name}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                Room ID
              </span>
              <p className="text-xs font-extrabold text-[#00f0ff] tracking-wider">
                {currentRoom.id}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#141d2e] flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Direct ID Copy:</span>
            <button
              type="button"
              onClick={handleCopyId}
              className="px-2.5 py-1 rounded-lg bg-[#0a1120] hover:bg-[#0f192e] text-[#00f0ff] border border-[#00f0ff]/30 text-[11px] font-bold transition flex items-center space-x-1 min-h-[32px]"
            >
              {copiedId ? <Check className="w-3 h-3 text-[#00f0ff]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedId ? 'ID Copied!' : 'Copy ID'}</span>
            </button>
          </div>
        </div>

        {/* Password Protection Badge */}
        {currentRoom.hasPassword && (
          <div className="p-2.5 bg-[#ffb700]/10 border border-[#ffb700]/30 rounded-xl text-[11px] text-[#ffb700] flex items-start space-x-2">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Password Active</span>
              <span className="text-[10px] text-zinc-400">Share your private room PIN with invitees.</span>
            </div>
          </div>
        )}

        {/* Touch-Optimized Action Buttons */}
        <div className="btn justify-stretch grid grid-cols-2 gap-2 !mt-1">
          <button
            onClick={handleCopyLink}
            className="button1 flex items-center justify-center space-x-1 text-xs py-2"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#00f0ff]" /> : <ExternalLink className="w-3.5 h-3.5 text-[#00f0ff]" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handleCopyAll}
            className="button2 flex items-center justify-center space-x-1 text-xs py-2"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-black" /> : <Sparkles className="w-3.5 h-3.5 text-black" />}
            <span>{copiedAll ? 'Invite Copied!' : 'Copy Invite'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
