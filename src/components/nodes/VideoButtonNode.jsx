import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, Typography, Button, Box, IconButton, Dialog, TextField, Slider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

function VideoButtonNode({ data, isConnectable }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [interactions, setInteractions] = useState(data.interactions || []);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
        
        // Check for interactions at current time
        interactions.forEach(interaction => {
          if (Math.abs(video.currentTime - interaction.time) < 0.1 && isPlaying) {
            video.pause();
            setIsPlaying(false);
          }
        });
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', () => setDuration(video.duration));

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [interactions, isPlaying]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      data.onChange?.({
        ...data,
        videoUrl: url,
        label: file.name,
        interactions
      });
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const addInteraction = (time) => {
    const newInteraction = {
      id: `int_${Date.now()}`,
      time,
      title: 'New Choice',
      options: [
        { id: `opt1_${Date.now()}`, text: 'Option 1', targetNodeId: '' },
        { id: `opt2_${Date.now()}`, text: 'Option 2', targetNodeId: '' }
      ]
    };
    
    const updatedInteractions = [...interactions, newInteraction];
    setInteractions(updatedInteractions);
    data.onChange?.({
      ...data,
      interactions: updatedInteractions
    });
  };

  const updateInteraction = (id, updates) => {
    const updatedInteractions = interactions.map(interaction =>
      interaction.id === id ? { ...interaction, ...updates } : interaction
    );
    setInteractions(updatedInteractions);
    data.onChange?.({
      ...data,
      interactions: updatedInteractions
    });
  };

  const handleOptionClick = (targetNodeId) => {
    if (targetNodeId && data.onNavigateToNode) {
      data.onNavigateToNode(targetNodeId);
    }
  };

  // Get all options from all interactions
  const allOptions = interactions.flatMap(interaction => interaction.options);

  return (
    <Card sx={{ width: 320 }}>
      <Handle 
        type="target" 
        position={Position.Top} 
        isConnectable={isConnectable}
      />
      <Box sx={{ position: 'relative' }}>
        {data.videoUrl ? (
          <>
            <video
              ref={videoRef}
              style={{ width: '100%', display: 'block' }}
              onEnded={() => setIsPlaying(false)}
            >
              <source src={data.videoUrl} type="video/mp4" />
            </video>
            
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0,0,0,0.7)',
              p: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <IconButton 
                  size="small" 
                  onClick={handlePlayPause}
                  sx={{ color: 'white' }}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <Slider
                  size="small"
                  value={currentTime}
                  max={duration}
                  onChange={(_, value) => {
                    videoRef.current.currentTime = value;
                    setCurrentTime(value);
                  }}
                  sx={{ 
                    mx: 1,
                    color: 'white',
                    '& .MuiSlider-thumb': {
                      width: 12,
                      height: 12
                    }
                  }}
                />
                <Typography variant="caption" sx={{ color: 'white', minWidth: 60 }}>
                  {Math.floor(currentTime)}s / {Math.floor(duration)}s
                </Typography>
              </Box>
            </Box>

            {/* Interaction markers on timeline */}
            {interactions.map((interaction) => (
              <Box
                key={interaction.id}
                sx={{
                  position: 'absolute',
                  bottom: 30,
                  left: `${(interaction.time / duration) * 100}%`,
                  width: 4,
                  height: 4,
                  bgcolor: 'primary.main',
                  borderRadius: '50%',
                  transform: 'translateX(-50%)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  videoRef.current.currentTime = interaction.time;
                  setCurrentTime(interaction.time);
                }}
              />
            ))}

            {/* Active interaction overlay */}
            {interactions.map(interaction => {
              const isActive = Math.abs(currentTime - interaction.time) < 0.1;
              return isActive && (
                <Box
                  key={interaction.id}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ color: 'white', mb: 2, textAlign: 'center' }}
                  >
                    {interaction.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, position: 'relative' }}>
                    {interaction.options.map((option) => (
                      <Button
                        key={option.id}
                        variant="contained"
                        onClick={() => handleOptionClick(option.targetNodeId)}
                      >
                        {option.text}
                      </Button>
                    ))}
                  </Box>
                </Box>
              );
            })}

            {/* Connection handles for all options */}
            <Box sx={{ 
              position: 'absolute', 
              right: -8, 
              top: 0, 
              bottom: 0, 
              width: 16,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '0 4px 4px 0'
            }}>
              {allOptions.map((option, index) => (
                <Handle
                  key={option.id}
                  type="source"
                  position={Position.Right}
                  id={option.id}
                  style={{
                    top: `${(index + 1) * (100 / (allOptions.length + 1))}%`,
                    transform: 'translateY(-50%)',
                    background: '#1976d2',
                    width: '12px',
                    height: '12px',
                    border: '2px solid white'
                  }}
                  isConnectable={isConnectable}
                />
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

            <IconButton
              sx={{
                position: 'absolute',
                top: 8,
                right: 48,
                bgcolor: 'rgba(255,255,255,0.8)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
              }}
              onClick={() => addInteraction(currentTime)}
            >
              <AddIcon />
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
              Click to add video
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
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
            Edit Interactions
          </Typography>
          
          {interactions.map((interaction) => (
            <Box key={interaction.id} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Interaction at {interaction.time.toFixed(1)}s
              </Typography>
              
              <TextField
                fullWidth
                label="Title"
                value={interaction.title}
                onChange={(e) => updateInteraction(interaction.id, { title: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              {interaction.options.map((option) => (
                <Box key={option.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      Option Connection Point: {option.id}
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    label="Option Text"
                    value={option.text}
                    onChange={(e) => {
                      const newOptions = interaction.options.map(opt =>
                        opt.id === option.id ? { ...opt, text: e.target.value } : opt
                      );
                      updateInteraction(interaction.id, { options: newOptions });
                    }}
                  />
                </Box>
              ))}
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

export default VideoButtonNode;
