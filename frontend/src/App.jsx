import React, { useState, useRef, useCallback } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import NodeEditor from './components/NodeEditor/NodeEditor';
import Toolbar from './components/Toolbar/Toolbar';
import PreviewModal from './components/Preview/PreviewModal';
import { useNodesState, useEdgesState } from 'reactflow';

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

const initialNodes = [
  {
    id: 'start',
    type: 'videoNode',
    position: { x: 250, y: 100 },
    data: { label: 'Vidéo de départ' },
  },
];

const initialEdges = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Historique pour undo/redo
  const [history, setHistory] = useState({
    past: [],
    present: { nodes, edges },
    future: []
  });

  // Mise à jour de l'historique à chaque changement
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
  }, [edges, nodes, onEdgesChange]);

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

  const handleSave = useCallback(() => {
    // TODO: Implémenter la sauvegarde
    console.log('Saving...', { nodes, edges });
  }, [nodes, edges]);

  const handlePlay = useCallback(() => {
    setPreviewOpen(true);
  }, [setPreviewOpen]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.default' 
      }}>
        <Toolbar
          onSave={handleSave}
          onPlay={handlePlay}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.past.length > 0}
          canRedo={history.future.length > 0}
        />
        
        <Box sx={{ flex: 1, position: 'relative' }}>
          <NodeEditor
            scenarioId="test"
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
