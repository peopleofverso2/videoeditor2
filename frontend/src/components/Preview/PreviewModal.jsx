import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Tooltip, IconButton } from '@mui/material';
import { Close, Fullscreen, FullscreenExit, PlayArrow, Pause, Help } from '@mui/icons-material';

const API_URL = 'http://localhost:4000';

const getFullUrl = (path) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `http://localhost:4000${path}`;
};

export default function PreviewModal({ open, onClose, nodes, edges }) {
  const [currentNode, setCurrentNode] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (open) {
      const startNode = nodes.find(node => !edges.some(edge => edge.target === node.id));
      setCurrentNode(startNode);
      setIsPlaying(true);
    }
  }, [open, nodes, edges]);

  // Gestionnaire des raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!open) return;

      switch (e.key.toLowerCase()) {
        case ' ':  // Espace
        case 'k':  // YouTube style
          e.preventDefault();
          togglePlay();
          break;
        case 'f':  // Plein écran
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'escape':  // Quitter le plein écran
          if (isFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
          break;
        case 'arrowright':  // Avancer de 5 secondes
          if (videoRef.current) {
            videoRef.current.currentTime += 5;
          }
          break;
        case 'arrowleft':  // Reculer de 5 secondes
          if (videoRef.current) {
            videoRef.current.currentTime -= 5;
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          // Sélectionner un choix par numéro
          if (currentNode?.type === 'buttonNode') {
            const choices = edges.filter(edge => edge.source === currentNode.id);
            const choiceIndex = parseInt(e.key) - 1;
            if (choiceIndex < choices.length) {
              const targetNode = nodes.find(n => n.id === choices[choiceIndex].target);
              if (targetNode) {
                handleNodeClick(targetNode);
              }
            }
          }
          break;
        case 'h':
          setShowHelp(!showHelp);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open, isFullscreen, currentNode, edges, nodes]);

  const handleNodeClick = (node) => {
    // Si le nœud cible est un nœud vidéo, on le joue directement
    if (node.type === 'videoNode') {
      setCurrentNode(node);
      setIsPlaying(true);
      setVideoEnded(false);
    } else {
      // Si c'est un nœud de type bouton, on cherche la prochaine vidéo
      const nextVideoNode = edges
        .filter(edge => edge.source === node.id)
        .map(edge => nodes.find(n => n.id === edge.target))
        .find(n => n?.type === 'videoNode');

      if (nextVideoNode) {
        setCurrentNode(nextVideoNode);
        setIsPlaying(true);
        setVideoEnded(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setVideoEnded(true);
    // Trouver les nœuds suivants
    const nextNodes = edges
      .filter(edge => edge.source === currentNode?.id)
      .map(edge => nodes.find(n => n.id === edge.target))
      .filter(Boolean);

    // Si un seul nœud suivant et c'est une vidéo, passer automatiquement
    if (nextNodes.length === 1 && nextNodes[0].type === 'videoNode') {
      handleNodeClick(nextNodes[0]);
    }
  };

  const getButtonStyle = (nodeStyle = {}) => {
    // Style par défaut
    const defaultStyle = {
      backgroundColor: '#1976d2',
      color: 'white',
      hoverBackgroundColor: '#1565c0',
      fontSize: '1rem'
    };

    // Fusionner avec le style du nœud
    const style = {
      ...defaultStyle,
      ...nodeStyle
    };
    
    return {
      margin: '5px',
      backgroundColor: style.backgroundColor,
      color: style.color,
      borderRadius: '4px',
      padding: '8px 16px',
      border: 'none',
      cursor: 'pointer',
      fontSize: style.fontSize,
      minWidth: '200px',
      transition: 'all 0.2s ease-in-out',
      '&.MuiButton-root': {
        backgroundColor: style.backgroundColor,
        color: style.color,
        textTransform: 'none',
        '&:hover': {
          backgroundColor: `${style.hoverBackgroundColor} !important`,
          transform: 'scale(1.02)',
        }
      }
    };
  };

  // Fonction utilitaire pour ajuster la couleur (assombrir/éclaircir)
  const adjustColor = (color, amount) => {
    const clamp = (val) => Math.min(Math.max(val, 0), 255);
    
    // Si la couleur est au format hex
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const num = parseInt(hex, 16);
      const r = clamp(((num >> 16) & 0xFF) + amount);
      const g = clamp(((num >> 8) & 0xFF) + amount);
      const b = clamp((num & 0xFF) + amount);
      
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    // Si la couleur est au format rgb/rgba
    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbaMatch) {
      const [_, r, g, b] = rgbaMatch;
      return `rgb(${clamp(parseInt(r) + amount)}, ${clamp(parseInt(g) + amount)}, ${clamp(parseInt(b) + amount)})`;
    }
    
    return color;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="preview-modal"
      disableEnforceFocus
      disableAutoFocus
      keepMounted={false}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        style={{
          backgroundColor: 'black',
          width: isFullscreen ? '100vw' : '90vw',
          height: isFullscreen ? '100vh' : '90vh',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 'none', // Pour éviter le contour de focus par défaut
        }}
      >
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
          <Tooltip title="Afficher les raccourcis (H)">
            <IconButton
              onClick={() => setShowHelp(!showHelp)}
              sx={{ mr: 1, color: 'white' }}
            >
              <Help />
            </IconButton>
          </Tooltip>
          <Tooltip title="Plein écran (F)">
            <Button
              onClick={toggleFullscreen}
              variant="contained"
              sx={{ minWidth: 0, p: 1, backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </Button>
          </Tooltip>
          <Button
            onClick={onClose}
            variant="contained"
            sx={{ minWidth: 0, p: 1, backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <Close />
          </Button>
        </div>

        {showHelp && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              padding: '20px',
              borderRadius: '8px',
              color: 'white',
              zIndex: 2000,
              maxWidth: '400px'
            }}
          >
            <h3 style={{ marginTop: 0 }}>Raccourcis clavier</h3>
            <ul style={{ paddingLeft: '20px', marginBottom: 0 }}>
              <li>Espace / K : Lecture/Pause</li>
              <li>F : Plein écran</li>
              <li>Échap : Quitter le plein écran</li>
              <li>→ : Avancer de 5s</li>
              <li>← : Reculer de 5s</li>
              <li>1-5 : Sélectionner un choix</li>
              <li>H : Afficher/Masquer l'aide</li>
            </ul>
          </div>
        )}

        {currentNode?.type === 'videoNode' && (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <video
              ref={videoRef}
              src={getFullUrl(currentNode.data.videoUrl)}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              autoPlay={isPlaying}
              onEnded={handleVideoEnd}
            />
            <div style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '10px',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '10px',
              borderRadius: '8px'
            }}>
              <Button
                onClick={togglePlay}
                variant="contained"
                sx={{ minWidth: 0, p: 1, backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </Button>
            </div>

            {/* Afficher les boutons de choix à la fin de la vidéo */}
            {videoEnded && edges.filter(edge => edge.source === currentNode.id).length > 0 && (
              <div style={{
                position: 'absolute',
                bottom: '10%',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '30px',
                borderRadius: '12px',
                width: isFullscreen ? '80%' : '90%',
                maxWidth: '1200px',
                zIndex: 1000
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '15px',
                  width: '100%',
                  alignItems: 'stretch',
                  justifyItems: 'center'
                }}>
                  {edges
                    .filter(edge => edge.source === currentNode.id)
                    .map((edge, index) => {
                      const targetNode = nodes.find(n => n.id === edge.target);
                      return (
                        <Tooltip key={edge.id} title={`Appuyez sur ${index + 1}`}>
                          <Button
                            onClick={() => handleNodeClick(targetNode)}
                            variant="contained"
                            disableElevation
                            sx={{
                              ...getButtonStyle(targetNode.data.style || {}),
                              width: '100%',
                              height: '100%',
                              minHeight: '60px',
                              fontSize: isFullscreen ? '1.3rem' : '1.1rem',
                              padding: isFullscreen ? '16px 24px' : '12px 20px',
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              textAlign: 'left',
                              whiteSpace: 'normal',
                              lineHeight: 1.4,
                              textTransform: 'none',
                              '&.MuiButton-root': {
                                '&:hover': {
                                  backgroundColor: (targetNode.data.style?.hoverBackgroundColor || '#1565c0') + ' !important',
                                  transform: 'scale(1.02)',
                                }
                              },
                              '&:hover .choice-number': {
                                backgroundColor: 'rgba(255,255,255,0.2)',
                              },
                            }}
                          >
                            <span 
                              className="choice-number"
                              style={{ 
                                marginRight: '15px', 
                                opacity: 0.8,
                                fontSize: '0.9em',
                                backgroundColor: 'rgba(255,255,255,0.15)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                minWidth: '28px',
                                textAlign: 'center',
                                transition: 'all 0.2s ease-in-out',
                                fontWeight: 'bold',
                              }}
                            >
                              {index + 1}
                            </span>
                            <span style={{ 
                              flex: 1,
                              fontWeight: 500,
                              letterSpacing: '0.3px'
                            }}>
                              {targetNode.data.label || 'Continuer'}
                            </span>
                          </Button>
                        </Tooltip>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
