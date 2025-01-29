import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, Typography, Button, Box, IconButton, Dialog, TextField } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

function VideoInteractiveNode({ data, isConnectable }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [interactions, setInteractions] = useState(data.interactions || []);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Vérifier les interactions au temps actuel
      interactions.forEach(interaction => {
        if (Math.abs(video.currentTime - interaction.time) < 0.1 && isPlaying) {
          video.pause();
          setIsPlaying(false);
        }
      });
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [interactions, isPlaying]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      data.onChange?.({
        ...data,
        videoUrl: url,
        label: file.name,
        interactions: interactions
      });
    }
  };

  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        await videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Erreur de lecture vidéo:', error);
    }
  };

  const addInteraction = () => {
    if (!videoRef.current) return;

    const newInteraction = {
      id: `int_${Date.now()}`,
      time: videoRef.current.currentTime,
      options: [
        { id: 'option1', text: 'Option 1', targetNodeId: null }
      ]
    };
    
    const updatedInteractions = [...interactions, newInteraction];
    setInteractions(updatedInteractions);
    data.onChange?.({
      ...data,
      interactions: updatedInteractions
    });
  };

  const updateInteractionTime = (id, newTime) => {
    const updatedInteractions = interactions.map(interaction =>
      interaction.id === id ? { ...interaction, time: newTime } : interaction
    );
    setInteractions(updatedInteractions);
    data.onChange?.({
      ...data,
      interactions: updatedInteractions
    });
  };

  const updateOption = (interactionId, optionId, updates) => {
    const updatedInteractions = interactions.map(interaction => {
      if (interaction.id === interactionId) {
        return {
          ...interaction,
          options: interaction.options.map(option =>
            option.id === optionId ? { ...option, ...updates } : option
          )
        };
      }
      return interaction;
    });
    setInteractions(updatedInteractions);
    data.onChange?.({
      ...data,
      interactions: updatedInteractions
    });
  };

  const addOption = (interactionId) => {
    const updatedInteractions = interactions.map(interaction => {
      if (interaction.id === interactionId) {
        const optionNum = interaction.options.length + 1;
        return {
          ...interaction,
          options: [
            ...interaction.options,
            { id: `option${optionNum}`, text: `Option ${optionNum}`, targetNodeId: null }
          ]
        };
      }
      return interaction;
    });
    setInteractions(updatedInteractions);
    data.onChange?.({
      ...data,
      interactions: updatedInteractions
    });
  };

  const removeOption = (interactionId, optionId) => {
    const updatedInteractions = interactions.map(interaction => {
      if (interaction.id === interactionId) {
        return {
          ...interaction,
          options: interaction.options.filter(opt => opt.id !== optionId)
        };
      }
      return interaction;
    });
    setInteractions(updatedInteractions);
    data.onChange?.({
      ...data,
      interactions: updatedInteractions
    });
  };

  const removeInteraction = (id) => {
    const updatedInteractions = interactions.filter(int => int.id !== id);
    setInteractions(updatedInteractions);
    data.onChange?.({
      ...data,
      interactions: updatedInteractions
    });
  };

  return (
    <Card sx={{ width: 320, bgcolor: 'background.paper' }}>
      <Box sx={{ position: 'relative' }}>
        <Handle 
          type="target" 
          position={Position.Top} 
          isConnectable={isConnectable}
        />

        {/* Points de connexion pour les options */}
        {[1, 2, 3].map((num, index) => (
          <Box 
            key={`handle-${num}`}
            sx={{ 
              position: 'absolute',
              right: -8,
              top: `${25 + (index * 25)}%`,
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              height: 24,
              opacity: index < (interactions[0]?.options?.length || 0) ? 1 : 0.3
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Option {num}
            </Typography>
            <Handle
              type="source"
              position={Position.Right}
              id={`option${num}`}
              style={{
                width: 8,
                height: 8,
                background: '#1976d2',
                border: '2px solid white'
              }}
              isConnectable={isConnectable && index < (interactions[0]?.options?.length || 0)}
            />
          </Box>
        ))}

        {/* Vidéo */}
        <Box sx={{ position: 'relative' }}>
          {data.videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={data.videoUrl}
                style={{ width: '100%', display: 'block' }}
                onEnded={() => setIsPlaying(false)}
              />
              <Box sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                p: 1,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <IconButton 
                  size="small" 
                  onClick={handlePlayPause}
                  sx={{ color: 'white' }}
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <Typography variant="caption" sx={{ color: 'white' }}>
                  {Math.floor(currentTime)}s / {Math.floor(duration)}s
                </Typography>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                width: '100%',
                height: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover',
                cursor: 'pointer'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Typography>Cliquez pour ajouter une vidéo</Typography>
            </Box>
          )}
        </Box>

        {/* Liste des interactions */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1">Points d'interaction</Typography>
            <IconButton size="small" onClick={addInteraction}>
              <AddIcon />
            </IconButton>
          </Box>

          {interactions.map((interaction, index) => (
            <Box 
              key={interaction.id}
              sx={{ 
                mb: 2,
                p: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2">
                  Interaction à {Math.floor(interaction.time)}s
                </Typography>
                <Box>
                  <IconButton 
                    size="small"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = interaction.time;
                      }
                    }}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                  <IconButton 
                    size="small"
                    onClick={() => removeInteraction(interaction.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>

              {interaction.options.map((option, optIndex) => (
                <Box 
                  key={option.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1
                  }}
                >
                  <TextField
                    size="small"
                    value={option.text}
                    onChange={(e) => updateOption(interaction.id, option.id, { text: e.target.value })}
                    sx={{ flex: 1 }}
                  />
                  {optIndex === interaction.options.length - 1 && (
                    <IconButton 
                      size="small"
                      onClick={() => addOption(interaction.id)}
                      disabled={interaction.options.length >= 3}
                    >
                      <AddIcon />
                    </IconButton>
                  )}
                  {interaction.options.length > 1 && (
                    <IconButton 
                      size="small"
                      onClick={() => removeOption(interaction.id, option.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Card>
  );
}

export default VideoInteractiveNode;
