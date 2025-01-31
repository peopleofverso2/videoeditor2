import express from 'express';
import * as collaborationController from '../controllers/collaboration.controller.js';

const router = express.Router();

// Routes pour la gestion des collaborateurs
router.post('/invite', collaborationController.inviteCollaborator);
router.post('/projects/:projectId/accept', collaborationController.acceptInvitation);
router.put('/projects/:projectId/members', collaborationController.updateMemberRole);
router.get('/projects/:projectId/members', collaborationController.listProjectMembers);
router.delete('/projects/:projectId/members/:userId', collaborationController.removeMember);

export default router;
