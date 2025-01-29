import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Button,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import ReactPlayer from 'react-player';

const API_URL = 'http://localhost:4000';

const getFullUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_URL}${path}`;
};

export default function PreviewModal({ open, onClose, nodes, edges }) {
  const [currentNode, setCurrentNode] = useState(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [nextNodes, setNextNodes] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);

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
      // Trouver les nœuds directement connectés
      const outgoingEdges = edges.filter(edge => edge.source === currentNode.id);
      const nextNodeIds = outgoingEdges.map(edge => edge.target);
      const nextNodesList = nodes.filter(node => nextNodeIds.includes(node.id));
      setNextNodes(nextNodesList);

      // Enchaînement automatique si un seul nœud vidéo suivant
      if (videoEnded && nextNodesList.length === 1 && nextNodesList[0].type === 'videoNode') {
        setCurrentNode(nextNodesList[0]);
        setVideoEnded(false);
        setIsPlaying(true);
      }
    }
  }, [currentNode, videoEnded, edges, nodes]);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    setIsPlaying(false);
  };

  const handleNodeClick = (node) => {
    // Si c'est un bouton, trouver la vidéo liée
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

  if (!currentNode || currentNode.type !== 'videoNode') return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          bgcolor: 'background.paper',
        },
      }}
    >
      <Box sx={{ position: 'absolute', right: 8, top: 8, zIndex: 2 }}>
        <IconButton onClick={onClose} color="inherit">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 0,
          overflow: 'hidden',
          bgcolor: 'black',
          position: 'relative',
        }}
      >
        <ReactPlayer
          key={currentNode.id}
          url={getFullUrl(currentNode.data.videoUrl)}
          width="100%"
          height="100%"
          playing={isPlaying}
          controls={true}
          onEnded={handleVideoEnd}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload',
              },
            },
          }}
        />

        {/* Boutons de navigation qui apparaissent à la fin de la vidéo */}
        {videoEnded && nextNodes.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 3,
              bgcolor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              zIndex: 1,
            }}
          >
            {nextNodes.map((node) => (
              <Button
                key={node.id}
                variant="contained"
                size="large"
                onClick={() => handleNodeClick(node)}
                sx={{
                  px: 4,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  minWidth: '200px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {node.data.label}
              </Button>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
