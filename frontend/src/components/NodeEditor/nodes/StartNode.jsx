import React from 'react';
import { Handle } from 'reactflow';
import { Box } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

const StartNode = () => {
  return (
    <Box
      sx={{
        bgcolor: '#4CAF50',
        color: 'white',
        borderRadius: '50%',
        width: 60,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      <PlayCircleOutlineIcon sx={{ fontSize: 32 }} />
      <Handle
        type="source"
        position="right"
        style={{ background: '#fff' }}
      />
    </Box>
  );
};

export default StartNode;
