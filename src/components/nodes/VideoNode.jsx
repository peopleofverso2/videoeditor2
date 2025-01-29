import React, { useState, useRef } from 'react';
import { Handle } from 'reactflow';
import { Card, CardContent, Typography, IconButton, Box } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AddIcon from '@mui/icons-material/Add';

function VideoNode({ data }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      data.onChange?.({
        videoUrl: url,
        label: file.name
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

  return (
    <Card sx={{ width: 320 }}>
      <Handle type="target" position="top" />
      <Box sx={{ position: 'relative' }}>
        {data.videoUrl ? (
          <>
            <video
              ref={videoRef}
              style={{ width: '100%', display: 'block' }}
              onEnded={() => setIsPlaying(false)}
              muted
            >
              <source src={data.videoUrl} type="video/mp4" />
            </video>
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0,0,0,0.5)',
              p: 1,
              display: 'flex',
              alignItems: 'center'
            }}>
              <IconButton 
                size="small" 
                onClick={handlePlayPause}
                sx={{ color: 'white' }}
              >
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
              <Typography 
                variant="caption" 
                sx={{ color: 'white', ml: 1, flexGrow: 1 }}
              >
                {data.label}
              </Typography>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              height: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f5f5f5',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <IconButton>
              <AddIcon />
            </IconButton>
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
      <Handle type="source" position="bottom" />
    </Card>
  );
}

export default VideoNode;
