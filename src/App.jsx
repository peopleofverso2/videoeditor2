import React, { useState, useCallback } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import NodeEditor from './components/NodeEditor';
import Player from './components/Player';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [startNodeId, setStartNodeId] = useState(null);
  const [isPlayMode, setIsPlayMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleNodesChange = useCallback((changes) => {
    setNodes(nds => changes);
  }, []);

  const handleEdgesChange = useCallback((changes) => {
    setEdges(eds => changes);
  }, []);

  const handleSave = useCallback(() => {
    const data = { nodes, edges, startNodeId };
    localStorage.setItem('video-editor-state', JSON.stringify(data));
  }, [nodes, edges, startNodeId]);

  const handleLoad = useCallback(() => {
    const savedData = localStorage.getItem('video-editor-state');
    if (savedData) {
      const { nodes: savedNodes, edges: savedEdges, startNodeId: savedStartId } = JSON.parse(savedData);
      setNodes(savedNodes);
      setEdges(savedEdges);
      setStartNodeId(savedStartId);
    }
  }, []);

  const togglePlayMode = useCallback(() => {
    if (!startNodeId && !isPlayMode) {
      alert('Veuillez sélectionner un nœud de départ avant de passer en mode lecture');
      return;
    }
    setIsPlayMode(!isPlayMode);
  }, [isPlayMode, startNodeId]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  return (
    <ReactFlowProvider>
      <Box sx={{ 
        flexGrow: 1,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isPlayMode ? '#000' : 'background.default'
      }}>
        <AppBar 
          position="static" 
          sx={{ 
            bgcolor: isPlayMode ? 'transparent' : 'primary.main',
            boxShadow: isPlayMode ? 'none' : undefined
          }}
        >
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {isPlayMode ? '' : 'Éditeur de Vidéo Interactive'}
            </Typography>
            {!isPlayMode && (
              <>
                <Button color="inherit" onClick={handleSave}>
                  Sauvegarder
                </Button>
                <Button color="inherit" onClick={handleLoad}>
                  Charger
                </Button>
              </>
            )}
            <Button color="inherit" onClick={togglePlayMode}>
              {isPlayMode ? 'Mode Édition' : 'Mode Lecture'}
            </Button>
            {isPlayMode && (
              <IconButton 
                color="inherit" 
                onClick={toggleFullscreen}
                sx={{ ml: 1 }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            )}
          </Toolbar>
        </AppBar>

        <Box sx={{ 
          flexGrow: 1,
          p: isPlayMode ? 0 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Box sx={{ width: '100%', height: '100%' }}>
            {isPlayMode ? (
              <Player
                nodes={nodes}
                edges={edges}
                startNodeId={startNodeId}
              />
            ) : (
              <NodeEditor
                initialNodes={nodes}
                initialEdges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onStartNodeSelect={setStartNodeId}
              />
            )}
          </Box>
        </Box>
      </Box>
    </ReactFlowProvider>
  );
}

export default App;
