import React, { useState } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { WebRTCProvider } from './context/WebRTCContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import MessageInput from './components/MessageInput';
import MobileNavBar from './components/MobileNavBar';
import RoomModal from './components/RoomModal';
import ShareModal from './components/ShareModal';
import PasswordModal from './components/PasswordModal';
import SettingsModal from './components/SettingsModal';
import RoomSettingsModal from './components/RoomSettingsModal';
import RoomCallModal from './components/RoomCallModal';
import VideoCallModal from './components/VideoCallModal';
import ImageLightbox from './components/ImageLightbox';
import InitialLoader from './components/InitialLoader';
import AuthModal from './components/AuthModal';
import ProfileSetupModal from './components/ProfileSetupModal';

function MainApp() {
  const { connected, currentRoom, isAuthenticated, showProfileSetup } = useSocket();
  const [showSplash, setShowSplash] = useState(true);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isRoomSettingsModalOpen, setIsRoomSettingsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [soundMuted, setSoundMuted] = useState(() => {
    return localStorage.getItem('vision_sound_muted') === 'true';
  });

  return (
    <div className="flex flex-col h-screen h-[100dvh] w-screen bg-[#04060a] text-zinc-300 overflow-hidden font-mono antialiased select-none">
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

      {/* Top Header Navigation */}
      <Header
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
        onOpenRoomSettingsModal={() => setIsRoomSettingsModalOpen(true)}
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
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenRoomModal={() => setIsRoomModalOpen(true)}
            onOpenRoomSettingsModal={() => setIsRoomSettingsModalOpen(true)}
            onImageClick={(url) => setPreviewImage(url)}
          />
          <MessageInput />
        </main>

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenRoomModal={() => setIsRoomModalOpen(true)}
          onOpenRoomSettingsModal={() => setIsRoomSettingsModalOpen(true)}
        />
      </div>

      {/* Mobile Bottom Navigation Bar (iOS / Android) */}
      <MobileNavBar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Security Modals & Telemetry Windows */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
      />

      <RoomSettingsModal
        isOpen={isRoomSettingsModalOpen}
        onClose={() => setIsRoomSettingsModalOpen(false)}
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

      <RoomCallModal />

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
