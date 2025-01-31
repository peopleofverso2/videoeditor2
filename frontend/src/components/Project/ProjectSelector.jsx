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
  ListItemButton,
  TextField,
  Typography,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import { API_URL } from '../../constants/api';

const ProjectSelector = ({ onProjectSelect }) => {
  const [projects, setProjects] = useState([]);
  const [openNewProject, setOpenNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [error, setError] = useState(null);

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
          <ListItem key={project._id} disablePadding>
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
    </Box>
  );
};

export default ProjectSelector;
