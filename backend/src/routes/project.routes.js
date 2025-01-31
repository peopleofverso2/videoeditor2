const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');

// Routes pour les projets
router.post('/', projectController.createProject);
router.get('/', projectController.getUserProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
