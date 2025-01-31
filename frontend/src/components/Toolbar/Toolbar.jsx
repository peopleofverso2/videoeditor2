import React from 'react';
import {
  AppBar,
  Toolbar as MuiToolbar,
  IconButton,
  Button,
  Box,
  Tooltip,
  Typography
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  FolderOpen as FolderIcon,
  VideoLibrary as VideoLibraryIcon,
  SmartButton as ButtonIcon
} from '@mui/icons-material';

const Toolbar = ({
  onSave,
  onImport,
  onPlay,
  onUndo,
  onRedo,
  onOpenProjects,
  canUndo,
  canRedo,
  projectId
}) => {
  const fileInputRef = React.createRef();

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
    <AppBar position="static" color="default">
      <MuiToolbar variant="dense">
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Tooltip title="Ouvrir les projets">
            <IconButton onClick={onOpenProjects} size="large">
              <FolderIcon />
            </IconButton>
          </Tooltip>

          <Typography variant="subtitle1" sx={{ ml: 2, flexGrow: 1 }}>
            {projectId ? 'Projet en cours' : 'Aucun projet sélectionné'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Annuler">
              <span>
                <IconButton
                  onClick={onUndo}
                  disabled={!canUndo || !projectId}
                >
                  <UndoIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Rétablir">
              <span>
                <IconButton
                  onClick={onRedo}
                  disabled={!canRedo || !projectId}
                >
                  <RedoIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Sauvegarder">
              <span>
                <IconButton
                  onClick={onSave}
                  disabled={!projectId}
                >
                  <SaveIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Importer">
              <span>
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!projectId}
                >
                  <UploadIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Lancer la prévisualisation">
              <span>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={onPlay}
                  disabled={!projectId}
                  startIcon={<PlayIcon />}
                >
                  Prévisualiser
                </Button>
              </span>
            </Tooltip>

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
          </Box>
        </Box>
      </MuiToolbar>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pov"
        style={{ display: 'none' }}
      />
    </AppBar>
  );
};

export default Toolbar;
