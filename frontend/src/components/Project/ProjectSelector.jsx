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
  Paper,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { API_URL } from '../../constants/api';
import ProjectDiagram from './ProjectDiagram';

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

  const handleProjectClick = (project) => {
    onProjectSelect(project._id);
  };

  return (
    <Box 
      sx={{ 
        height: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Paper 
        elevation={3}
        sx={{ 
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
          Mes Projets
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={() => setOpenNewProject(true)}
          variant="contained"
          color="primary"
          size="medium"
        >
          Nouveau projet
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* Liste des projets */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 3,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 2,
      }}>
        {projects.map((project) => (
          <Paper
            key={project._id}
            elevation={2}
            sx={{
              height: 200,
              bgcolor: 'background.paper',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 6,
              },
            }}
          >
            <ListItemButton 
              onClick={() => handleProjectClick(project)}
              sx={{ 
                height: '100%',
                p: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ 
                flex: 1,
                width: '100%',
                height: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}>
                {project.nodes && project.nodes.length > 0 ? (
                  <ProjectDiagram 
                    nodes={project.nodes} 
                    onDeleteNode={(nodeId) => {
                      const updatedNodes = project.nodes.filter(n => n.id !== nodeId);
                      setProjects(prev => prev.map(p => p._id === project._id ? {...p, nodes: updatedNodes} : p));
                    }}
                    onOpenNode={() => handleProjectClick(project)}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Projet vide
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ 
                p: 2,
                width: '100%',
                position: 'relative',
              }}>
                <ListItemText
                  primary={project.name}
                  secondary={project.description}
                  primaryTypographyProps={{
                    variant: 'subtitle1',
                    fontWeight: 'medium',
                    color: 'text.primary',
                    noWrap: true
                  }}
                  secondaryTypographyProps={{
                    variant: 'body2',
                    color: 'text.secondary',
                    noWrap: true
                  }}
                />
                <Tooltip title="Supprimer">
                  <span>
                    <IconButton 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmation(project);
                      }}
                      sx={{ 
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'error.main',
                        opacity: 0.7,
                        '&:hover': {
                          opacity: 1,
                          bgcolor: 'error.main',
                          color: 'white',
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </ListItemButton>
          </Paper>
        ))}
      </Box>

      {/* Dialog de création de projet */}
      <Dialog
        open={openNewProject}
        onClose={() => setOpenNewProject(false)}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            minWidth: 400,
          }
        }}
      >
        <DialogTitle>Nouveau projet</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleCreateProject} sx={{ mt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Nom du projet"
              fullWidth
              variant="outlined"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              variant="outlined"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenNewProject(false)}>Annuler</Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={!newProjectName.trim()}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
          }
        }}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer le projet "{deleteConfirmation?.name}" ?
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
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
