import React from 'react';
import { Handle } from 'reactflow';
import { Box, Typography, TextField } from '@mui/material';

const DimensionsNode = ({ data }) => {
  return (
    <Box
      sx={{
        background: '#fff',
        padding: 2,
        borderRadius: 1,
        border: '1px solid #ddd',
        minWidth: 200,
      }}
    >
      <Handle type="target" position="left" />
      <Typography variant="subtitle1" gutterBottom>
        {data.label || 'Dimensions'}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          label="Width"
          type="number"
          size="small"
          defaultValue={1920}
          InputProps={{ inputProps: { min: 1 } }}
          sx={{ width: '50%' }}
        />
        <TextField
          label="Height"
          type="number"
          size="small"
          defaultValue={1080}
          InputProps={{ inputProps: { min: 1 } }}
          sx={{ width: '50%' }}
        />
      </Box>
      <Handle type="source" position="right" />
    </Box>
  );
};

export default DimensionsNode;
