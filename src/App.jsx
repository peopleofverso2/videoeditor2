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
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          p: 1,
          bgcolor: 'rgba(0, 47, 167, 0.95)',
          color: 'white',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="h6" sx={{ flexGrow: 1, pl: 2, textAlign: 'center' }}>
            Éditeur de Vidéo Interactive
          </Typography>
        </Box>

        <Box sx={{ 
          flexGrow: 1,
          p: isPlayMode ? 0 : 2,
          pt: isPlayMode ? 0 : 6,
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
