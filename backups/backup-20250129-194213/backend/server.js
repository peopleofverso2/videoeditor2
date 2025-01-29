import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 4000;

// Configuration CORS
app.use(cors());
app.use(express.json());

// Configuration de Multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  }
});

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Lister les médias
app.get('/api/media/list', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, 'uploads');
    
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }
    
    const files = await fs.readdir(uploadsDir);
    const mediaFiles = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(uploadsDir, filename);
        const stats = await fs.stat(filePath);
        return {
          name: filename,
          path: `/uploads/${filename}`,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
    );
    
    // Ne renvoyer que les vidéos dans la liste
    const videoFiles = mediaFiles.filter(file => {
      const ext = path.extname(file.name).toLowerCase();
      return ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
    });
    
    res.json(videoFiles);
  } catch (error) {
    console.error('Erreur lors de la lecture des médias:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des vidéos' });
  }
});

// Upload de fichiers (accepte tous les types)
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }
    res.json({ path: `/uploads/${req.file.filename}` });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux (max 500MB)' });
    }
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || 'Erreur serveur' });
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
