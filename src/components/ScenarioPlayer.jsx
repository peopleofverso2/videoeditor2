import React, { useState, useEffect, useRef } from 'react';
import { Box, Button } from '@mui/material';

const ScenarioPlayer = ({ nodes, edges, onClose }) => {
  const [currentNode, setCurrentNode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [activeOptions, setActiveOptions] = useState(null);
  const [imageError, setImageError] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    console.log('Current Node:', currentNode);
  }, [currentNode]);

  // Trouver le nœud de départ
  useEffect(() => {
    const startNode = nodes.find(node => !edges.some(edge => edge.target === node.id));
    if (startNode) {
      console.log('Start Node:', startNode);
      setCurrentNode(startNode);
      setActiveOptions(null);
      setIsPlaying(true);
      setImageError(false);
    }
  }, [nodes, edges]);

  // Gérer le plein écran
  useEffect(() => {
    const enterFullscreen = async () => {
      if (containerRef.current) {
        try {
          if (containerRef.current.requestFullscreen) {
            await containerRef.current.requestFullscreen();
          } else if (containerRef.current.webkitRequestFullscreen) {
            await containerRef.current.webkitRequestFullscreen();
          }
        } catch (err) {
          console.error('Erreur lors du passage en plein écran:', err);
        }
      }
    };

    enterFullscreen();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && onClose) {
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onClose]);

  // Gérer la lecture vidéo
  useEffect(() => {
    if (!videoRef.current || !currentNode) return;
    if (!['videoNode', 'videoInteractiveNode'].includes(currentNode.type)) return;

    const video = videoRef.current;

    const handlePlay = async () => {
      try {
        if (isPlaying) {
          await video.play();
        } else {
          video.pause();
        }
      } catch (error) {
        console.error('Erreur de lecture vidéo:', error);
        setIsPlaying(false);
      }
    };

    handlePlay();

    // Vérifier les interactions pendant la lecture
    const checkInteractions = () => {
      if (!currentNode.data.interactions) return;

      const currentTime = video.currentTime;
      const activeInteraction = currentNode.data.interactions.find(
        int => Math.abs(currentTime - int.time) < 0.1
      );

      if (activeInteraction && !activeOptions) {
        video.pause();
        setIsPlaying(false);
        setActiveOptions(activeInteraction.options);
      }
    };

    if (currentNode.type === 'videoInteractiveNode') {
      video.addEventListener('timeupdate', checkInteractions);
      return () => {
        video.removeEventListener('timeupdate', checkInteractions);
      };
    }
  }, [currentNode, isPlaying, activeOptions]);

  // Gérer les nœuds interactifs
  useEffect(() => {
    if (!currentNode) return;

    if (['imageButtonNode', 'clickableNode'].includes(currentNode.type) && !activeOptions) {
      console.log('Interactive Node Data:', currentNode.data);
      setActiveOptions(currentNode.data.options || []);
      setIsPlaying(false);
      setImageError(false);
    }
  }, [currentNode]);

  const handleVideoEnd = () => {
    if (activeOptions) {
      setIsPlaying(false);
    } else {
      const nextEdge = edges.find(edge => edge.source === currentNode.id);
      if (nextEdge) {
        const nextNode = nodes.find(node => node.id === nextEdge.target);
        if (nextNode) {
          setCurrentNode(nextNode);
          setActiveOptions(null);
          setIsPlaying(true);
          setImageError(false);
        }
      } else {
        onClose();
      }
    }
  };

  const handleOptionClick = (targetNodeId) => {
    console.log('Option clicked, target:', targetNodeId);
    const nextNode = nodes.find(node => node.id === targetNodeId);
    if (nextNode) {
      console.log('Found next node:', nextNode);
      setCurrentNode(nextNode);
      setActiveOptions(null);
      setIsPlaying(true);
      setImageError(false);
    } else {
      console.warn('No node found with id:', targetNodeId);
    }
  };

  const handleCornerClick = (e) => {
    const now = Date.now();
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    const isInCorner = (
      (clientX < 50 && clientY < 50) ||
      (clientX > innerWidth - 50 && clientY < 50) ||
      (clientX < 50 && clientY > innerHeight - 50) ||
      (clientX > innerWidth - 50 && clientY > innerHeight - 50)
    );

    if (isInCorner) {
      if (now - lastClickTime < 300) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        onClose();
      }
      setLastClickTime(now);
    }
  };

  const handleImageError = () => {
    console.error('Erreur de chargement de l\'image:', currentNode?.data?.imageUrl);
    setImageError(true);
  };

  if (!currentNode) return null;

  const isVideoNode = ['videoNode', 'videoInteractiveNode'].includes(currentNode.type);

  return (
    <Box
      ref={containerRef}
      onClick={handleCornerClick}
      sx={{
        width: '100vw',
        height: '100vh',
        bgcolor: 'black',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        cursor: 'none'
      }}
      onMouseMove={(e) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        const isInCorner = (
          (clientX < 50 && clientY < 50) ||
          (clientX > innerWidth - 50 && clientY < 50) ||
          (clientX < 50 && clientY > innerHeight - 50) ||
          (clientX > innerWidth - 50 && clientY > innerHeight - 50)
        );
        e.currentTarget.style.cursor = isInCorner ? 'pointer' : 'none';
      }}
    >
      {isVideoNode ? (
        <video
          ref={videoRef}
          src={currentNode.data.videoUrl}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          onEnded={handleVideoEnd}
          controls={currentNode.type === 'videoNode'}
        />
      ) : currentNode.type === 'imageButtonNode' ? (
        <>
          <img
            src={currentNode.data.imageUrl}
            alt={currentNode.data.label || 'Interactive Image'}
            onError={handleImageError}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: imageError ? 'none' : 'block'
            }}
          />
          {imageError && (
            <Box
              sx={{
                color: 'white',
                textAlign: 'center',
                p: 2
              }}
            >
              Erreur de chargement de l'image
            </Box>
          )}
        </>
      ) : currentNode.type === 'clickableNode' && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            p: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2,
            maxWidth: '80%'
          }}
        >
          <Box sx={{ color: 'black', fontSize: '1.5rem', fontWeight: 'bold', mb: 2 }}>
            {currentNode.data.label || 'Faites votre choix'}
          </Box>
          {currentNode.data.options?.map((option, index) => {
            console.log('Option:', option);
            return (
              <Button
                key={option.id || index}
                variant="contained"
                onClick={() => {
                  console.log('Clicking option:', option);
                  if (option.targetNodeId) {
                    handleOptionClick(option.targetNodeId);
                  } else {
                    console.warn('No targetNodeId for option:', option);
                  }
                }}
                sx={{
                  width: '100%',
                  minWidth: '200px',
                  backgroundColor: option.color || '#1976d2',
                  '&:hover': {
                    backgroundColor: option.color ? `${option.color}dd` : '#1565c0'
                  }
                }}
              >
                {option.text || `Option ${index + 1}`}
              </Button>
            );
          })}
        </Box>
      )}

      {activeOptions && currentNode.type !== 'clickableNode' && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            p: 4,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 2
          }}
        >
          {activeOptions.map((option) => (
            <Box
              key={option.id}
              onClick={() => handleOptionClick(option.targetNodeId)}
              sx={{
                color: 'white',
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                p: 2,
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.7)'
                }
              }}
            >
              {option.text}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ScenarioPlayer;
