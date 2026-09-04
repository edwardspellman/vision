const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const selfsigned = require('selfsigned');

const socketHandler = require('./socketHandler');
const apiRoutes = require('./routes/api');
const uploadRoutes = require('./routes/upload');
const { getServerPrimaryLanIp } = require('./ipUtils');

const app = express();

const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }
});
app.use('/api/', limiter);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.use('/api', apiRoutes);
app.use('/api/upload', uploadRoutes);

// Static client assets
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <div style="font-family: monospace; text-align: center; padding: 50px; background: #04060a; color: #00ff88; min-height: 100vh;">
        <h1>[ ø ] VISION TELEMETRY ACTIVE</h1>
        <p>Core node server operational on port ${PORT}.</p>
      </div>
    `);
  });
}

// 1. Create HTTP Server
const httpServer = http.createServer(app);

// 2. Create Socket.IO Server attached to HTTP
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e7
});

socketHandler(io);

async function startServer() {
  const lanIp = getServerPrimaryLanIp();

  // 3. Generate SSL certificate for HTTPS Wi-Fi WebRTC calling
  let httpsServer = null;
  try {
    const pems = await selfsigned.generate(null, { days: 365 });
    if (pems && pems.cert && pems.private) {
      httpsServer = https.createServer({
        key: pems.private,
        cert: pems.cert
      }, app);

      // Attach Socket.IO to HTTPS server as well
      io.attach(httpsServer);
    }
  } catch (sslErr) {
    console.warn('Could not initialize HTTPS server:', sslErr.message);
  }

  // Start HTTP Server
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`⚡ VISION Core Network Engine Online`);
    console.log(`📡 Localhost HTTP:   http://localhost:${PORT}`);
    console.log(`🌐 Wi-Fi / LAN HTTP:  http://${lanIp}:${PORT}`);
    if (httpsServer) {
      console.log(`🔐 Wi-Fi / LAN HTTPS: https://${lanIp}:${HTTPS_PORT}  (Full Camera & Mic for Phones)`);
    }
    console.log(`🛰️  Real-time Socket.IO & WebRTC Mesh Signaling Active`);
    console.log(`======================================================\n`);
  });

  // Start HTTPS Server if available
  if (httpsServer) {
    httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
      // running
    });
  }
}

startServer();
