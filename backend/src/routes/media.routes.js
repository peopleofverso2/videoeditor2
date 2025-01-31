import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import archiver from 'archiver';
import extract from 'extract-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Media routes are working' });
});

// Test route avec paramètre
router.get('/test/:param', (req, res) => {
  res.json({ message: 'Parameter route working', param: req.params.param });
});

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const mediaDir = path.join(__dirname, '../../media');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
    cb(null, mediaDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Middleware pour parser le JSON
router.use(express.json());

// Middleware de logging pour les routes media
router.use((req, res, next) => {
  console.log('\n=== Media Route Accessed ===');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Body:', req.body);
  console.log('=========================\n');
  next();
});

// Stockage des tags en mémoire (à remplacer par une base de données dans une version future)
const videoTags = new Map();

// Route pour les tags (AVANT les autres routes avec des paramètres)
router.put('/:filename/tags', (req, res) => {
  try {
    console.log('\n=== PUT Tags Route ===');
    const filename = req.params.filename;
    const { tags } = req.body;
    
    const filepath = path.join(__dirname, '../../media', filename);
    console.log('Filepath:', filepath);
    console.log('File exists:', fs.existsSync(filepath));

    if (!fs.existsSync(filepath)) {
      console.log('File not found:', filepath);
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    if (!Array.isArray(tags)) {
      console.log('Invalid tags format:', tags);
      return res.status(400).json({ error: 'Les tags doivent être un tableau' });
    }

    videoTags.set(filename, tags);
    console.log('Tags updated:', videoTags.get(filename));
    res.json({ tags: videoTags.get(filename) });
  } catch (error) {
    console.error('Error in PUT /tags:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des tags' });
  }
});

// Route pour récupérer les tags
router.get('/:filename/tags', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '../../media', filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    const tags = videoTags.get(filename) || [];
    res.json({ tags });
  } catch (error) {
    console.error('Error in GET /tags:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des tags' });
  }
});

// Liste des médias
router.get('/list', (req, res) => {
  try {
    const mediaDir = path.join(__dirname, '../../media');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
    
    const files = fs.readdirSync(mediaDir)
      .filter(file => file.match(/\.(mp4|webm|ogg|json)$/))
      .map(file => ({
        id: file,
        name: file,
        url: `/media/${file}`,
        type: file.endsWith('.json') ? 'json' : 'video',
        tags: videoTags.get(file) || []
      }));
      
    res.json(files);
  } catch (error) {
    console.error('Erreur lors de la lecture du dossier media:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des médias' });
  }
});

// Upload d'un média
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      throw new Error('Aucun fichier reçu');
    }
    
    console.log('Fichier reçu:', req.file);
    
    res.json({
      file: {
        name: req.file.originalname,
        path: `/media/${req.file.filename}`,
        size: req.file.size,
        type: req.file.originalname.endsWith('.json') ? 'json' : 'video'
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un fichier
router.delete('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '../../media', filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    fs.unlinkSync(filepath);
    videoTags.delete(filename);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Export des médias
router.get('/export', async (req, res) => {
  try {
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    res.attachment('media-export.zip');
    archive.pipe(res);

    const mediaDir = path.join(__dirname, '../../media');
    const files = fs.readdirSync(mediaDir);

    // Ajouter les fichiers à l'archive
    for (const file of files) {
      const filePath = path.join(mediaDir, file);
      archive.file(filePath, { name: `media/${file}` });
    }

    await archive.finalize();
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
});

// Import des médias
router.post('/import', upload.single('archive'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier n\'a été uploadé' });
    }

    const archivePath = req.file.path;
    const extractPath = path.join(__dirname, '../../media');

    await extract(archivePath, { dir: extractPath });
    fs.unlinkSync(archivePath);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    res.status(500).json({ error: 'Erreur lors de l\'import' });
  }
});

export default router;
