import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import ReactFlow, { Background } from 'reactflow';
import config from '../../config';
import 'reactflow/dist/style.css';

const EmbedPlayer = () => {
  const { id, token } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const url = token 
          ? `${config.apiUrl}/api/embed/projects/${id}?token=${token}`
          : `${config.apiUrl}/api/embed/projects/${id}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(response.status === 403 
            ? 'Accès non autorisé' 
            : 'Projet non trouvé');
        }

        const data = await response.json();
        setProject(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, token]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh',
        color: 'error.main'
      }}>
        <Typography variant="h6">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={project.nodes}
        edges={project.edges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
      </ReactFlow>
    </Box>
  );
};

export default EmbedPlayer;
