import React, { useState } from 'react';
import { Box, Container, AppBar, Toolbar, Typography, Button } from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

function App() {
  const [rushes, setRushes] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleRushUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      console.log('Selected rush:', file);

      // Vérifier le type de fichier
      if (!file.type.startsWith('video/')) {
        alert('Veuillez sélectionner un fichier vidéo');
        return;
      }

      // Vérifier la taille du fichier (max 500MB pour les rushes)
      const MAX_SIZE = 500 * 1024 * 1024; // 500MB
      if (file.size > MAX_SIZE) {
        alert('La taille du rush doit être inférieure à 500MB');
        return;
      }

      // Créer un URL blob pour le rush
      const url = URL.createObjectURL(file);
      const newRush = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        name: file.name,
        type: file.type,
        size: file.size,
        duration: 0, // On ajoutera la durée plus tard
        lastModified: file.lastModified
      };

      setRushes(prev => [...prev, newRush]);

    } catch (error) {
      console.error('Error handling rush:', error);
      alert('Erreur lors du chargement du rush. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <VideoLibraryIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Rushes Vidéo
          </Typography>
          <Button
            variant="contained"
            component="label"
            disabled={isUploading}
            sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
          >
            Ajouter un rush
            <input
              type="file"
              hidden
              accept="video/*"
              onChange={handleRushUpload}
            />
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ flexGrow: 1, py: 3 }}>
        {rushes.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              color: 'text.secondary'
            }}
          >
            <VideoLibraryIcon sx={{ fontSize: 60 }} />
            <Typography variant="h6">
              Aucun rush
            </Typography>
            <Typography variant="body2">
              Cliquez sur "Ajouter un rush" pour commencer
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 3
            }}
          >
            {rushes.map(rush => (
              <Box
                key={rush.id}
                sx={{
                  position: 'relative',
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  overflow: 'hidden',
                  boxShadow: 1
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    paddingTop: '56.25%', // 16:9
                    bgcolor: 'black'
                  }}
                >
                  <video
                    src={rush.url}
                    controls
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%'
                    }}
                  />
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {rush.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(rush.size / (1024 * 1024)).toFixed(1)} MB
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default App;
