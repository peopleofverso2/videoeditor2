import React, { useState, useCallback } from 'react';
import { ThemeProvider, CssBaseline, Box, Typography, TextField, Stack } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import NodeEditor from './components/NodeEditor/NodeEditor';
import Toolbar from './components/Toolbar/Toolbar';
import PreviewModal from './components/Preview/PreviewModal';
import { useNodesState, useEdgesState } from 'reactflow';
import { exportProject, importProject } from './services/exportService';

// Création du thème
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [projectName, setProjectName] = useState('Nouveau projet');
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Historique pour undo/redo
  const [history, setHistory] = useState({
    past: [],
    present: { nodes, edges },
    future: []
  });

  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: { nodes, edges },
      future: []
    }));
  }, [nodes, edges, onNodesChange]);

  const handleEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: { nodes, edges },
      future: []
    }));
  }, [nodes, edges, onEdgesChange]);

  const handleUndo = useCallback(() => {
    if (history.past.length === 0) return;
    
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    
    setHistory({
      past: newPast,
      present: previous,
      future: [history.present, ...history.future]
    });
    
    setNodes(previous.nodes);
    setEdges(previous.edges);
  }, [history, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (history.future.length === 0) return;
    
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    setHistory({
      past: [...history.past, history.present],
      present: next,
      future: newFuture
    });
    
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [history, setNodes, setEdges]);

  const handleSave = useCallback(async () => {
    try {
      await exportProject(nodes, edges, projectName);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du projet');
    }
  }, [nodes, edges, projectName]);

  const handleImport = useCallback(async (file) => {
    try {
      const { nodes: importedNodes, edges: importedEdges, projectName: importedName } = await importProject(file);
      
      // Mettre à jour l'état
      setNodes(importedNodes);
      setEdges(importedEdges);
      if (importedName) {
        setProjectName(importedName);
      }
      
      // Réinitialiser l'historique
      setHistory({
        past: [],
        present: { nodes: importedNodes, edges: importedEdges },
        future: []
      });
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import du projet');
    }
  }, [setNodes, setEdges, setHistory]);

  const handlePlay = useCallback(() => {
    setPreviewOpen(true);
  }, [setPreviewOpen]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        component="main"
        role="main"
        sx={{ 
          height: '100vh', 
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default' 
        }}
      >
        <Toolbar
          onSave={handleSave}
          onImport={handleImport}
          onPlay={handlePlay}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.past.length > 0}
          canRedo={history.future.length > 0}
        />

        <Stack 
          direction="row" 
          alignItems="center" 
          spacing={2}
          sx={{ 
            px: 2,
            py: 0.5,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            bgcolor: 'background.paper'
          }}
        >
          {isEditingName ? (
            <TextField
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingName(false);
                }
              }}
              variant="standard"
              autoFocus
              size="small"
              inputProps={{
                'aria-label': 'Nom du projet'
              }}
              sx={{ 
                '& .MuiInputBase-input': {
                  fontSize: '0.875rem',
                  fontWeight: 500
                }
              }}
            />
          ) : (
            <Typography
              variant="subtitle2"
              component="button"
              onClick={() => setIsEditingName(true)}
              tabIndex={0}
              role="button"
              aria-label="Modifier le nom du projet"
              sx={{ 
                cursor: 'pointer',
                color: 'text.secondary',
                fontWeight: 500,
                background: 'none',
                border: 'none',
                padding: 0,
                '&:hover': {
                  color: 'primary.main'
                }
              }}
            >
              {projectName}
            </Typography>
          )}
        </Stack>
        
        <Box sx={{ flexGrow: 1 }}>
          <NodeEditor
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            setNodes={setNodes}
            setEdges={setEdges}
          />
        </Box>

        <PreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          nodes={nodes}
          edges={edges}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
