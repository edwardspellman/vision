# ⚡ UChat — Instant IP & Room-Based Real-Time Messenger

> Inspired by `ipchat.in`, enhanced with custom room IDs, password protection, WebRTC peer-to-peer video/voice calls, live voice notes, drag-and-drop media sharing, and mobile QR code pairing.

---

## 🌟 Key Features

1. **Automatic Network / IP Matching**:
   - Zero signup required.
   - Automatically groups devices connected to the same Wi-Fi, LAN, or public IP into a shared room.
2. **Custom Protected Rooms (Share ID & Password)**:
   - Create custom rooms with your own unique Room ID (e.g. `TEAM-SYNC-01`).
   - Protect rooms with a private Password or PIN.
   - 1-Click "Copy Invite Info" and "Copy Room Link".
   - Live Canvas QR Code generator for instant mobile smartphone scanning.
3. **Sub-10ms Real-Time Chat Engine**:
   - Powered by Node.js, Express, and Socket.IO.
   - Real-time typing indicators, user presence with device icons (mobile/desktop), and host badges.
   - Markdown support, auto-URL link detection, code block syntax styling with 1-click copy.
   - Emoji reactions & custom procedural Web Audio API notification chimes.
4. **WebRTC P2P Voice & Video Calls**:
   - 1-on-1 audio and video calling directly in the browser with screen sharing.
5. **Media, Voice Notes & File Sharing**:
   - Built-in live microphone voice note recorder with waveform visualization.
   - Drag-and-drop file/image uploads with zoomable image lightbox.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
# In the server folder:
cd server
npm install

# In the client folder:
cd ../client
npm install
```

### 2. Run in Development
Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
# Server will run on http://localhost:3000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Vite client will run on http://localhost:5173
```

Visit `http://localhost:5173` in your browser!

---

## 📦 Production Build & Deployment

### Single Command Production Run:
```bash
# 1. Build the frontend
cd client
npm run build

# 2. Start the unified production server (serves frontend + backend + WebSockets)
cd ../server
npm start
```
Now access your entire application at `http://localhost:3000`!

### Docker Deployment:
```bash
docker-compose up -d --build
```

---

## 🔒 Security & Privacy

- **Zero Data Logging**: Rooms and messages are kept in-memory (ephemeral) and automatically cleaned up when empty.
- **SHA-256 Hashed Passwords**: Room passwords are never stored in plaintext.
- **Rate-Limiting & Helmet**: Built-in protection against DDoS and abuse.
