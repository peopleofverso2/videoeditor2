import React, { useState, useCallback, useRef } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import UploadIcon from '@mui/icons-material/Upload';
import NodeEditor from './components/NodeEditor';
import Player from './components/Player';
import { ReactFlowProvider } from 'reactflow';
import { exportToPOVWithMedia, exportProjectWithMedia, importProjectFromZip } from './services/exportService';
import 'reactflow/dist/style.css';

function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isPlayMode, setIsPlayMode] = useState(false);
  const [startNodeId, setStartNodeId] = useState(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const fileInputRef = useRef(null);

  const handleExportClick = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExportPOV = useCallback(() => {
    handleExportClose();
    exportToPOVWithMedia(nodes, edges)
      .then(success => {
        if (success) {
          alert('Projet exporté avec succès au format POV avec les médias !');
        } else {
          alert('Échec de l\'export. Vérifiez la console pour plus de détails.');
        }
      });
  }, [nodes, edges]);

  const handleExportWithMedia = useCallback(() => {
    handleExportClose();
    exportProjectWithMedia(nodes, edges)
      .then(success => {
        if (success) {
          alert('Projet exporté avec succès avec tous les fichiers médias !');
        } else {
          alert('Échec de l\'export. Vérifiez la console pour plus de détails.');
        }
      });
  }, [nodes, edges]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { nodes: importedNodes, edges: importedEdges, startNodeId: importedStartId } = await importProjectFromZip(file);
        setNodes(importedNodes);
        setEdges(importedEdges);
        setStartNodeId(importedStartId);
        alert('Projet importé avec succès !');
      } catch (error) {
        console.error('Erreur d\'importation:', error);
        alert('Échec de l\'importation. Vérifiez la console pour plus de détails.');
      }
    }
    event.target.value = '';
  };

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection) => {
    setEdges((eds) => addEdge(connection, eds));
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
    } else {
      document.exitFullscreen();
    }
  }, []);

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      bgcolor: 'background.default'
    }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Éditeur de Vidéo Interactive
          </Typography>
          <Button 
            color="inherit"
            onClick={handleSave}
          >
            Enregistrer
          </Button>
          <Button 
            color="inherit"
            onClick={handleLoad}
          >
            Charger
          </Button>
          <Button 
            color="inherit"
            onClick={handleImportClick}
            startIcon={<UploadIcon />}
          >
            Importer
          </Button>
          <Button 
            color="inherit" 
            onClick={handleExportClick}
            startIcon={<SaveAltIcon />}
          >
            Exporter
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={handleExportPOV}>Exporter en POV avec médias</MenuItem>
            <MenuItem onClick={handleExportWithMedia}>Exporter avec tous les fichiers médias</MenuItem>
          </Menu>
          <Button 
            color="inherit" 
            onClick={togglePlayMode}
          >
            {isPlayMode ? 'Mode Édition' : 'Mode Lecture'}
          </Button>
          <IconButton 
            color="inherit" 
            onClick={toggleFullscreen}
          >
            <FullscreenIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, position: 'relative' }}>
        {isPlayMode ? (
          <Player nodes={nodes} edges={edges} startNodeId={startNodeId} />
        ) : (
          <ReactFlowProvider>
            <NodeEditor
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              startNodeId={startNodeId}
              setStartNodeId={setStartNodeId}
            />
          </ReactFlowProvider>
        )}
      </Box>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".zip"
        onChange={handleFileImport}
      />
    </Box>
  );
}

export default App;
