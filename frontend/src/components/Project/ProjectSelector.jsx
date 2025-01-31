import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Typography,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { API_URL } from '@constants/api';

const ProjectSelector = ({ currentProjectId, onProjectSelect }) => {
  const [projects, setProjects] = useState([]);
  const [openNewProject, setOpenNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [error, setError] = useState(null);

  // Charger les projets
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/api/projects`);
      if (!response.ok) throw new Error('Erreur lors du chargement des projets');
      const data = await response.json();
      setProjects(data);
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
      const response = await fetch(`${API_URL}/api/projects`, {
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
      setProjects([...projects, newProject]);
      setOpenNewProject(false);
      setNewProjectName('');
      setNewProjectDescription('');
      onProjectSelect(newProject._id);
    } catch (error) {
      setError('Erreur lors de la création du projet');
      console.error('Erreur:', error);
    }
  };

  return (
    <Box>
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
            button
            selected={project._id === currentProjectId}
            onClick={() => onProjectSelect(project._id)}
          >
            <ListItemText
              primary={project.name}
              secondary={project.description}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="edit">
                <EditIcon />
              </IconButton>
              <IconButton edge="end" aria-label="delete">
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog open={openNewProject} onClose={() => setOpenNewProject(false)}>
        <DialogTitle>Nouveau projet</DialogTitle>
        <DialogContent>
          <form onSubmit={handleCreateProject}>
            <TextField
              autoFocus
              margin="dense"
              label="Nom du projet"
              fullWidth
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => setOpenNewProject(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="contained">
                Créer
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProjectSelector;
