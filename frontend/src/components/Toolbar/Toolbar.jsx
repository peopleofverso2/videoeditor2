import React, { useRef } from 'react';
import {
  AppBar,
  Toolbar as MuiToolbar,
  IconButton,
  Button,
  Tooltip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Upload as UploadIcon,
  PlayArrow as PlayIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  VideoCall as VideoIcon,
  SmartButton as ButtonIcon,
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

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.pov')) {
      onImport(file);
    } else {
      alert('Veuillez sélectionner un fichier .pov valide');
    }
    event.target.value = null; // Reset pour permettre de sélectionner le même fichier
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <MuiToolbar variant="dense">
        <Stack
          direction="row"
          spacing={2}
          divider={<Divider orientation="vertical" flexItem />}
          alignItems="center"
        >
          {/* Actions principales */}
          <Stack direction="row" spacing={1}>
            <Tooltip title="Sauvegarder le projet (.pov)">
              <IconButton onClick={onSave}>
                <SaveIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Importer un projet (.pov)">
              <IconButton onClick={handleImportClick}>
                <UploadIcon />
              </IconButton>
            </Tooltip>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pov"
              onChange={handleFileChange}
            />
            
            <Tooltip title="Lancer la prévisualisation">
              <IconButton onClick={onPlay} color="primary">
                <PlayIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Undo/Redo */}
          <Stack direction="row" spacing={1}>
            <Tooltip title="Annuler">
              <span>
                <IconButton onClick={onUndo} disabled={!canUndo}>
                  <UndoIcon />
                </IconButton>
              </span>
            </Tooltip>
            
            <Tooltip title="Rétablir">
              <span>
                <IconButton onClick={onRedo} disabled={!canRedo}>
                  <RedoIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          {/* Ajout de nœuds */}
          <Stack direction="row" spacing={1}>
            <Tooltip title="Ajouter une vidéo">
              <Button
                variant="outlined"
                startIcon={<VideoIcon />}
                draggable
                onDragStart={(e) => onDragStart(e, 'videoNode')}
              >
                VIDÉO
              </Button>
            </Tooltip>
            
            <Tooltip title="Ajouter un bouton">
              <Button
                variant="outlined"
                startIcon={<ButtonIcon />}
                draggable
                onDragStart={(e) => onDragStart(e, 'buttonNode')}
              >
                BOUTON
              </Button>
            </Tooltip>
          </Stack>
        </Stack>
      </MuiToolbar>
    </AppBar>
  );
}
