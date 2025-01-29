import React, { useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  ClickAwayListener,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  Slider,
  Stack,
} from '@mui/material';
import {
  FormatSize,
  Palette,
  Style,
} from '@mui/icons-material';

const COLORS = [
  '#1976d2', // blue (default)
  '#2e7d32', // green
  '#d32f2f', // red
  '#ed6c02', // orange
  '#9c27b0', // purple
  '#000000', // black
];

const FONT_SIZES = {
  small: '0.9rem',
  medium: '1rem',
  large: '1.2rem',
};

const STYLES = {
  solid: {
    bgcolor: 'primary.main',
    color: 'white',
  },
  outline: {
    bgcolor: 'transparent',
    border: 2,
    borderColor: 'primary.main',
    color: 'primary.main',
  },
  gradient: {
    background: 'linear-gradient(45deg, primary.dark 30%, primary.main 90%)',
    color: 'white',
  },
};

export default function ButtonNode({ id, data, isConnectable, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || 'Cliquez ici');
  const [anchorEl, setAnchorEl] = useState(null);
  const [styleMenu, setStyleMenu] = useState(null);
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

  const updateStyle = useCallback((updates) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              style: {
                ...node.data.style,
                ...updates,
              },
            },
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  const handleStyleClick = (event) => {
    setStyleMenu(event.currentTarget);
  };

  const handleStyleClose = () => {
    setStyleMenu(null);
  };

  const handleStyleSelect = (style) => {
    updateStyle({ variant: style });
    handleStyleClose();
  };

  const currentStyle = data.style || {};
  const buttonStyle = {
    ...(STYLES[currentStyle.variant || 'solid']),
    fontSize: currentStyle.fontSize || FONT_SIZES.medium,
    bgcolor: currentStyle.color || '#1976d2',
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
        <Stack direction="row" spacing={1} mb={1} justifyContent="flex-end">
          <IconButton size="small" onClick={handleStyleClick}>
            <Style fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <Palette fontSize="small" />
          </IconButton>
        </Stack>

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
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
              ...buttonStyle,
            }}
          >
            <Typography 
              variant="button" 
              sx={{ 
                fontSize: buttonStyle.fontSize,
                fontWeight: 500,
              }}
            >
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

      {/* Menu de style */}
      <Menu
        anchorEl={styleMenu}
        open={Boolean(styleMenu)}
        onClose={handleStyleClose}
      >
        <MenuItem onClick={() => handleStyleSelect('solid')}>Plein</MenuItem>
        <MenuItem onClick={() => handleStyleSelect('outline')}>Contour</MenuItem>
        <MenuItem onClick={() => handleStyleSelect('gradient')}>Dégradé</MenuItem>
      </Menu>

      {/* Popover de couleur */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle2">Couleur</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: 200 }}>
              {COLORS.map((color) => (
                <Box
                  key={color}
                  onClick={() => {
                    updateStyle({ color });
                    setAnchorEl(null);
                  }}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: color,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: currentStyle.color === color ? '2px solid black' : '1px solid rgba(0,0,0,0.1)',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                />
              ))}
            </Box>
            <Typography variant="subtitle2">Taille du texte</Typography>
            <Slider
              size="small"
              defaultValue={1}
              step={0.1}
              min={0.8}
              max={1.5}
              valueLabelDisplay="auto"
              onChange={(_, value) => updateStyle({ fontSize: `${value}rem` })}
            />
          </Stack>
        </Box>
      </Popover>
    </Card>
  );
}
