import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  DialogActions,
  DialogContentText,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Sort as SortIcon,
} from '@mui/icons-material';

// Définir l'URL de l'API en fonction de l'environnement
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function MediaLibrary({ open, onClose, onSelect }) {
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const fetchVideos = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/media/list`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des vidéos');
      }
      const data = await response.json();
      setVideos(data || []);
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

  // Tri des vidéos
  const sortedVideos = useMemo(() => {
    const sorted = [...videos];
    sorted.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });
    return sorted;
  }, [videos, sortBy, sortOrder]);

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

  const handleDelete = async (video) => {
    try {
      const response = await fetch(`${API_URL}/api/media/${video.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      await response.json();
      setVideos(prevVideos => prevVideos.filter(v => v.id !== video.id));
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Delete failed:', error);
      setError('Erreur lors de la suppression');
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  };

  return (
    <>
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

          {/* Options de tri */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Trier par</InputLabel>
              <Select
                value={sortBy}
                label="Trier par"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="name">Nom</MenuItem>
                <MenuItem value="date">Date</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              size="small"
              onClick={toggleSortOrder}
              startIcon={<SortIcon />}
            >
              {sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
            </Button>
          </Stack>

          <Grid container spacing={2}>
            {sortedVideos.map((video, index) => (
              <Grid item xs={12} sm={6} md={4} key={`${video.path}-${index}`}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                    position: 'relative',
                  }}
                >
                  <CardMedia
                    component="video"
                    src={`${API_URL}${video.path}`}
                    sx={{ height: 140 }}
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ flex: 1, cursor: 'pointer' }}
                        onClick={() => handleVideoSelect(video)}
                      >
                        {video.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmation(video);
                        }}
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={Boolean(deleteConfirmation)}
        onClose={() => setDeleteConfirmation(null)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cette vidéo ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmation(null)}>Annuler</Button>
          <Button
            onClick={() => handleDelete(deleteConfirmation)}
            color="error"
            variant="contained"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
