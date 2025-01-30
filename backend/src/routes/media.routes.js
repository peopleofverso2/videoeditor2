import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

const VIDEOS_DIR = path.join(__dirname, '../../uploads');
const DATA_DIR = path.join(__dirname, '../../data');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      await fs.mkdir(VIDEOS_DIR, { recursive: true });
      cb(null, VIDEOS_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${timestamp}-${Math.floor(Math.random() * 100000000)}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept only video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Default metadata
const defaultMetadata = {
  availableTags: ['À valider', 'Montage terminé', 'En cours', 'À revoir'],
  videos: {}
};

// Upload video endpoint
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const stats = await fs.stat(req.file.path);
    const videoInfo = {
      name: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      size: stats.size,
      modifiedAt: stats.mtime
    };

    res.json(videoInfo);
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get list of videos
router.get('/list', async (req, res) => {
  try {
    // Get list of files
    const files = await fs.readdir(VIDEOS_DIR);
    
    // Filter and process MP4 files
    const videos = [];
    for (const file of files) {
      if (file.endsWith('.mp4')) {
        const stats = await fs.stat(path.join(VIDEOS_DIR, file));
        videos.push({
          name: file,
          path: `/uploads/${file}`,
          size: stats.size,
          modifiedAt: stats.mtime
        });
      }
    }
    
    // Sort videos by modification date (newest first)
    videos.sort((a, b) => b.modifiedAt - a.modifiedAt);
    
    res.json(videos);
  } catch (error) {
    console.error('Error listing videos:', error);
    res.json([]);
  }
});

// Get video metadata
router.get('/:filename', async (req, res) => {
  try {
    // Read metadata file
    let metadata;
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(METADATA_FILE, 'utf8');
      metadata = JSON.parse(data);
    } catch (err) {
      metadata = defaultMetadata;
      await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
    }
    
    // Get video metadata or return default
    const videoMeta = metadata.videos[req.params.filename] || {
      tags: ['À valider'],
      description: ''
    };
    
    res.json(videoMeta);
  } catch (error) {
    console.error('Error getting metadata:', error);
    res.json({ tags: ['À valider'], description: '' });
  }
});

// Update video metadata
router.patch('/:filename', async (req, res) => {
  try {
    const { tags, description } = req.body;
    
    // Read current metadata
    let metadata;
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(METADATA_FILE, 'utf8');
      metadata = JSON.parse(data);
    } catch (err) {
      metadata = defaultMetadata;
    }
    
    // Update video metadata
    metadata.videos[req.params.filename] = {
      tags: tags || ['À valider'],
      description: description || ''
    };
    
    // Save metadata
    await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
    
    res.json(metadata.videos[req.params.filename]);
  } catch (error) {
    console.error('Error updating metadata:', error);
    res.status(500).json({ error: 'Failed to update metadata' });
  }
});

export default router;
