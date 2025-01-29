import React, { useState, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, Typography, Button, Box, IconButton, Dialog, TextField, Slider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import Opacity from '@mui/icons-material/Opacity';

function ImageButtonNode({ data }) {
  const [showEditor, setShowEditor] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(data.overlayOpacity || 0.5);
  const [buttonOpacity, setButtonOpacity] = useState(data.buttonOpacity || 1);
  const [buttons, setButtons] = useState(data.buttons || [
    { id: 'btn1', text: 'Option 1', targetNodeId: '', color: '#1976d2' },
    { id: 'btn2', text: 'Option 2', targetNodeId: '', color: '#2e7d32' },
    { id: 'btn3', text: 'Option 3', targetNodeId: '', color: '#d32f2f' }
  ]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      data.onChange?.({
        ...data,
        imageUrl: url,
        label: file.name,
        buttons,
        overlayOpacity,
        buttonOpacity
      });
    }
  };

  const handleButtonClick = (targetNodeId) => {
    if (targetNodeId && data.onNavigateToNode) {
      data.onNavigateToNode(targetNodeId);
    }
  };

  const updateButtons = (newButtons) => {
    setButtons(newButtons);
    data.onChange?.({
      ...data,
      buttons: newButtons,
      overlayOpacity,
      buttonOpacity
    });
  };

  const handleOpacityChange = (type, value) => {
    if (type === 'overlay') {
      setOverlayOpacity(value);
    } else {
      setButtonOpacity(value);
    }
    data.onChange?.({
      ...data,
      buttons,
      overlayOpacity: type === 'overlay' ? value : overlayOpacity,
      buttonOpacity: type === 'button' ? value : buttonOpacity
    });
  };

  // Calculate handle positions based on number of buttons
  const getHandlePosition = (index) => {
    const step = 1 / (buttons.length + 1);
    return (index + 1) * step;
  };

  return (
    <Card sx={{ width: 320 }}>
      <Handle type="target" position={Position.Top} />
      <Box sx={{ position: 'relative' }}>
        {data.imageUrl ? (
          <>
            <img
              src={data.imageUrl}
              alt={data.label}
              style={{ width: '100%', display: 'block' }}
            />
            
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: `rgba(0,0,0,${overlayOpacity})`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              p: 2
            }}>
              {buttons.map((button, index) => (
                <Box key={button.id} sx={{ width: '100%', position: 'relative' }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleButtonClick(button.targetNodeId)}
                    sx={{ 
                      bgcolor: button.color,
                      opacity: buttonOpacity,
                      '&:hover': {
                        bgcolor: button.color,
                        filter: 'brightness(0.9)'
                      }
                    }}
                  >
                    {button.text}
                  </Button>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`handle-${button.id}`}
                    style={{
                      right: -8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: button.color
                    }}
                  />
                </Box>
              ))}
            </Box>

            <IconButton
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(255,255,255,0.8)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
              }}
              onClick={() => setShowEditor(true)}
            >
              <EditIcon />
            </IconButton>
          </>
        ) : (
          <Box
            sx={{
              height: 180,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f5f5f5',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Typography variant="body2" color="textSecondary">
              Click to add image
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </Box>
        )}
      </Box>

      <Dialog 
        open={showEditor} 
        onClose={() => setShowEditor(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Edit Buttons
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Opacity sx={{ mr: 1 }} /> Opacity Settings
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Background Overlay Opacity
              </Typography>
              <Slider
                value={overlayOpacity}
                min={0}
                max={1}
                step={0.1}
                onChange={(_, value) => handleOpacityChange('overlay', value)}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => Math.round(value * 100) + '%'}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Buttons Opacity
              </Typography>
              <Slider
                value={buttonOpacity}
                min={0}
                max={1}
                step={0.1}
                onChange={(_, value) => handleOpacityChange('button', value)}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => Math.round(value * 100) + '%'}
              />
            </Box>
          </Box>
          
          {buttons.map((button, index) => (
            <Box key={button.id} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                Button {index + 1}
                <Box 
                  sx={{ 
                    ml: 1,
                    px: 1,
                    bgcolor: 'grey.200',
                    borderRadius: 1,
                    fontSize: '0.8em'
                  }}
                >
                  ID: handle-{button.id}
                </Box>
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label="Button Text"
                  value={button.text}
                  onChange={(e) => {
                    const newButtons = [...buttons];
                    newButtons[index] = { ...button, text: e.target.value };
                    updateButtons(newButtons);
                  }}
                  fullWidth
                />
                <TextField
                  label="Color"
                  type="color"
                  value={button.color}
                  onChange={(e) => {
                    const newButtons = [...buttons];
                    newButtons[index] = { ...button, color: e.target.value };
                    updateButtons(newButtons);
                  }}
                  sx={{ width: 100 }}
                />
              </Box>
            </Box>
          ))}
          
          <Button 
            variant="contained" 
            onClick={() => setShowEditor(false)}
            sx={{ mt: 2 }}
          >
            Done
          </Button>
        </Box>
      </Dialog>
    </Card>
  );
}

export default ImageButtonNode;
