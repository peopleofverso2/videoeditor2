import React, { memo } from 'react';
import { Handle } from 'reactflow';
import { Card, CardContent, CardMedia, Typography, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';

const VideoNode = ({ data, isConnectable }) => {
  return (
    <Card sx={{ maxWidth: 345, bgcolor: 'background.paper' }}>
      <CardMedia
        component="video"
        height="140"
        src={data.videoUrl}
        controls
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {data.label}
        </Typography>
        <IconButton 
          size="small" 
          onClick={data.onPlay}
          sx={{ mr: 1 }}
        >
          <PlayArrowIcon />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={data.onDelete}
        >
          <DeleteIcon />
        </IconButton>
      </CardContent>
      <Handle
        type="target"
        position="left"
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position="right"
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
    </Card>
  );
};

export default memo(VideoNode);
