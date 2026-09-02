const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || (file.mimetype.includes('audio') ? '.webm' : '');
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  }
});

// Max 50MB per file
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Single file upload endpoint
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file provided' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  const isImage = req.file.mimetype.startsWith('image/');
  const isAudio = req.file.mimetype.startsWith('audio/');
  const isVideo = req.file.mimetype.startsWith('video/');

  res.json({
    success: true,
    fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    type: isImage ? 'image' : isAudio ? 'audio' : isVideo ? 'video' : 'file'
  });
});

module.exports = router;
