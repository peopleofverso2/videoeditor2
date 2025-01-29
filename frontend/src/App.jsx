import React, { useState, useRef } from 'react';
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
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleSave = async () => {
    console.log('Saving project...');
  };

  const handlePlay = () => {
    setPreviewOpen(true);
  };

  const handleUndo = () => {
    console.log('Undo action...');
  };

  const handleRedo = () => {
    console.log('Redo action...');
  };

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
          canUndo={canUndo}
          canRedo={canRedo}
        />
        <Box sx={{ flex: 1, position: 'relative' }}>
          <NodeEditor
            scenarioId="test"
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            setNodes={setNodes}
            setEdges={setEdges}
          />
        </Box>
      </Box>

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        nodes={nodes}
        edges={edges}
      />
    </ThemeProvider>
  );
}

export default App;
