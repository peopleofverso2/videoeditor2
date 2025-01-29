const express = require('express');
const router = express.Router();
const Scenario = require('../models/scenario.model');
const orchestrator = require('../services/orchestrator');
const videoService = require('../services/videoService');
const multer = require('multer');
const path = require('path');

// Configuration de multer pour l'upload de vidéos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${path.basename(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    cb(null, allowedTypes.includes(file.mimetype));
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max
  }
});

// Routes pour les scénarios
router.get('/', async (req, res) => {
  try {
    const scenarios = await Scenario.find({}, 'title description createdAt updatedAt');
    res.json(scenarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const scenario = await Scenario.findById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scénario non trouvé' });
    }
    res.json(scenario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const scenario = new Scenario(req.body);
    await scenario.save();
    res.status(201).json(scenario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const scenario = await Scenario.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!scenario) {
      return res.status(404).json({ error: 'Scénario non trouvé' });
    }
    res.json(scenario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const scenario = await Scenario.findByIdAndDelete(req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scénario non trouvé' });
    }
    res.json({ message: 'Scénario supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes pour l'exécution et l'IA
router.post('/:id/execute', async (req, res) => {
  try {
    const { nodeId, variables, choice } = req.body;
    const result = await orchestrator.executeNode({
      scenarioId: req.params.id,
      nodeId,
      variables,
      choice
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/suggestions', async (req, res) => {
  try {
    const { currentNodeId, nextNodeId } = req.body;
    const scenario = await Scenario.findById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ error: 'Scénario non trouvé' });
    }

    const currentNode = scenario.nodes.find(n => n.id === currentNodeId);
    const nextNode = nextNodeId ? scenario.nodes.find(n => n.id === nextNodeId) : null;

    const suggestions = await orchestrator.suggestImprovements(currentNode, nextNode);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes pour la gestion des vidéos
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }

    const metadata = await videoService.getVideoMetadata(req.file.path);
    const thumbnail = await videoService.generateThumbnail(req.file.path);

    res.json({
      url: `/uploads/${req.file.filename}`,
      thumbnail: `/uploads/${path.basename(thumbnail)}`,
      metadata: {
        duration: metadata.format.duration,
        size: metadata.format.size,
        format: metadata.format.format_name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
