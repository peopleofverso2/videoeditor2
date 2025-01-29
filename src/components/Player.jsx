import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

function Player({ nodes, edges, startNodeId }) {
  const [currentNodeId, setCurrentNodeId] = useState(startNodeId);
  const [videoUrl, setVideoUrl] = useState(null);
  const [choices, setChoices] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const findNodeById = useCallback((id) => {
    return nodes.find(node => node.id === id);
  }, [nodes]);

  const findOutgoingEdges = useCallback((nodeId) => {
    return edges.filter(edge => edge.source === nodeId);
  }, [edges]);

  const handleChoiceClick = useCallback((targetId) => {
    setCurrentNodeId(targetId);
    setIsPlaying(true);
  }, []);

  const handleVideoEnd = useCallback(() => {
    const outgoingEdges = findOutgoingEdges(currentNodeId);
    if (outgoingEdges.length === 1) {
      setCurrentNodeId(outgoingEdges[0].target);
      setIsPlaying(true);
    } else if (outgoingEdges.length > 1) {
      setIsPlaying(false);
    }
  }, [currentNodeId, findOutgoingEdges]);

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleFullscreen = useCallback(async () => {
    if (!isFullscreen) {
      try {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error entering fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Error exiting fullscreen:', err);
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!currentNodeId) return;

    const currentNode = findNodeById(currentNodeId);
    if (!currentNode) return;

    if (currentNode.type === 'video' && currentNode.data?.videoUrl) {
      setVideoUrl(currentNode.data.videoUrl);
      const outgoingEdges = findOutgoingEdges(currentNodeId);
      const nextNodes = outgoingEdges.map(edge => ({
        id: edge.target,
        node: findNodeById(edge.target)
      })).filter(({ node }) => node);
      
      setChoices(nextNodes);
    }
  }, [currentNodeId, findNodeById, findOutgoingEdges]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      {videoUrl && (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto'
            }}
            autoPlay={isPlaying}
            onEnded={handleVideoEnd}
          />
          
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              bgcolor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <IconButton onClick={togglePlayPause} sx={{ color: 'white' }}>
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {choices.length > 1 && !isPlaying && (
                choices.map(({ id, node }) => (
                  <Box
                    key={id}
                    onClick={() => handleChoiceClick(id)}
                    sx={{
                      px: 2,
                      py: 1,
                      bgcolor: 'primary.main',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }}
                  >
                    <Typography variant="button" sx={{ color: 'white' }}>
                      {node.data?.label || 'Next'}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>

            <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  );
}

export default Player;
