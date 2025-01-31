import Project from '../models/Project.js';

// Créer un nouveau projet
export const createProject = async (req, res) => {
  try {
    console.log('Création d\'un nouveau projet:', req.body);
    const { name, description } = req.body;
    const project = new Project({
      name,
      description,
      nodes: [],
      edges: [],
      createdBy: req.user ? req.user._id : null // À implémenter plus tard avec l'authentification
    });
    const savedProject = await project.save();
    console.log('Projet créé avec succès:', savedProject);
    res.status(201).json(savedProject);
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    res.status(400).json({ message: error.message });
  }
};

// Obtenir tous les projets de l'utilisateur
export const getUserProjects = async (req, res) => {
  try {
    console.log('Récupération de tous les projets');
    const projects = await Project.find();
    console.log('Projets trouvés:', projects);
    res.json(projects);
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtenir un projet spécifique
export const getProject = async (req, res) => {
  try {
    console.log('Récupération du projet:', req.params.id);
    const project = await Project.findById(req.params.id);
    if (!project) {
      console.log('Projet non trouvé:', req.params.id);
      return res.status(404).json({ message: 'Projet non trouvé' });
    }
    console.log('Projet trouvé:', project);
    res.json(project);
  } catch (error) {
    console.error('Erreur lors de la récupération du projet:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un projet
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { nodes, edges, screenshot } = req.body;

    const project = await Project.findByIdAndUpdate(
      id,
      { 
        nodes, 
        edges,
        screenshot,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    res.json(project);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un projet
export const deleteProject = async (req, res) => {
  try {
    console.log('Suppression du projet:', req.params.id);
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      console.log('Projet non trouvé:', req.params.id);
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    await project.deleteOne();
    console.log('Projet supprimé avec succès');
    res.json({ message: 'Projet supprimé' });
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error);
    res.status(500).json({ message: error.message });
  }
};
