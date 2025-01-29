import React, { useState } from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

const Timeline = ({ rushes, onTimelineChange }) => {
  const [timelineRushes, setTimelineRushes] = useState([]);
  const [draggedRush, setDraggedRush] = useState(null);

  const handleDragStart = (e, rush) => {
    setDraggedRush(rush);
    e.dataTransfer.setData('text/plain', ''); // Nécessaire pour Firefox
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (!draggedRush) return;

    const newTimelineRushes = [...timelineRushes];
    
    // Si le rush vient de la bibliothèque
    if (!timelineRushes.find(r => r.id === draggedRush.id)) {
      newTimelineRushes.splice(index, 0, {
        ...draggedRush,
        timelineId: Math.random().toString(36).substr(2, 9),
        startTime: 0,
        duration: 0 // À calculer
      });
    } 
    // Si le rush est déjà dans la timeline
    else {
      const oldIndex = timelineRushes.findIndex(r => r.id === draggedRush.id);
      const [movedRush] = newTimelineRushes.splice(oldIndex, 1);
      newTimelineRushes.splice(index, 0, movedRush);
    }

    setTimelineRushes(newTimelineRushes);
    onTimelineChange(newTimelineRushes);
    setDraggedRush(null);
  };

  const handleRemoveRush = (timelineId) => {
    const newTimelineRushes = timelineRushes.filter(r => r.timelineId !== timelineId);
    setTimelineRushes(newTimelineRushes);
    onTimelineChange(newTimelineRushes);
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2,
        bgcolor: 'background.default',
        border: '1px solid',
        borderColor: 'divider',
        minHeight: 200
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>Timeline</Typography>
      
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          minHeight: 100,
          p: 1,
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '2px dashed',
          borderColor: 'divider'
        }}
      >
        {timelineRushes.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary'
            }}
          >
            <Typography>Glissez vos rushes ici pour créer votre montage</Typography>
          </Box>
        ) : (
          timelineRushes.map((rush, index) => (
            <Box
              key={rush.timelineId}
              draggable
              onDragStart={(e) => handleDragStart(e, rush)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1,
                bgcolor: 'white',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <DragIndicatorIcon sx={{ color: 'text.secondary', mr: 1 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2">{rush.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {(rush.size / (1024 * 1024)).toFixed(1)} MB
                </Typography>
              </Box>
              <IconButton 
                size="small" 
                onClick={() => handleRemoveRush(rush.timelineId)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
};

export default Timeline;
