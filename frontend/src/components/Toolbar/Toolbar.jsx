import React from 'react';
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
  PlayArrow as PlayIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  VideoCall as VideoIcon,
  SmartButton as ButtonIcon,
  QuestionAnswer as InteractiveIcon,
} from '@mui/icons-material';

export default function Toolbar({ 
  onSave,
  onPlay,
  onUndo,
  onRedo,
  canUndo,
  canRedo 
}) {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
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
            <Tooltip title="Sauvegarder">
              <IconButton onClick={onSave}>
                <SaveIcon />
              </IconButton>
            </Tooltip>
            
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
                <IconButton disabled={!canUndo} onClick={onUndo}>
                  <UndoIcon />
                </IconButton>
              </span>
            </Tooltip>
            
            <Tooltip title="Rétablir">
              <span>
                <IconButton disabled={!canRedo} onClick={onRedo}>
                  <RedoIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          {/* Nœuds draggables */}
          <Stack direction="row" spacing={1}>
            <Tooltip title="Ajouter un nœud vidéo">
              <Button
                variant="outlined"
                startIcon={<VideoIcon />}
                draggable
                onDragStart={(e) => onDragStart(e, 'videoNode')}
              >
                Vidéo
              </Button>
            </Tooltip>
            
            <Tooltip title="Ajouter un nœud interactif">
              <Button
                variant="outlined"
                startIcon={<InteractiveIcon />}
                draggable
                onDragStart={(e) => onDragStart(e, 'interactiveNode')}
              >
                Interactif
              </Button>
            </Tooltip>
            
            <Tooltip title="Ajouter un bouton">
              <Button
                variant="outlined"
                startIcon={<ButtonIcon />}
                draggable
                onDragStart={(e) => onDragStart(e, 'buttonNode')}
              >
                Bouton
              </Button>
            </Tooltip>
          </Stack>
        </Stack>
      </MuiToolbar>
    </AppBar>
  );
}
