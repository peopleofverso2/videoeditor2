const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const router = express.Router();

// Configuration de multer pour l'upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /mp4|webm|mov|avi/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Seuls les fichiers vidéo sont autorisés'));
  }
});

// Récupérer les métadonnées d'une vidéo
const getVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('Erreur ffprobe:', err);
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
};

// Générer une miniature
const generateThumbnail = async (videoPath, thumbnailPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['50%'],
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '320x180'
      })
      .on('end', () => resolve(thumbnailPath))
      .on('error', (err) => {
        console.error('Erreur génération thumbnail:', err);
        reject(err);
      });
  });
};

// Route pour uploader une vidéo
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }

    const videoPath = req.file.path;
    const thumbnailName = path.basename(videoPath, path.extname(videoPath)) + '.jpg';
    const thumbnailPath = path.join(path.dirname(videoPath), thumbnailName);

    try {
      // Récupérer les métadonnées et générer la miniature en parallèle
      const [metadata] = await Promise.all([
        getVideoMetadata(videoPath),
        generateThumbnail(videoPath, thumbnailPath)
      ]);

      const videoUrl = `/uploads/${path.basename(videoPath)}`;
      const thumbnailUrl = `/uploads/${thumbnailName}`;

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const response = {
        success: true,
        file: {
          id: path.basename(videoPath, path.extname(videoPath)),
          name: req.file.originalname,
          path: videoUrl,
          thumbnail: thumbnailUrl,
          metadata: {
            duration: metadata.format.duration,
            size: metadata.format.size,
            width: videoStream ? videoStream.width : null,
            height: videoStream ? videoStream.height : null,
          }
        }
      };

      res.json(response);
    } catch (error) {
      // En cas d'erreur pendant le traitement, supprimer le fichier uploadé
      await fs.unlink(videoPath).catch(() => {});
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload de la vidéo', details: error.message });
  }
});

// Route pour lister les vidéos uploadées
router.get('/list', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const files = await fs.readdir(uploadsDir);
    const videos = [];

    for (const file of files) {
      if (file.match(/\.(mp4|webm|mov|avi)$/i)) {
        const filePath = path.join(uploadsDir, file);
        const stats = await fs.stat(filePath);
        const thumbnailPath = path.join(uploadsDir, path.basename(file, path.extname(file)) + '.jpg');
        const thumbnailExists = await fs.access(thumbnailPath).then(() => true).catch(() => false);
        
        videos.push({
          id: path.basename(file, path.extname(file)),
          name: file,
          path: `/uploads/${file}`,
          thumbnail: thumbnailExists ? `/uploads/${path.basename(thumbnailPath)}` : null,
          size: stats.size,
          createdAt: stats.birthtime
        });
      }
    }

    res.json({ videos });
  } catch (error) {
    console.error('Erreur lors de la lecture des vidéos:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des vidéos', details: error.message });
  }
});

// Route pour supprimer une vidéo
router.delete('/:id', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');
    const files = await fs.readdir(uploadsDir);
    
    const videoFile = files.find(f => f.startsWith(req.params.id));
    if (!videoFile) {
      return res.status(404).json({ error: 'Vidéo non trouvée' });
    }

    const videoPath = path.join(uploadsDir, videoFile);
    const thumbnailPath = path.join(uploadsDir, req.params.id + '.jpg');

    await Promise.all([
      fs.unlink(videoPath).catch(() => {}),
      fs.unlink(thumbnailPath).catch(() => {})
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la vidéo', details: error.message });
  }
});

module.exports = router;
