import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
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
    // S'il n'y a qu'un seul choix, passer automatiquement à la vidéo suivante
    if (outgoingEdges.length === 1) {
      setCurrentNodeId(outgoingEdges[0].target);
      setIsPlaying(true);
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

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const enterFullscreen = async () => {
    if (containerRef.current) {
      try {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (containerRef.current.webkitRequestFullscreen) {
          await containerRef.current.webkitRequestFullscreen();
        } else if (containerRef.current.msRequestFullscreen) {
          await containerRef.current.msRequestFullscreen();
        }
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error attempting to enable fullscreen:', err);
      }
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.error('Error attempting to disable fullscreen:', err);
    }
  };

  useEffect(() => {
    if (!currentNodeId) return;

    const currentNode = findNodeById(currentNodeId);
    if (!currentNode) return;

    // Si c'est un nœud vidéo avec des données
    if (currentNode.type === 'videoNode' && currentNode.data.videoData) {
      // Créer un nouveau Blob à partir des données
      const blob = new Blob([currentNode.data.videoData], { type: currentNode.data.videoType });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      
      // Trouver les choix disponibles
      const outgoingEdges = findOutgoingEdges(currentNodeId);
      const availableChoices = outgoingEdges.map(edge => {
        const targetNode = findNodeById(edge.target);
        return {
          id: edge.target,
          label: targetNode?.data?.label || 'Choix'
        };
      });
      
      setChoices(availableChoices);

      // Nettoyer l'URL lors du changement de nœud
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [currentNodeId, findNodeById, findOutgoingEdges]);

  if (!startNodeId) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Veuillez sélectionner un nœud de départ</Typography>
      </Box>
    );
  }

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        gap: 2,
        p: 2
      }}
    >
      {videoUrl && (
        <Box 
          sx={{ 
            width: '100%', 
            maxWidth: 800,
            position: 'relative',
            cursor: 'pointer',
            '&:hover::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              transition: 'background-color 0.2s'
            }
          }}
          onClick={togglePlayPause}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            style={{ 
              width: '100%', 
              height: 'auto',
              backgroundColor: '#000',
              display: 'block'
            }}
            onEnded={handleVideoEnd}
          >
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
          <IconButton 
            sx={{ 
              position: 'absolute', 
              top: 10, 
              right: 10, 
              zIndex: 1 
            }}
            onClick={isFullscreen ? exitFullscreen : enterFullscreen}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Box>
      )}

      {choices.length > 1 && (
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {choices.map(choice => (
            <Button
              key={choice.id}
              variant="contained"
              onClick={() => handleChoiceClick(choice.id)}
            >
              {choice.label}
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default Player;
