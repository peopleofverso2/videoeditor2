import React, { useState, useCallback } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Box, 
  IconButton, 
  Drawer,
  Container
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { Group as GroupIcon } from '@mui/icons-material';
import NodeEditor from './components/NodeEditor/NodeEditor';
import Toolbar from './components/Toolbar/Toolbar';
import PreviewModal from './components/Preview/PreviewModal';
import MembersManager from './components/Collaboration/MembersManager';
import ProjectSelector from './components/Project/ProjectSelector';
import MediaLibrary from './components/MediaLibrary/MediaLibrary';
import VideoNode from './components/VideoNode';
import { useNodesState, useEdgesState, ReactFlowProvider } from 'reactflow';
import { exportProject, exportProjectWithMedia, importProject } from './services/exportService';
import { API_URL } from './constants/api';
import 'reactflow/dist/style.css';

// Création du thème
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]); 
  const [openMembers, setOpenMembers] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentProjectName, setCurrentProjectName] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
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
    if (!currentProjectId) {
      console.error("Aucun projet sélectionné");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/projects/${currentProjectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes,
          edges,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      console.log("Projet sauvegardé avec succès");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde du projet");
    }
  }, [currentProjectId, nodes, edges]);

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
      console.error("Erreur lors de l'import:", error);
      alert("Erreur lors de l'import du projet");
    }
  }, [setNodes, setEdges, setHistory]);

  const handlePlay = useCallback(() => {
    setPreviewOpen(true);
  }, [setPreviewOpen]);

  const handleProjectSelect = async (projectId) => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`);
      if (!response.ok) throw new Error("Erreur lors du chargement du projet");
      
      const project = await response.json();
      setNodes(project.nodes || []);
      setEdges(project.edges || []);
      setCurrentProjectId(projectId);
      setCurrentProjectName(project.name);
      
      // Réinitialiser l'historique
      setHistory({
        past: [],
        present: { nodes: project.nodes || [], edges: project.edges || [] },
        future: []
      });
    } catch (error) {
      console.error("Erreur lors du chargement du projet:", error);
      alert("Erreur lors du chargement du projet");
    }
  };

  const handleOpenProjects = useCallback(async () => {
    // Sauvegarder l'état actuel si un projet est ouvert
    if (currentProjectId) {
      try {
        const response = await fetch(`${API_URL}/projects/${currentProjectId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nodes,
            edges,
          }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la sauvegarde");
        }

        console.log("Projet sauvegardé avant de retourner à la liste");
      } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        const shouldContinue = window.confirm(
          "Erreur lors de la sauvegarde du projet. Voulez-vous quand même retourner à la liste des projets ?"
        );
        if (!shouldContinue) {
          return;
        }
      }
    }

    // Réinitialiser l'état
    setCurrentProjectId(null);
    setCurrentProjectName("");
    setNodes([]);
    setEdges([]);
    setHistory({
      past: [],
      present: { nodes: [], edges: [] },
      future: []
    });
  }, [currentProjectId, nodes, edges]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ReactFlowProvider>
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
          {!currentProjectId ? (
            <Container>
              <Box sx={{ mt: 4 }}>
                <ProjectSelector onProjectSelect={handleProjectSelect} />
              </Box>
            </Container>
          ) : (
            <>
              <Toolbar
                projectId={currentProjectId}
                projectName={currentProjectName}
                onSave={handleSave}
                onImport={handleImport}
                onPlay={handlePlay}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={history.past.length > 0}
                canRedo={history.future.length > 0}
                onOpenProjects={handleOpenProjects}
                onOpenLibrary={() => setLibraryOpen(true)}
              />

              <Box sx={{ flexGrow: 1, position: "relative" }}>
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

              <MediaLibrary
                open={libraryOpen}
                onClose={() => setLibraryOpen(false)}
                onSelect={(video) => {
                  // Votre logique de sélection de vidéo existante
                  setLibraryOpen(false);
                }}
              />

              {/* Drawer des membres */}
              <Drawer
                anchor="right"
                open={openMembers}
                onClose={() => setOpenMembers(false)}
                PaperProps={{
                  sx: {
                    width: { xs: "100%", sm: 400 },
                    maxWidth: "100%"
                  }
                }}
              >
                <MembersManager 
                  projectId={currentProjectId}
                  onClose={() => setOpenMembers(false)}
                />
              </Drawer>

              {/* Bouton de gestion des membres */}
              <Box sx={{ position: "fixed", right: 20, bottom: 20, zIndex: 1000 }}>
                <IconButton
                  color="primary"
                  onClick={() => setOpenMembers(true)}
                  sx={{
                    backgroundColor: "white",
                    boxShadow: 2,
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                    }
                  }}
                >
                  <GroupIcon />
                </IconButton>
              </Box>
            </>
          )}
        </Box>
      </ReactFlowProvider>
    </ThemeProvider>
  );
}
