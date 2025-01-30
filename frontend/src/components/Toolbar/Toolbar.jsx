import React, { useRef } from 'react';
import { 
  AppBar, 
  Toolbar as MuiToolbar, 
  IconButton, 
  Typography,
  Box,
  Button,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Upload as UploadIcon,
  VideoLibrary as VideoLibraryIcon,
  SmartButton as ButtonIcon,
  AddIcon,
  AutoAwesomeIcon
} from '@mui/icons-material';
import { createTablesFatalesTemplate } from '../../services/templateService';

export default function Toolbar({ 
  onSave, 
  onImport, 
  onPlay,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) {
  const fileInputRef = useRef();

  const handleFileChange = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      
      // Vérifier le type de fichier
      if (!file.name.toLowerCase().endsWith('.pov')) {
        alert('Le fichier doit avoir l\'extension .pov');
        event.target.value = '';
        return;
      }

      // Vérifier la taille du fichier (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB en octets
      if (file.size > maxSize) {
        alert('Le fichier est trop volumineux. La taille maximale est de 100MB.');
        event.target.value = '';
        return;
      }

      await onImport(file);
    } catch (error) {
      console.error('Erreur lors de la sélection du fichier:', error);
      throw error; // Propager l'erreur pour qu'elle soit gérée par le composant parent
    } finally {
      event.target.value = ''; // Reset input dans tous les cas
    }
  };

  const handleDragStart = (event, type) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <MuiToolbar>
        <Typography variant="h6" component="div" sx={{ mr: 2 }}>
          Video Editor
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          {/* Boutons de contrôle */}
          <Tooltip title="Annuler (Ctrl+Z)">
            <span>
              <IconButton 
                onClick={onUndo} 
                disabled={!canUndo}
                size="large"
              >
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Rétablir (Ctrl+Shift+Z)">
            <span>
              <IconButton 
                onClick={onRedo} 
                disabled={!canRedo}
                size="large"
              >
                <RedoIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Sauvegarder le projet">
            <IconButton onClick={onSave} size="large">
              <SaveIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Importer un projet">
            <IconButton 
              onClick={() => fileInputRef.current?.click()} 
              size="large"
            >
              <UploadIcon />
            </IconButton>
          </Tooltip>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pov"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <Tooltip title="Créer un projet vide">
            <IconButton onClick={() => {}} size="large">
              <AddIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Template: Tables Fatales">
            <IconButton onClick={() => createTablesFatalesTemplate()} size="large">
              <AutoAwesomeIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Lancer la prévisualisation">
            <IconButton onClick={onPlay} size="large">
              <PlayIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Boutons de nœuds */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<VideoLibraryIcon />}
            draggable
            onDragStart={(e) => handleDragStart(e, 'videoNode')}
          >
            Vidéo
          </Button>

          <Button
            variant="outlined"
            startIcon={<ButtonIcon />}
            draggable
            onDragStart={(e) => handleDragStart(e, 'buttonNode')}
          >
            Bouton
          </Button>
        </Box>
      </MuiToolbar>
    </AppBar>
  );
}
