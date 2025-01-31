import express from 'express';
import Project from '../models/project.js';

const router = express.Router();

// Récupérer un projet pour l'intégration
router.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    // Si le projet nécessite un token, vérifier qu'il correspond
    if (project.embedToken && (!token || token !== project.embedToken)) {
      return res.status(403).json({ message: 'Token invalide' });
    }

    // Ne renvoyer que les données nécessaires pour l'intégration
    const embedData = {
      id: project._id,
      name: project.name,
      nodes: project.nodes,
      edges: project.edges,
      // Ajouter d'autres champs nécessaires pour l'intégration
    };

    res.json(embedData);
  } catch (error) {
    console.error('Erreur lors de la récupération du projet pour l\'intégration:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour le token d'intégration d'un projet
router.post('/projects/:id/token', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    project.embedToken = token;
    await project.save();

    res.json({ message: 'Token mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du token:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
