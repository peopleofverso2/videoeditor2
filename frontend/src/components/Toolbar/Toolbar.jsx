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
  SmartButton as ButtonIcon
} from '@mui/icons-material';

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
    const file = event.target.files?.[0];
    if (file) {
      await onImport(file);
      event.target.value = ''; // Reset input
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
          {/* Éléments glissables */}
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

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Annuler">
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

          <Tooltip title="Rétablir">
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

          <Tooltip title="Sauvegarder">
            <IconButton 
              onClick={onSave}
              color="primary"
              size="large"
            >
              <SaveIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Importer">
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              color="primary"
              size="large"
            >
              <UploadIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Lancer">
            <IconButton
              onClick={onPlay}
              color="primary"
              size="large"
            >
              <PlayIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pov"
          style={{ display: 'none' }}
        />
      </MuiToolbar>
    </AppBar>
  );
}
