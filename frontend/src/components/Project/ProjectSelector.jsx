import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemSecondaryAction,
  TextField,
  Typography,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { API_URL } from '../../constants/api';

const ProjectSelector = ({ onProjectSelect }) => {
  const [projects, setProjects] = useState([]);
  const [openNewProject, setOpenNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  // Charger les projets
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/projects`);
      if (!response.ok) throw new Error('Erreur lors du chargement des projets');
      const data = await response.json();
      console.log('Projets chargés:', data);
      setProjects(data);
      setError(null);
    } catch (error) {
      setError('Erreur lors du chargement des projets');
      console.error('Erreur:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Créer un nouveau projet
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la création du projet');

      const newProject = await response.json();
      console.log('Nouveau projet créé:', newProject);
      setProjects(prev => [...prev, newProject]);
      setOpenNewProject(false);
      setNewProjectName('');
      setNewProjectDescription('');
      setError(null);
    } catch (error) {
      setError('Erreur lors de la création du projet');
      console.error('Erreur:', error);
    }
  };

  // Supprimer un projet
  const handleDeleteProject = async (projectId) => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression du projet');

      setProjects(prev => prev.filter(p => p._id !== projectId));
      setDeleteConfirmation(null);
      setError(null);
    } catch (error) {
      setError('Erreur lors de la suppression du projet');
      console.error('Erreur:', error);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Projets</Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={() => setOpenNewProject(true)}
          variant="contained"
          size="small"
        >
          Nouveau projet
        </Button>
      </Box>

      <List>
        {projects.map((project) => (
          <ListItem 
            key={project._id} 
            disablePadding
            secondaryAction={
              <IconButton 
                edge="end" 
                aria-label="delete"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmation(project);
                }}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemButton onClick={() => onProjectSelect(project._id)}>
              <ListItemText
                primary={project.name}
                secondary={project.description}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Dialog open={openNewProject} onClose={() => setOpenNewProject(false)}>
        <DialogTitle>Nouveau projet</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleCreateProject} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Nom du projet"
              fullWidth
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button type="submit" variant="contained" fullWidth>
              Créer
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer le projet "{deleteConfirmation?.name}" ?
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmation(null)}>Annuler</Button>
          <Button
            onClick={() => handleDeleteProject(deleteConfirmation._id)}
            color="error"
            variant="contained"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectSelector;
