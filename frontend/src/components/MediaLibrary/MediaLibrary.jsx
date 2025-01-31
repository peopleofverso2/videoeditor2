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
  TextField,
  Tooltip,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Sort as SortIcon,
  Edit as EditIcon,
  LocalOffer as TagIcon,
  ImportExport as ImportExportIcon,
} from '@mui/icons-material';
import { loadLibraryState, saveLibraryState } from '../../services/libraryService';

// Définir l'URL de l'API en fonction de l'environnement
const API_URL = 'http://localhost:4000';

export default function MediaLibrary({ open, onClose, onSelect }) {
  // Charger l'état initial depuis le stockage local
  const initialState = loadLibraryState();
  
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [sortBy, setSortBy] = useState(initialState.sortBy);
  const [sortOrder, setSortOrder] = useState(initialState.sortOrder);
  const [editingTags, setEditingTags] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [selectedTags, setSelectedTags] = useState(initialState.selectedTags);

  // Sauvegarder l'état quand il change
  useEffect(() => {
    if (open) {  // Ne sauvegarder que si la bibliothèque est ouverte
      saveLibraryState({
        sortBy,
        sortOrder,
        selectedTags,
      });
    }
  }, [sortBy, sortOrder, selectedTags, open]);

  // Charger l'état quand la bibliothèque s'ouvre
  useEffect(() => {
    if (open) {
      const savedState = loadLibraryState();
      setSortBy(savedState.sortBy);
      setSortOrder(savedState.sortOrder);
      setSelectedTags(savedState.selectedTags);
      fetchVideos();
    }
  }, [open]);

  const fetchVideos = useCallback(async () => {
    try {
      console.log('Fetching videos...');
      const response = await fetch(`${API_URL}/api/media/list`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des vidéos');
      }
      const data = await response.json();
      console.log('Received videos:', data);
      
      // Les tags sont maintenant inclus dans la réponse de l'API
      setVideos(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Erreur lors du chargement des vidéos');
      setVideos([]);
    }
  }, []);

  // Tri et filtrage des vidéos
  const sortedVideos = useMemo(() => {
    let filtered = [...videos];
    
    // Filtrer par tags sélectionnés
    if (selectedTags.length > 0) {
      filtered = filtered.filter(video => 
        selectedTags.every(tag => 
          Array.isArray(video.tags) && 
          video.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
        )
      );
    }
    
    // Trier
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? (a.name || '').localeCompare(b.name || '')
          : (b.name || '').localeCompare(a.name || '');
      } else if (sortBy === 'date') {
        const dateA = new Date(a.modifiedAt || 0).getTime();
        const dateB = new Date(b.modifiedAt || 0).getTime();
        return sortOrder === 'asc'
          ? dateA - dateB
          : dateB - dateA;
      }
      return 0;
    });
    return filtered;
  }, [videos, sortBy, sortOrder, selectedTags]);

  // Récupérer tous les tags uniques
  const allTags = useMemo(() => {
    const tagSet = new Set();
    videos.forEach(video => {
      if (Array.isArray(video.tags)) {
        video.tags.forEach(tag => tag && tagSet.add(tag.toLowerCase()));
      }
    });
    return Array.from(tagSet).sort();
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
        const response = await fetch(`${API_URL}/api/media/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Erreur lors de l\'upload');
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

  const handleDelete = async (video) => {
    try {
      const response = await fetch(`${API_URL}/api/media/${video.name}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setVideos(prevVideos => prevVideos.filter(v => v.name !== video.name));
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Delete failed:', error);
      setError('Erreur lors de la suppression');
    }
  };

  const handleAddTag = async (video, tagToAdd) => {
    if (!tagToAdd?.trim()) return;
    
    try {
      const response = await fetch(`${API_URL}/api/media/${encodeURIComponent(video.name)}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: [...(video.tags || []), tagToAdd.trim()]
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du tag');
      }

      const { tags } = await response.json();
      setVideos(prevVideos =>
        prevVideos.map(v =>
          v.name === video.name ? { ...v, tags } : v
        )
      );
      setNewTag('');
      setEditingTags(null);
    } catch (error) {
      console.error('Error adding tag:', error);
      setError('Erreur lors de l\'ajout du tag');
    }
  };

  const handleRemoveTag = async (video, tagToRemove) => {
    try {
      const newTags = video.tags.filter(tag => tag !== tagToRemove);
      
      const response = await fetch(`${API_URL}/api/media/${encodeURIComponent(video.name)}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags: newTags })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du tag');
      }

      const { tags } = await response.json();
      setVideos(prevVideos =>
        prevVideos.map(v =>
          v.name === video.name ? { ...v, tags } : v
        )
      );
    } catch (error) {
      console.error('Error removing tag:', error);
      setError('Erreur lors de la suppression du tag');
    }
  };

  const toggleTagFilter = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('archive', file);

    try {
      setUploading(true);
      const response = await fetch(`${API_URL}/api/media/import`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'import');
      }

      await fetchVideos();
    } catch (error) {
      console.error('Import failed:', error);
      setError('Erreur lors de l\'import');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.ogg', '.mov']
    },
    multiple: false
  });

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Bibliothèque Média</Typography>
          <Box>
            <input
              type="file"
              accept=".zip"
              style={{ display: 'none' }}
              id="import-input"
              onChange={handleImport}
            />
            <label htmlFor="import-input">
              <Tooltip title="Importer">
                <IconButton component="span">
                  <CloudUploadIcon />
                </IconButton>
              </Tooltip>
            </label>
            <Tooltip title="Exporter">
              <IconButton onClick={() => window.open(`${API_URL}/api/media/export`, '_blank')}>
                <ImportExportIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl sx={{ minWidth: 120 }}>
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
            <IconButton onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              <SortIcon sx={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />
            </IconButton>
          </Stack>
        </Box>

        {/* Tags disponibles */}
        {allTags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
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

        <Box {...getRootProps()} sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 2,
          mb: 2,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper'
        }}>
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 48, mb: 1 }} />
          <Typography>
            {isDragActive
              ? "Déposez le fichier ici..."
              : "Glissez et déposez un fichier vidéo, ou cliquez pour sélectionner"}
          </Typography>
        </Box>

        {uploading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        <Grid container spacing={2}>
          {sortedVideos.map((video) => (
            <Grid item xs={12} sm={6} md={4} key={video.name}>
              <Card>
                <CardMedia
                  component="video"
                  src={`${API_URL}${video.url}`}
                  controls
                  sx={{ height: 140 }}
                />
                <CardContent>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" noWrap>
                      {video.name}
                    </Typography>
                  </Box>

                  {/* Tags de la vidéo */}
                  <Box sx={{ mb: 1 }}>
                    {video.tags?.map(tag => (
                      <Chip
                        key={`${video.name}-${tag}`}
                        label={tag}
                        size="small"
                        onDelete={() => handleRemoveTag(video, tag)}
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>

                  {/* Interface d'édition des tags */}
                  {editingTags === video.name && (
                    <Box sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          size="small"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Nouveau tag"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newTag) {
                              e.preventDefault();
                              handleAddTag(video, newTag);
                            }
                          }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleAddTag(video, newTag)}
                          disabled={!newTag.trim()}
                        >
                          Ajouter
                        </Button>
                      </Stack>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => onSelect(video)}
                    >
                      Sélectionner
                    </Button>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Gérer les tags">
                        <IconButton
                          size="small"
                          onClick={() => setEditingTags(editingTags === video.name ? null : video.name)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteConfirmation(video)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <Dialog open={!!deleteConfirmation} onClose={() => setDeleteConfirmation(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer {deleteConfirmation?.name} ?
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
    </Dialog>
  );
}
