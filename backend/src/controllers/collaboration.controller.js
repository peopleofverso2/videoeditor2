import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import User from '../models/User.js';

// Vérifier les permissions d'un utilisateur sur un projet
const checkPermissions = async (userId, projectId, requiredRole) => {
  const member = await ProjectMember.findOne({
    user: userId,
    project: projectId,
    status: 'active'
  });

  if (!member) return false;

  const roles = ['viewer', 'editor', 'admin', 'owner'];
  const userRoleIndex = roles.indexOf(member.role);
  const requiredRoleIndex = roles.indexOf(requiredRole);

  return userRoleIndex >= requiredRoleIndex;
};

// Inviter un collaborateur
export const inviteCollaborator = async (req, res) => {
  try {
    const { projectId, email, role } = req.body;
    const inviterId = req.user.id; // Supposons que l'authentification est en place

    // Vérifier les permissions de l'inviteur
    const hasPermission = await checkPermissions(inviterId, projectId, 'admin');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }

    // Vérifier si le projet existe
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    // Trouver ou créer l'utilisateur
    let user = await User.findOne({ email });
    if (!user) {
      // Créer un utilisateur temporaire
      user = await User.create({
        email,
        username: email.split('@')[0],
        password: Math.random().toString(36), // À changer lors de la première connexion
      });
    }

    // Créer l'invitation
    const membership = await ProjectMember.create({
      project: projectId,
      user: user._id,
      role,
      invitedBy: inviterId
    });

    // TODO: Envoyer un email d'invitation

    res.json(membership);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Accepter une invitation
export const acceptInvitation = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const membership = await ProjectMember.findOneAndUpdate(
      {
        project: projectId,
        user: userId,
        status: 'pending'
      },
      {
        status: 'active',
        lastAccessed: new Date()
      },
      { new: true }
    );

    if (!membership) {
      return res.status(404).json({ error: 'Invitation non trouvée' });
    }

    res.json(membership);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour les permissions
export const updateMemberRole = async (req, res) => {
  try {
    const { projectId, userId, newRole } = req.body;
    const adminId = req.user.id;

    // Vérifier les permissions de l'administrateur
    const hasPermission = await checkPermissions(adminId, projectId, 'admin');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }

    const membership = await ProjectMember.findOneAndUpdate(
      {
        project: projectId,
        user: userId,
        status: 'active'
      },
      { role: newRole },
      { new: true }
    );

    if (!membership) {
      return res.status(404).json({ error: 'Membre non trouvé' });
    }

    res.json(membership);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lister les membres d'un projet
export const listProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Vérifier l'accès au projet
    const hasAccess = await checkPermissions(userId, projectId, 'viewer');
    if (!hasAccess) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const members = await ProjectMember.find({ project: projectId })
      .populate('user', 'username email avatar')
      .populate('invitedBy', 'username');

    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un membre
export const removeMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const adminId = req.user.id;

    // Vérifier les permissions
    const hasPermission = await checkPermissions(adminId, projectId, 'admin');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }

    // Empêcher la suppression du propriétaire
    const memberToRemove = await ProjectMember.findOne({
      project: projectId,
      user: userId
    });

    if (memberToRemove.role === 'owner') {
      return res.status(403).json({ error: 'Impossible de supprimer le propriétaire' });
    }

    await ProjectMember.deleteOne({
      project: projectId,
      user: userId
    });

    res.json({ message: 'Membre supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectInvitation = async (req, res) => {
  try {
    const { projectId } = req.body;
    res.json({ message: 'Invitation rejetée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInvitations = async (req, res) => {
  try {
    // À implémenter plus tard avec l'authentification
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
