import React, { useState, useCallback } from 'react';
import { ThemeProvider, CssBaseline, Box, IconButton, Drawer } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { Group as GroupIcon } from '@mui/icons-material';
import NodeEditor from './components/NodeEditor/NodeEditor';
import Toolbar from './components/Toolbar/Toolbar';
import PreviewModal from './components/Preview/PreviewModal';
import MembersManager from './components/Collaboration/MembersManager';
import ProjectSelector from './components/Project/ProjectSelector';
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

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [openMembers, setOpenMembers] = useState(false);
  const [openProjects, setOpenProjects] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
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
      await exportProject(nodes, edges);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du projet');
    }
  }, [nodes, edges]);

  const handleImport = useCallback(async (file) => {
    try {
      const { nodes: importedNodes, edges: importedEdges } = await importProject(file);
      
      // Mettre à jour l'état
      setNodes(importedNodes);
      setEdges(importedEdges);
      
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

  const handleProjectSelect = (projectId) => {
    setCurrentProjectId(projectId);
    setOpenProjects(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Toolbar
          onOpenProjects={() => setOpenProjects(true)}
          projectId={currentProjectId}
          onSave={handleSave}
          onImport={handleImport}
          onPlay={handlePlay}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.past.length > 0}
          canRedo={history.future.length > 0}
        />

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

        {/* Drawer des projets */}
        <Drawer
          anchor="left"
          open={openProjects}
          onClose={() => setOpenProjects(false)}
          PaperProps={{
            sx: {
              width: { xs: '100%', sm: 400 },
              maxWidth: '100%',
              p: 2
            }
          }}
        >
          <ProjectSelector
            currentProjectId={currentProjectId}
            onProjectSelect={handleProjectSelect}
          />
        </Drawer>

        {/* Drawer des membres */}
        <Drawer
          anchor="right"
          open={openMembers}
          onClose={() => setOpenMembers(false)}
          PaperProps={{
            sx: {
              width: { xs: '100%', sm: 400 },
              maxWidth: '100%'
            }
          }}
        >
          {currentProjectId && (
            <MembersManager 
              projectId={currentProjectId}
              onClose={() => setOpenMembers(false)}
            />
          )}
        </Drawer>

        {/* Bouton de gestion des membres */}
        {currentProjectId && (
          <Box sx={{ position: 'fixed', right: 20, bottom: 20, zIndex: 1000 }}>
            <IconButton
              color="primary"
              onClick={() => setOpenMembers(true)}
              sx={{
                backgroundColor: 'white',
                boxShadow: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                }
              }}
            >
              <GroupIcon />
            </IconButton>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}
