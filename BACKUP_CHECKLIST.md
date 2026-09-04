# 🛡️ Vision / UChat — Backup Data & Code Recovery Checklist

> **Snapshot Date**: 2026-09-05  
> **Git Repository Status**: `Clean`  
> **Git Commit Hash**: `f245ec34981b2c385f016951bd5b8fb2e824bb7b`  
> **Branch**: `main`  

---

## 📌 1. Git Recovery & Instant Rollback Commands

If any files are modified, broken, or accidentally deleted, use these commands to instantly restore the codebase to a clean state.

> [!TIP]
> Run these commands from the root project folder: `c:\Users\a\OneDrive\Documents\Vision`

| Emergency Scenario | Recovery Command | Description |
| :--- | :--- | :--- |
| **Restore a specific file** | `cmd.exe /c "git checkout HEAD -- <path-to-file>"` | Discards all local edits to a single file and restores it. |
| **Discard ALL uncommitted changes** | `cmd.exe /c "git reset --hard HEAD"` | Reverts every modified file back to the clean git snapshot. |
| **Clean untracked files & junk** | `cmd.exe /c "git clean -fd"` | Removes newly created untracked files or test artifacts. |
| **Full nuclear rollback** | `cmd.exe /c "git reset --hard HEAD && git clean -fd"` | Completely resets working tree to pristine commit state. |

---

## 📋 2. Complete Project File Manifest & Backup Checklist

All project files are verified and tracked in the git repository.

### 🌐 Root Configuration Files
- [ ] [package.json](file:///c:/Users/a/OneDrive/Documents/Vision/package.json) *(16 lines / 514 B)* — Root scripts for dev, start, build, postinstall.
- [ ] [Dockerfile](file:///c:/Users/a/OneDrive/Documents/Vision/Dockerfile) *(24 lines / 454 B)* — Container configuration for production deployment.
- [ ] [docker-compose.yml](file:///c:/Users/a/OneDrive/Documents/Vision/docker-compose.yml) *(13 lines / 282 B)* — Multi-container orchestration.
- [ ] [README.md](file:///c:/Users/a/OneDrive/Documents/Vision/README.md) *(90 lines / 2,616 B)* — Documentation, features, and setup instructions.
- [ ] [.gitignore](file:///c:/Users/a/OneDrive/Documents/Vision/.gitignore) *(233 B)* — Git exclusion rules for node_modules and uploads.

### 🖥️ Backend Server (`server/`)
- [ ] [server/package.json](file:///c:/Users/a/OneDrive/Documents/Vision/server/package.json) *(20 lines / 463 B)* — Express, Socket.IO, Helmet, Multer, Rate-Limit dependencies.
- [ ] [server/index.js](file:///c:/Users/a/OneDrive/Documents/Vision/server/index.js) *(85 lines / 2,331 B)* — Core Express & Socket.IO server on port 3000.
- [ ] [server/ipUtils.js](file:///c:/Users/a/OneDrive/Documents/Vision/server/ipUtils.js) *(122 lines / 3,279 B)* — IP subnet matching (LAN `/24` subnet vs Public IP hashing).
- [ ] [server/roomManager.js](file:///c:/Users/a/OneDrive/Documents/Vision/server/roomManager.js) *(285 lines / 7,383 B)* — Ephemeral room state, password hashing, message TTL (30 min auto-purge), reactions.
- [ ] [server/socketHandler.js](file:///c:/Users/a/OneDrive/Documents/Vision/server/socketHandler.js) *(9,131 B)* — Socket events engine & WebRTC p2p signaling handlers.
- [ ] [server/routes/api.js](file:///c:/Users/a/OneDrive/Documents/Vision/server/routes/api.js) *(1,514 B)* — REST API endpoints for room stats and info.
- [ ] [server/routes/upload.js](file:///c:/Users/a/OneDrive/Documents/Vision/server/routes/upload.js) *(1,613 B)* — Media and file upload route handler (Multer).
- [ ] [server/test_verification.js](file:///c:/Users/a/OneDrive/Documents/Vision/server/test_verification.js) *(58 lines / 2,427 B)* — Core backend unit verification script.

### 🎨 Frontend Client (`client/`)
- [ ] [client/package.json](file:///c:/Users/a/OneDrive/Documents/Vision/client/package.json) *(29 lines / 613 B)* — Vite, React 18, TailwindCSS, Lucide, Canvas-Confetti, Socket.IO client.
- [ ] [client/vite.config.js](file:///c:/Users/a/OneDrive/Documents/Vision/client/vite.config.js) *(26 lines / 509 B)* — Vite server & dev proxy definitions (`/api`, `/uploads`, `/socket.io` -> `http://localhost:3000`).
- [ ] [client/index.html](file:///c:/Users/a/OneDrive/Documents/Vision/client/index.html) *(1,364 B)* — HTML shell with Google Fonts (`Inter`, `JetBrains Mono`).
- [ ] [client/postcss.config.js](file:///c:/Users/a/OneDrive/Documents/Vision/client/postcss.config.js) *(80 B)* — PostCSS configuration for Tailwind.
- [ ] [client/tailwind.config.js](file:///c:/Users/a/OneDrive/Documents/Vision/client/tailwind.config.js) *(1,138 B)* — Tailwind theme tokens, glassmorphism utilities, dark mode palette.
- [ ] [client/src/main.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/main.jsx) *(242 B)* — React root renderer.
- [ ] [client/src/App.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/App.jsx) *(3,848 B)* — Primary UI layout shell, modals switcher, room state router.
- [ ] [client/src/styles/index.css](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/styles/index.css) *(3,156 B)* — Base CSS, custom scrollbars, cyber themes, animations.

#### Client Contexts & Utilities
- [ ] [client/src/context/SocketContext.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/context/SocketContext.jsx) *(361 lines / 9,969 B)* — Socket.IO state, room authentication, profile, messages, reactions.
- [ ] [client/src/context/WebRTCContext.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/context/WebRTCContext.jsx) *(10,266 B)* — Audio/Video peer connection, ice candidates, screen share streams.
- [ ] [client/src/utils/avatar.js](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/utils/avatar.js) *(4,602 B)* — Operative procedural handles & seed color generators.
- [ ] [client/src/utils/sound.js](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/utils/sound.js) *(3,558 B)* — Web Audio API synthesized notification sound chimes.

#### Client Components (`client/src/components/`)
- [ ] [AuthModal.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/components/AuthModal.jsx) *(7,804 B)* — Guest & Passkey login screen.
- [ ] [ChatArea.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/components/ChatArea.jsx) *(5,701 B)* — Active chat stream layout, auto-scroll header.
- [ ] [Header.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/components/Header.jsx) *(5,286 B)* — Top navigation bar, connection status, quick room actions.
- [ ] [ImageLightbox.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/components/ImageLightbox.jsx) *(1,602 B)* — Zoomable media preview modal.
- [ ] [InitialLoader.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/components/InitialLoader.jsx) *(2,462 B)* — Initial telemetry startup overlay.
- [ ] [MessageInput.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/components/MessageInput.jsx) *(9,004 B)* — Text area, emoji picker, dropzone, voice note trigger.
- [ ] [MessageItem.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/components/MessageItem.jsx) *(10,488 B)* — Message bubbles, markdown formatting, reactions, code copy.
- [ ] [PasswordModal.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/components/PasswordModal.jsx) *(3,084 B)* — Room PIN / password challenge modal.
- [ ] [ProfileSetupModal.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/components/ProfileSetupModal.jsx) *(6,513 B)* — Operative handle, avatar, role configuration.
- [ ] [RoomModal.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/components/RoomModal.jsx) *(10,317 B)* — Custom room creator & browser.
- [ ] [SettingsModal.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/components/SettingsModal.jsx) *(6,956 B)* — Preferences, notifications, audio toggles.
- [ ] [ShareModal.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/components/ShareModal.jsx) *(5,655 B)* — Room invite generator with Live QR Code.
- [ ] [Sidebar.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/components/Sidebar.jsx) *(6,784 B)* — Active room users list, host badges, device icons.
- [ ] [VideoCallModal.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/components/VideoCallModal.jsx) *(7,531 B)* — WebRTC video call overlay, mic/cam/screen toggles.
- [ ] [VoiceRecorder.jsx](file:///c:/Users/a/OneDrive/Documents/Vision/client/src/components/VoiceRecorder.jsx) *(4,705 B)* — Live mic voice note recorder & audio preview.

---

## 🛠️ 3. Verification & Server Health Check Commands

Use these commands to verify that code has been properly restored and is operational:

```bash
# 1. Verify Core Backend Logic
cmd.exe /c "node server/test_verification.js"

# 2. Rebuild Frontend Client
cmd.exe /c "npm run build --prefix client"

# 3. Start Backend Server
cmd.exe /c "node server/index.js"

# 4. Start Vite Dev Server
cmd.exe /c "npm run dev --prefix client"
```

> [!NOTE]
> In case `node_modules` gets corrupted, reinstall dependencies using:
> `cmd.exe /c "npm run postinstall"`
