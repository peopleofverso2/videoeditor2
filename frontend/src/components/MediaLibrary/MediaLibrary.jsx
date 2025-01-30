import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Box,
  LinearProgress,
  Alert,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';

// Définir l'URL de l'API en fonction de l'environnement
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function MediaLibrary({ open, onClose, onSelect }) {
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const fetchVideos = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/media/list`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des vidéos');
      }
      const data = await response.json();
      setVideos(data || []); // Le backend renvoie directement le tableau
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Erreur lors du chargement des vidéos');
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchVideos();
    }
  }, [open, fetchVideos]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Erreur lors de l'upload: ${error}`);
        }

        const uploadedVideo = await response.json();
        setVideos(prevVideos => [...prevVideos, uploadedVideo]);
        setUploadProgress(100);
      } catch (error) {
        console.error('Upload failed:', error);
        setError('Erreur lors de l\'upload');
      } finally {
        setUploading(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.ogg', '.mov']
    },
    multiple: false
  });

  const handleVideoSelect = (video) => {
    onSelect(video);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle>
        Bibliothèque média
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          {...getRootProps()}
          sx={{
            p: 3,
            mb: 3,
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography>
            {isDragActive
              ? 'Déposez la vidéo ici'
              : 'Glissez-déposez une vidéo ou cliquez pour sélectionner'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            MP4, WebM, MOV ou AVI • 500 MB max
          </Typography>
        </Box>

        {uploading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        <Grid container spacing={2}>
          {videos.map((video, index) => (
            <Grid item xs={12} sm={6} md={4} key={`${video.path}-${index}`}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleVideoSelect(video)}
              >
                <CardMedia
                  component="video"
                  src={`${API_URL}${video.path}`}
                  sx={{ height: 140 }}
                />
                <CardContent>
                  <Typography variant="body2" noWrap>
                    {video.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
