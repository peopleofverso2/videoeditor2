import Project from '../models/Project.js';

// Créer un nouveau projet
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = new Project({
      name,
      description,
      createdBy: req.user ? req.user._id : null // À implémenter plus tard avec l'authentification
    });
    const savedProject = await project.save();
    res.status(201).json(savedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtenir tous les projets de l'utilisateur
export const getUserProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir un projet spécifique
export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un projet
export const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    if (name) project.name = name;
    if (description) project.description = description;
    
    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer un projet
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    await project.deleteOne();
    res.json({ message: 'Projet supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
