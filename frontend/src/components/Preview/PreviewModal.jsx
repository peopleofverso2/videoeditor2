import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Button,
  Fade,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReactPlayer from 'react-player';

const API_URL = 'http://localhost:4000';

const getFullUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_URL}${path}`;
};

const STYLES = {
  solid: {
    variant: 'contained',
    style: {},
  },
  outline: {
    variant: 'outlined',
    style: {},
  },
  gradient: {
    variant: 'contained',
    style: {
      background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
    },
  },
};

export default function PreviewModal({ open, onClose, nodes, edges }) {
  const [currentNode, setCurrentNode] = useState(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [nextNodes, setNextNodes] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);
  const closeButtonTimeoutRef = useRef(null);

  useEffect(() => {
    if (open) {
      const startNode = nodes.find(node => !edges.some(edge => edge.target === node.id));
      setCurrentNode(startNode);
      setVideoEnded(false);
      setIsPlaying(true);
    }
  }, [open, nodes, edges]);

  useEffect(() => {
    if (currentNode) {
      const outgoingEdges = edges.filter(edge => edge.source === currentNode.id);
      const nextNodeIds = outgoingEdges.map(edge => edge.target);
      const nextNodesList = nodes.filter(node => nextNodeIds.includes(node.id));
      setNextNodes(nextNodesList);

      if (videoEnded && nextNodesList.length === 1 && nextNodesList[0].type === 'videoNode') {
        setCurrentNode(nextNodesList[0]);
        setVideoEnded(false);
        setIsPlaying(true);
      }
    }
  }, [currentNode, videoEnded, edges, nodes]);

  // Gérer les raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === ' ') {
        setIsPlaying(prev => !prev);
        e.preventDefault();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyPress);
      document.documentElement.requestFullscreen();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, [open, onClose]);

  // Gérer l'affichage du bouton de fermeture
  useEffect(() => {
    const handleMouseMove = () => {
      setShowCloseButton(true);
      if (closeButtonTimeoutRef.current) {
        clearTimeout(closeButtonTimeoutRef.current);
      }
      closeButtonTimeoutRef.current = setTimeout(() => {
        setShowCloseButton(false);
      }, 2000);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (closeButtonTimeoutRef.current) {
        clearTimeout(closeButtonTimeoutRef.current);
      }
    };
  }, []);

  const handleNodeClick = (node) => {
    if (node.type === 'buttonNode') {
      const connectedEdges = edges.filter(edge => edge.source === node.id);
      const nextNodeIds = connectedEdges.map(edge => edge.target);
      const nextNode = nodes.find(n => nextNodeIds.includes(n.id));
      if (nextNode) {
        setCurrentNode(nextNode);
        setVideoEnded(false);
        setIsPlaying(true);
      }
    } else {
      setCurrentNode(node);
      setVideoEnded(false);
      setIsPlaying(true);
    }
  };

  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  const getButtonStyle = (nodeStyle = {}) => {
    const style = STYLES[nodeStyle.variant || 'solid'];
    return {
      variant: style.variant,
      sx: {
        px: 4,
        py: 2,
        fontSize: nodeStyle.fontSize || '1.1rem',
        fontWeight: 500,
        minWidth: '200px',
        transition: 'all 0.2s ease',
        backgroundColor: nodeStyle.color,
        '&:hover': {
          transform: 'translateY(-2px)',
          backgroundColor: nodeStyle.color ? `${nodeStyle.color}dd` : undefined,
        },
        ...style.style,
      },
    };
  };

  if (!currentNode || currentNode.type !== 'videoNode') return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      aria-labelledby="video-preview-title"
      keepMounted={false}
      disablePortal={false}
      disableEnforceFocus
      container={document.body}
      PaperProps={{
        sx: {
          height: '100vh',
          width: '100vw',
          margin: 0,
          maxWidth: 'none',
          bgcolor: 'black',
          '& .MuiDialogContent-root': {
            padding: 0,
          },
        },
      }}
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'black',
        },
      }}
    >
      <Box 
        ref={playerContainerRef}
        sx={{ 
          position: 'relative',
          height: '100vh',
          width: '100vw',
          bgcolor: 'black',
          overflow: 'hidden',
        }}
        role="presentation"
        tabIndex={-1}
      >
        <Fade in={showCloseButton}>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 2,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
              },
              padding: '8px',
              transition: 'all 0.2s ease-in-out',
              opacity: showCloseButton ? 0.7 : 0,
            }}
            aria-label="Fermer la vidéo"
            tabIndex={0}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Fade>

        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0,
            height: '100%',
            width: '100%',
            overflow: 'hidden',
            bgcolor: 'black',
            position: 'relative',
          }}
        >
          <ReactPlayer
            ref={playerRef}
            key={currentNode.id}
            url={getFullUrl(currentNode.data.videoUrl)}
            width="100%"
            height="100%"
            playing={isPlaying}
            controls={false}
            onEnded={handleVideoEnd}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload',
                  style: { 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  },
                },
              },
            }}
          />

          <Fade in={videoEnded && nextNodes.length > 0}>
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                p: 3,
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0) 100%)',
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                zIndex: 1,
              }}
            >
              {nextNodes.map((node) => {
                const buttonStyle = getButtonStyle(node.data?.style);
                return (
                  <Button
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    {...buttonStyle}
                  >
                    {node.data.label}
                  </Button>
                );
              })}
            </Box>
          </Fade>
        </DialogContent>
      </Box>
    </Dialog>
  );
}
