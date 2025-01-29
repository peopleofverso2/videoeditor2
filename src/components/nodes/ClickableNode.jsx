import React, { useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Handle } from 'reactflow';

const ClickableNode = ({ data, id }) => {
  useEffect(() => {
    console.log('ClickableNode data:', data);
  }, [data]);

  const handleOptionChange = (optionId, newData) => {
    console.log('Changing option:', optionId, newData);
    const updatedOptions = data.options.map(option => 
      option.id === optionId ? { ...option, ...newData } : option
    );
    data.onChange({ ...data, options: updatedOptions });
  };

  return (
    <Box
      sx={{
        background: '#fff',
        padding: 2,
        borderRadius: 1,
        border: '1px solid #ddd',
        minWidth: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{ background: '#555' }}
        isConnectable={true}
      />

      <Typography variant="h6" sx={{ textAlign: 'center' }}>
        {data.label || 'Choix'}
      </Typography>

      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {data.options?.map((option, index) => {
          console.log('Rendering option:', option);
          return (
            <Box key={option.id || index} sx={{ position: 'relative', width: '100%' }}>
              <Button
                variant="contained"
                fullWidth
                sx={{
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  backgroundColor: option.color || '#1976d2',
                  '&:hover': {
                    backgroundColor: option.color ? `${option.color}dd` : '#1565c0'
                  }
                }}
                onClick={() => {
                  console.log('Option clicked in editor:', option);
                  if (data.onNavigateToNode && option.targetNodeId) {
                    data.onNavigateToNode(option.targetNodeId);
                  }
                }}
              >
                {option.text || `Option ${index + 1}`}
              </Button>
              <Handle
                type="source"
                position="right"
                id={`${id}-handle-${option.id}`}
                style={{
                  background: option.color || '#555',
                  top: '50%'
                }}
                isConnectable={true}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ClickableNode;
