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
  Chip,
  Tooltip,
  Autocomplete,
  TextField,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Sort as SortIcon,
  Edit as EditIcon,
  LocalOffer as TagIcon,
  DriveFileRenameOutline as RenameIcon,
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
  const [editingTags, setEditingTags] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [renaming, setRenaming] = useState(null);
  const [newFileName, setNewFileName] = useState('');

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
    let filtered = [...videos];
    
    // Filtrer par tags sélectionnés
    if (selectedTags.length > 0) {
      filtered = filtered.filter(video => 
        selectedTags.every(tag => video.tags.includes(tag))
      );
    }
    
    // Trier
    filtered.sort((a, b) => {
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
    return filtered;
  }, [videos, sortBy, sortOrder, selectedTags]);

  // Récupérer tous les tags uniques
  const allTags = useMemo(() => {
    const tagSet = new Set();
    videos.forEach(video => {
      video.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [videos]);

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

  const handleAddTag = async (videoId, tagToAdd) => {
    if (!tagToAdd?.trim()) return;
    
    try {
      const video = videos.find(v => v.id === videoId);
      if (!video) return;

      // Éviter les doublons
      if (video.tags.includes(tagToAdd.trim())) return;

      const updatedTags = [...video.tags, tagToAdd.trim()];
      const response = await fetch(`${API_URL}/api/media/${videoId}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags: updatedTags }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour des tags');
      }

      const updatedVideo = await response.json();
      setVideos(prevVideos => 
        prevVideos.map(v => v.id === videoId ? updatedVideo : v)
      );
      setNewTag('');
    } catch (error) {
      console.error('Error updating tags:', error);
      setError('Erreur lors de la mise à jour des tags');
    }
  };

  const handleRemoveTag = async (videoId, tagToRemove) => {
    try {
      const video = videos.find(v => v.id === videoId);
      if (!video) return;

      const updatedTags = video.tags.filter(tag => tag !== tagToRemove);
      const response = await fetch(`${API_URL}/api/media/${videoId}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags: updatedTags }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour des tags');
      }

      const updatedVideo = await response.json();
      setVideos(prevVideos => 
        prevVideos.map(v => v.id === videoId ? updatedVideo : v)
      );
    } catch (error) {
      console.error('Error updating tags:', error);
      setError('Erreur lors de la mise à jour des tags');
    }
  };

  const handleRename = async (video) => {
    if (!newFileName.trim()) return;
    
    try {
      const response = await fetch(`${API_URL}/api/media/${video.id}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName: newFileName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors du renommage');
      }

      const updatedVideo = await response.json();
      setVideos(prevVideos => 
        prevVideos.map(v => v.id === video.id ? updatedVideo : v)
      );
      setRenaming(null);
      setNewFileName('');
    } catch (error) {
      console.error('Error renaming video:', error);
      setError(error.message || 'Erreur lors du renommage de la vidéo');
    }
  };

  const cancelRenaming = () => {
    setRenaming(null);
    setNewFileName('');
  };

  const toggleTagFilter = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getDisplayName = useCallback((video) => {
    // Enlever l'ID du début du nom si présent
    const name = video.name;
    const match = name.match(/^[^-]+-(.+)$/);
    return match ? match[1] : name;
  }, []);

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

          {/* Filtres et tri */}
          <Stack spacing={2} sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
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

            {/* Tags disponibles */}
            {allTags.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Filtrer par tags :
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {allTags.map(tag => (
                    <Chip
                      key={tag}
                      label={tag}
                      onClick={() => toggleTagFilter(tag)}
                      color={selectedTags.includes(tag) ? "primary" : "default"}
                      size="small"
                      icon={<TagIcon />}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>

          <Grid container spacing={2}>
            {sortedVideos.map((video, index) => (
              <Grid item xs={12} sm={6} md={4} key={`${video.path}-${index}`}>
                <Card
                  sx={{
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                    position: 'relative',
                  }}
                >
                  <Box 
                    sx={{ 
                      cursor: 'pointer',
                      position: 'relative',
                      '&:hover': {
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        }
                      }
                    }}
                    onClick={() => handleVideoSelect(video)}
                  >
                    <CardMedia
                      component="video"
                      src={`${API_URL}${video.path}`}
                      sx={{ height: 140 }}
                      onClick={(e) => e.stopPropagation()} // Empêcher la sélection lors du clic sur la vidéo elle-même
                    />
                  </Box>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ flex: 1 }}
                      >
                        {getDisplayName(video)}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Renommer">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenaming(video);
                              const displayName = getDisplayName(video);
                              setNewFileName(displayName.replace(/\.[^/.]+$/, ""));
                            }}
                          >
                            <RenameIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier les tags">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTags(video.id);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmation(video);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>

                    {/* Tags de la vidéo */}
                    <Box sx={{ mt: 1 }}>
                      {video.tags.map(tag => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          onDelete={() => handleRemoveTag(video.id, tag)}
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>

                    {/* Interface d'édition des tags */}
                    {editingTags === video.id && (
                      <Box sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={1}>
                          <Autocomplete
                            freeSolo
                            size="small"
                            options={allTags.filter(tag => !video.tags.includes(tag))}
                            value={newTag}
                            onChange={(event, newValue) => {
                              if (newValue) {
                                handleAddTag(video.id, newValue);
                              }
                            }}
                            onInputChange={(event, newInputValue) => {
                              setNewTag(newInputValue);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                size="small"
                                placeholder="Nouveau tag"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && newTag) {
                                    e.preventDefault();
                                    handleAddTag(video.id, newTag);
                                  }
                                }}
                              />
                            )}
                            sx={{ minWidth: 200 }}
                          />
                        </Stack>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Dialogue de renommage */}
      <Dialog
        open={Boolean(renaming)}
        onClose={() => {
          setRenaming(null);
          setNewFileName('');
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Renommer la vidéo</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Nom actuel :
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {renaming ? getDisplayName(renaming) : ''}
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Nouveau nom :
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                fullWidth
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Entrez le nouveau nom"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && renaming) {
                    handleRename(renaming);
                  } else if (e.key === 'Escape') {
                    setRenaming(null);
                    setNewFileName('');
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {renaming ? renaming.name.split('.').pop() : ''}
              </Typography>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setRenaming(null);
              setNewFileName('');
            }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={() => renaming && handleRename(renaming)}
            disabled={!newFileName.trim()}
          >
            Renommer
          </Button>
        </DialogActions>
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
