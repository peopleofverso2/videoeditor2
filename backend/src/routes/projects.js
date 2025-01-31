import express from 'express';
import * as projectController from '../controllers/project.controller.js';

const router = express.Router();

// Routes pour les projets
router.post('/', projectController.createProject);
router.get('/', projectController.getUserProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

export default router;
