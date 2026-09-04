import React from 'react';
import { ShieldAlert, Check, X, Clock, UserCheck } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { getAvatarSvg } from '../utils/avatar';

export default function ApprovalModal() {
  const { 
    isWaitingForApproval, 
    approvalRoomName, 
    hostApprovalRequests, 
    respondToApproval 
  } = useSocket();

  // If candidate is waiting for host approval
  if (isWaitingForApproval) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in font-mono select-none">
        <div className="form w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center justify-center mx-auto mt-2 mb-2 animate-pulse">
            <Clock className="w-8 h-8 text-[#00ff88]" />
          </div>

          <p id="heading" className="!m-0 !mb-1">
            Waiting for Host Approval
          </p>
          <p className="text-xs text-zinc-400 mb-2">
            Room <span className="text-[#00ff88] font-bold">{approvalRoomName}</span> requires host approval before entering.
          </p>

          <div className="p-3 bg-[#05080f] rounded-2xl border border-[#161f30] text-xs text-zinc-400 flex items-center justify-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
            <span>Knocking... Please wait.</span>
          </div>
        </div>
      </div>
    );
  }

  // If Host has pending candidate approval requests
  if (hostApprovalRequests && hostApprovalRequests.length > 0) {
    const currentReq = hostApprovalRequests[0];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono select-none">
        <div className="form w-full max-w-md">
          {/* Header */}
          <div className="flex items-center space-x-2.5 pt-2 pb-2 border-b border-[#161f30]">
            <UserCheck className="w-5 h-5 text-[#00f0ff]" />
            <div>
              <p id="heading" className="!m-0 text-left text-sm">
                Join Request (Knock)
              </p>
              <p className="text-[11px] text-zinc-400">
                Host Approval Required for Room: <span className="text-[#00f0ff] font-bold">{currentReq.roomName}</span>
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="py-2 space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-[#05080f] rounded-2xl border border-[#1a263d]">
              <div className="w-12 h-12 rounded-xl border border-[#00f0ff]/50 overflow-hidden flex-shrink-0">
                <img
                  src={getAvatarSvg(currentReq.candidateUser?.avatar || currentReq.candidateUser?.name)}
                  alt="Candidate Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">
                  {currentReq.candidateUser?.name || 'Operative Candidate'}
                </h4>
                <p className="text-xs text-zinc-400">
                  Role: <span className="text-[#00f0ff]">{currentReq.candidateUser?.role || 'Operative'}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons: Approve vs Disapprove */}
            <div className="btn justify-stretch grid grid-cols-2 gap-3 !mt-2">
              <button
                type="button"
                onClick={() => respondToApproval(currentReq.candidateSocketId, false)}
                className="button3 flex items-center justify-center space-x-1.5"
              >
                <X className="w-4 h-4" />
                <span>Disapprove (Deny)</span>
              </button>

              <button
                type="button"
                onClick={() => respondToApproval(currentReq.candidateSocketId, true)}
                className="button2 flex items-center justify-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Approve (Allow)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
