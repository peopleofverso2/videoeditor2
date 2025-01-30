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

// Configuration CORS plus permissive
app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origine (comme les appels API directs)
    if (!origin) return callback(null, true);
    
    // Autoriser localhost sur n'importe quel port
    if (origin.match(/^http:\/\/localhost:[0-9]+$/)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

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

// Upload de fichier
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }
    res.json({
      name: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload du fichier' });
  }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ error: 'Erreur serveur' });
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
