import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemButton,
  Paper,
  CircularProgress
} from '@mui/material';
import { API_URL } from '../../constants/api';

const ProjectSelector = ({ onProjectSelect }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/projects`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des projets');
      }
      const data = await response.json();
      setProjects(data);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ maxWidth: 600, mx: 'auto', mt: 3 }}>
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Sélectionnez un projet
        </Typography>
        <List>
          {projects.map((project) => (
            <ListItem key={project.id} disablePadding>
              <ListItemButton onClick={() => onProjectSelect(project)}>
                <ListItemText 
                  primary={project.name}
                  secondary={project.description}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  );
};

export default ProjectSelector;
