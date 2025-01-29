import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Panel
} from 'reactflow';
import { Box, Button, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import SaveIcon from '@mui/icons-material/Save';
import VideoNode from './nodes/VideoNode';
import VideoInteractiveNode from './nodes/VideoInteractiveNode';
import ImageButtonNode from './nodes/ImageButtonNode';
import ClickableNode from './nodes/ClickableNode';
import ScenarioPlayer from './ScenarioPlayer';
import 'reactflow/dist/style.css';

// Define nodeTypes outside of component to prevent unnecessary re-renders
const NODE_TYPES = {
  videoNode: VideoNode,
  videoInteractiveNode: VideoInteractiveNode,
  imageButtonNode: ImageButtonNode,
  clickableNode: ClickableNode,
};

function NodeEditor() {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [showPlayer, setShowPlayer] = useState(false);

  const onConnect = useCallback(
    (params) => {
      console.log('Connection params:', params);
      // Mettre à jour l'option correspondante avec le targetNodeId
      const sourceNode = nodes.find(n => n.id === params.source);
      if (sourceNode && sourceNode.type === 'clickableNode') {
        const handleId = params.sourceHandle;
        const optionId = handleId.split('-handle-')[1];
        console.log('Updating option:', optionId, 'with target:', params.target);
        
        setNodes(nds => nds.map(node => {
          if (node.id === params.source) {
            const updatedOptions = node.data.options.map(option => {
              if (option.id === optionId) {
                console.log('Found option to update:', option);
                return { ...option, targetNodeId: params.target };
              }
              return option;
            });
            const updatedNode = {
              ...node,
              data: { ...node.data, options: updatedOptions }
            };
            console.log('Updated node:', updatedNode);
            return updatedNode;
          }
          return node;
        }));
      }
      
      setEdges(eds => addEdge(params, eds));
    },
    [setEdges, nodes, setNodes]
  );

  const handleNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const handleEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const navigateToNode = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // Instead of using setCenter, we'll just log for now
      console.log('Navigating to node:', nodeId);
    }
  }, [nodes]);

  const addNode = useCallback((type) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type,
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: { 
        label: type === 'clickableNode' ? 'Choix' : 'Add content',
        options: type === 'clickableNode' ? [
          { id: '1', text: 'Option 1', color: '#1976d2', targetNodeId: null },
          { id: '2', text: 'Option 2', color: '#2e7d32', targetNodeId: null }
        ] : [],
        onChange: (newData) => {
          console.log('Node data changed:', newData);
          setNodes((nds) => 
            nds.map((node) => 
              node.id === newNode.id 
                ? { ...node, data: { ...node.data, ...newData } }
                : node
            )
          );
        },
        onNavigateToNode: navigateToNode
      },
      width: type === 'clickableNode' ? 200 : undefined,
    };

    console.log('Adding new node:', newNode);
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, navigateToNode]);

  const handleSave = useCallback(() => {
    try {
      // Collecter les ressources (vidéos, images) utilisées dans le scénario
      const resources = new Set();
      nodes.forEach(node => {
        if (node.data.videoUrl) resources.add(node.data.videoUrl);
        if (node.data.imageUrl) resources.add(node.data.imageUrl);
      });

      // Préparer les données à sauvegarder
      const povData = {
        version: "1.0",
        name: `scenario_${Date.now()}`,
        resources: Array.from(resources),
        flow: {
          nodes: nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              onChange: undefined,
              onNavigateToNode: undefined
            }
          })),
          edges
        }
      };

      // Créer un objet Blob avec les données
      const blob = new Blob([JSON.stringify(povData, null, 2)], { type: 'application/json' });
      
      // Créer un lien de téléchargement
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${povData.name}.pov`;
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du scénario');
    }
  }, [nodes, edges]);

  const handleLoad = useCallback(() => {
    try {
      // Créer un input file invisible
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pov';
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          
          reader.onload = (event) => {
            try {
              const povData = JSON.parse(event.target.result);
              
              // Vérifier la version et la structure du fichier
              if (!povData.version || !povData.flow) {
                throw new Error('Format de fichier POV invalide');
              }

              // Vérifier la disponibilité des ressources
              if (povData.resources) {
                console.log('Ressources nécessaires:', povData.resources);
                // TODO: Implémenter la vérification/téléchargement des ressources
              }
              
              // Restaurer les fonctions pour chaque nœud
              const restoredNodes = povData.flow.nodes.map(node => ({
                ...node,
                data: {
                  ...node.data,
                  onChange: (newData) => {
                    setNodes((nds) => 
                      nds.map((n) => 
                        n.id === node.id 
                          ? { ...n, data: { ...n.data, ...newData } }
                          : n
                      )
                    );
                  },
                  onNavigateToNode: navigateToNode
                }
              }));
              
              setNodes(restoredNodes);
              setEdges(povData.flow.edges);
            } catch (parseError) {
              console.error('Erreur lors du parsing du fichier:', parseError);
              alert('Le fichier POV n\'est pas valide');
            }
          };
          
          reader.readAsText(file);
        }
      };
      
      // Déclencher la sélection de fichier
      input.click();
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      alert('Erreur lors du chargement du scénario');
    }
  }, [setNodes, setEdges, navigateToNode]);

  return (
    <Box sx={{ width: '100%', height: '100vh', position: 'relative' }}>
      {showPlayer ? (
        <ScenarioPlayer
          nodes={nodes}
          edges={edges}
          onClose={() => setShowPlayer(false)}
        />
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES}
          fitView
        >
          <Panel position="top-right">
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              bgcolor: 'background.paper',
              p: 1,
              borderRadius: 1,
              boxShadow: 1
            }}>
              <Button
                variant="contained"
                onClick={() => addNode('videoNode')}
                sx={{ minWidth: 120 }}
              >
                Add Video
              </Button>
              <Button
                variant="contained"
                onClick={() => addNode('videoInteractiveNode')}
                sx={{ minWidth: 120 }}
              >
                Add Interactive Video
              </Button>
              <Button
                variant="contained"
                onClick={() => addNode('imageButtonNode')}
                sx={{ minWidth: 120 }}
              >
                Add Interactive Image
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => addNode('clickableNode')}
                sx={{ 
                  minWidth: 120,
                  bgcolor: 'secondary.main',
                  '&:hover': {
                    bgcolor: 'secondary.dark',
                  }
                }}
              >
                Add Choice Menu
              </Button>
              <Box sx={{ borderLeft: 1, mx: 1, borderColor: 'divider' }} />
              <IconButton
                color="primary"
                onClick={() => setShowPlayer(true)}
                sx={{ bgcolor: 'background.paper' }}
              >
                <PlayArrowIcon />
              </IconButton>
              <IconButton
                color="primary"
                onClick={handleSave}
                sx={{ bgcolor: 'background.paper' }}
              >
                <SaveIcon />
              </IconButton>
              <IconButton
                color="primary"
                onClick={handleLoad}
                sx={{ bgcolor: 'background.paper' }}
              >
                <FileOpenIcon />
              </IconButton>
            </Box>
          </Panel>
          <Background />
          <Controls />
        </ReactFlow>
      )}
    </Box>
  );
}

export default NodeEditor;
