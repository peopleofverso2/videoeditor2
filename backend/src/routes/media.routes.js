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
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware pour parser le JSON
router.use(express.json());

// Stockage des tags en mémoire (à remplacer par une base de données dans une version future)
const videoTags = new Map();

// Middleware de logging pour les routes media
router.use((req, res, next) => {
  console.log('\n=== Media Route Accessed ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Body:', req.body);
  console.log('Params:', req.params);
  console.log('=========================\n');
  next();
});

// Route pour les tags (AVANT les autres routes avec des paramètres)
router.put('/:filename/tags', (req, res) => {
  try {
    console.log('\n=== PUT Tags Route ===');
    const filename = req.params.filename;
    const { tags } = req.body;
    
    const filepath = path.join(__dirname, '../../uploads', filename);
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
    const filepath = path.join(__dirname, '../../uploads', filename);
    
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

// Liste tous les fichiers
router.get('/list', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const files = fs.readdirSync(uploadsDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp4', '.webm', '.mov', '.avi'].includes(ext);
      })
      .map(file => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        return {
          name: file,
          path: `/uploads/${file}`,
          size: stats.size,
          modifiedAt: stats.mtime,
          tags: videoTags.get(file) || []
        };
      });

    res.json(files);
  } catch (error) {
    console.error('Erreur lors de la lecture des fichiers:', error);
    res.status(500).json({ error: 'Erreur lors de la lecture des fichiers' });
  }
});

// Upload un fichier
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier n\'a été uploadé' });
    }

    // Initialiser les tags pour ce fichier
    videoTags.set(req.file.filename, []);

    res.json({
      file: {
        name: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        size: req.file.size,
        modifiedAt: new Date(),
        tags: []
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

// Supprimer un fichier
router.delete('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '../../uploads', filename);

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

    const uploadsDir = path.join(__dirname, '../../uploads');
    const files = fs.readdirSync(uploadsDir);

    // Ajouter les fichiers à l'archive
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
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
    const extractPath = path.join(__dirname, '../../uploads');

    await extract(archivePath, { dir: extractPath });
    fs.unlinkSync(archivePath);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    res.status(500).json({ error: 'Erreur lors de l\'import' });
  }
});

export default router;
