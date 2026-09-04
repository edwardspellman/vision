import React, { useState } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { WebRTCProvider } from './context/WebRTCContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import MessageInput from './components/MessageInput';
import RoomModal from './components/RoomModal';
import ShareModal from './components/ShareModal';
import PasswordModal from './components/PasswordModal';
import SettingsModal from './components/SettingsModal';
import VideoCallModal from './components/VideoCallModal';
import ImageLightbox from './components/ImageLightbox';
import InitialLoader from './components/InitialLoader';
import AuthModal from './components/AuthModal';
import ProfileSetupModal from './components/ProfileSetupModal';
import ApprovalModal from './components/ApprovalModal';

function MainApp() {
  const { connected, currentRoom, isAuthenticated, showProfileSetup } = useSocket();
  const [showSplash, setShowSplash] = useState(true);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [soundMuted, setSoundMuted] = useState(() => {
    return localStorage.getItem('vision_sound_muted') === 'true';
  });

  return (
    <div className="flex flex-col h-dvh w-dvh bg-[#04060a] text-zinc-300 overflow-hidden font-mono antialiased">
      {/* 1. Initial Wormhole Splash Screen */}
      {showSplash && (
        <InitialLoader
          isReady={connected && Boolean(currentRoom)}
          onFinish={() => setShowSplash(false)}
        />
      )}

      {/* 2. Authentication Gateway (Shows after splash if not authenticated) */}
      {!showSplash && !isAuthenticated && (
        <AuthModal />
      )}

      {/* 3. Post-Login Profile Setup Pop-up */}
      {!showSplash && isAuthenticated && showProfileSetup && (
        <ProfileSetupModal />
      )}

      {/* Host Approval Waiting & Notification Modals */}
      <ApprovalModal />

      {/* Top Header Navigation */}
      <Header
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        soundMuted={soundMuted}
        setSoundMuted={setSoundMuted}
      />

      {/* Main Terminal Chat & Peer Grid */}
      <div className="flex-1 flex min-h-0 relative">
        <main className="flex-1 flex flex-col min-w-0 h-full relative">
          <ChatArea
            onOpenRoomModal={() => setIsRoomModalOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
            onImageClick={(url) => setPreviewImage(url)}
          />
          <MessageInput />
        </main>

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
        />
      </div>

      {/* Security Modals & Telemetry Windows */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      <PasswordModal />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        soundMuted={soundMuted}
        setSoundMuted={setSoundMuted}
      />

      <VideoCallModal />

      <ImageLightbox
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <WebRTCProvider>
        <MainApp />
      </WebRTCProvider>
    </SocketProvider>
  );
}
