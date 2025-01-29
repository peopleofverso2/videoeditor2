import React, { useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  ClickAwayListener,
} from '@mui/material';

export default function ButtonNode({ id, data, isConnectable, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || 'Cliquez ici');
  const { setNodes } = useReactFlow();

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(data.label || 'Cliquez ici');
  };

  const handleChange = (e) => {
    setEditValue(e.target.value);
  };

  const handleSubmit = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() !== '') {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                label: editValue.trim(),
              },
            };
          }
          return node;
        })
      );
    }
  }, [editValue, id, setNodes]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Card
      sx={{
        width: 200,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: selected ? 4 : 2,
        border: selected ? '2px solid' : 'none',
        borderColor: 'primary.main',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 6,
        },
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />

      <CardContent>
        {isEditing ? (
          <ClickAwayListener onClickAway={handleSubmit}>
            <TextField
              fullWidth
              autoFocus
              value={editValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                },
              }}
            />
          </ClickAwayListener>
        ) : (
          <Box
            onDoubleClick={handleDoubleClick}
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'white',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Typography variant="button" sx={{ fontSize: '1rem', fontWeight: 500 }}>
              {data.label || 'Double-cliquez pour éditer'}
            </Typography>
          </Box>
        )}
      </CardContent>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </Card>
  );
}
