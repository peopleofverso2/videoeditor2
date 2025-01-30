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
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.match(/^http:\/\/localhost:[0-9]+$/)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Chemins des fichiers
const uploadsDir = path.join(__dirname, 'uploads');
const dataFile = path.join(__dirname, 'data', 'videos.json');

// Assurer que les répertoires existent
async function ensureDirectories() {
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
  try {
    await fs.access(path.dirname(dataFile));
  } catch {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
  }
}

// Charger les métadonnées des vidéos
async function loadVideoData() {
  try {
    const data = await fs.readFile(dataFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { videos: [] };
  }
}

// Sauvegarder les métadonnées des vidéos
async function saveVideoData(data) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

// Configuration de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Servir les fichiers statiques
app.use('/uploads', express.static(uploadsDir));

// Lister les vidéos
app.get('/api/media/list', async (req, res) => {
  try {
    await ensureDirectories();
    const data = await loadVideoData();
    
    // Si pas de données dans le fichier JSON, scanner le dossier
    if (data.videos.length === 0) {
      const files = await fs.readdir(uploadsDir);
      const videoFiles = await Promise.all(
        files
          .filter(file => ['.mp4', '.webm', '.ogg', '.mov'].includes(path.extname(file).toLowerCase()))
          .map(async (filename) => {
            const stats = await fs.stat(path.join(uploadsDir, filename));
            return {
              id: path.parse(filename).name,
              name: filename,
              path: `/uploads/${filename}`,
              size: stats.size,
              createdAt: stats.birthtime,
              tags: []
            };
          })
      );
      data.videos = videoFiles;
      await saveVideoData(data);
    }
    
    res.json(data.videos);
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

    const data = await loadVideoData();
    const newVideo = {
      id: path.parse(req.file.filename).name,
      name: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
      createdAt: new Date(),
      tags: []
    };

    data.videos.push(newVideo);
    await saveVideoData(data);

    res.json(newVideo);
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload du fichier' });
  }
});

// Mettre à jour les tags d'une vidéo
app.put('/api/media/:id/tags', async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'Les tags doivent être un tableau' });
    }

    const data = await loadVideoData();
    const videoIndex = data.videos.findIndex(v => v.id === id);

    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Vidéo non trouvée' });
    }

    data.videos[videoIndex].tags = tags;
    await saveVideoData(data);

    res.json(data.videos[videoIndex]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des tags:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des tags' });
  }
});

// Route pour renommer une vidéo
app.put('/api/media/:id/rename', async (req, res) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;

    if (!newName) {
      return res.status(400).json({ error: 'Le nouveau nom est requis' });
    }

    // Charger les métadonnées actuelles
    const videosData = await loadVideoData();
    const videoIndex = videosData.videos.findIndex(v => v.id === id);

    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Vidéo non trouvée' });
    }

    const video = videosData.videos[videoIndex];
    
    // Construire le nouveau nom de fichier en gardant l'extension et l'ID
    const extension = path.extname(video.name);
    const newFileName = `${id}-${newName}${extension}`;
    const oldPath = path.join(__dirname, 'uploads', path.basename(video.path));
    const newPath = path.join(__dirname, 'uploads', newFileName);

    // Vérifier si le nouveau nom n'existe pas déjà
    if (videosData.videos.some(v => v.name === newFileName && v.id !== id)) {
      return res.status(400).json({ error: 'Une vidéo avec ce nom existe déjà' });
    }

    // Renommer le fichier physique
    try {
      await fs.rename(oldPath, newPath);
    } catch (error) {
      console.error('Error renaming file:', error);
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'Fichier non trouvé' });
      }
      throw error;
    }

    // Mettre à jour les métadonnées
    videosData.videos[videoIndex] = {
      ...video,
      name: newFileName,
      path: `/uploads/${newFileName}`,
    };

    // Sauvegarder les métadonnées
    await saveVideoData(videosData);

    res.json(videosData.videos[videoIndex]);
  } catch (error) {
    console.error('Error renaming video:', error);
    res.status(500).json({ error: 'Erreur lors du renommage de la vidéo' });
  }
});

// Supprimer une vidéo
app.delete('/api/media/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await loadVideoData();
    
    const videoIndex = data.videos.findIndex(v => v.id === id);
    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Vidéo non trouvée' });
    }

    const video = data.videos[videoIndex];
    const filePath = path.join(uploadsDir, video.name);

    // Vérifier si le fichier existe
    try {
      await fs.access(filePath);
      // Supprimer le fichier physique
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Le fichier ${filePath} n'existe pas ou ne peut pas être supprimé`);
    }

    // Supprimer l'entrée de la base de données
    data.videos.splice(videoIndex, 1);
    await saveVideoData(data);

    res.json({ success: true, message: 'Vidéo supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la vidéo' });
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
