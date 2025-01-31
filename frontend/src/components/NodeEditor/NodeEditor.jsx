import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Menu, MenuItem } from '@mui/material';

import VideoNode from './nodes/VideoNode';
import InteractiveNode from './nodes/InteractiveNode';
import ButtonNode from './nodes/ButtonNode';
import { captureFlowScreenshot } from '../../services/screenshotService';

const nodeTypes = {
  videoNode: VideoNode,
  interactiveNode: InteractiveNode,
  buttonNode: ButtonNode,
};

const defaultViewport = { x: 0, y: 0, zoom: 1 };

function Flow({ nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges }) {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const onConnect = useCallback((params) => {
    const edge = {
      ...params,
      id: `e${params.source}-${params.target}`,
      animated: true,
    };
    setEdges((eds) => [...eds, edge]);
  }, [setEdges]);

  const onNodeDragStop = useCallback((event, node) => {
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const findAvailablePosition = useCallback((basePosition, nodes) => {
    const nodeWidth = 240;
    const nodeHeight = 180;
    const spacing = 40;
    let position = { ...basePosition };
    
    // Fonction pour vérifier si une position est libre
    const isPositionAvailable = (pos) => {
      return !nodes.some(node => {
        const dx = Math.abs(node.position.x - pos.x);
        const dy = Math.abs(node.position.y - pos.y);
        return dx < (nodeWidth + spacing) && dy < (nodeHeight + spacing);
      });
    };

    // Si la position initiale est libre, on la prend
    if (isPositionAvailable(position)) {
      return position;
    }

    // Sinon, on cherche la position libre la plus proche
    let radius = 1;
    const maxRadius = 10; // Pour éviter une boucle infinie
    
    while (radius < maxRadius) {
      // Chercher horizontalement
      position.x = basePosition.x + (nodeWidth + spacing) * radius;
      if (isPositionAvailable(position)) return position;
      
      position.x = basePosition.x - (nodeWidth + spacing) * radius;
      if (isPositionAvailable(position)) return position;
      
      // Chercher verticalement
      position.x = basePosition.x;
      position.y = basePosition.y + (nodeHeight + spacing) * radius;
      if (isPositionAvailable(position)) return position;
      
      position.y = basePosition.y - (nodeHeight + spacing) * radius;
      if (isPositionAvailable(position)) return position;
      
      radius++;
    }

    // Si aucune position n'est trouvée, retourner la position initiale
    return basePosition;
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      // S'assurer que le wrapper existe
      if (!reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `${type}_${nodes.length + 1}`,
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [nodes, reactFlowInstance, setNodes]
  );

  const handleContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: (event.clientX - reactFlowBounds.left) / 1.5,
        y: (event.clientY - reactFlowBounds.top) / 1.5,
      };

      setContextMenu({
        mouseX: event.clientX,
        mouseY: event.clientY,
        position,
      });
    },
    []
  );

  const handleClose = () => {
    setContextMenu(null);
  };

  const addNode = (type) => {
    const newNode = {
      id: `${type}_${nodes.length + 1}`,
      type,
      position: contextMenu.position,
      data: { 
        label: type === 'videoNode' 
          ? 'Nouvelle vidéo'
          : type === 'buttonNode'
          ? 'Nouveau bouton'
          : ''
      },
    };

    setNodes((nds) => nds.concat(newNode));
    handleClose();
  };

  useEffect(() => {
    // Ajuster le zoom initial
    const timeoutId = setTimeout(() => {
      const flowInstance = document.querySelector('.react-flow');
      if (flowInstance) {
        flowInstance.style.transform = 'scale(1)';
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <Box 
      ref={reactFlowWrapper}
      sx={{ 
        width: '100%', 
        height: '100%', 
        bgcolor: 'background.default',
        position: 'relative'
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView={false}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={4}
        snapToGrid={true}
        snapGrid={[20, 20]}
        style={{ background: 'transparent' }}
      >
        <Controls />
        <Background color="rgba(255, 255, 255, 0.05)" gap={20} />
      </ReactFlow>

      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => addNode('videoNode')}>Ajouter une vidéo</MenuItem>
        <MenuItem onClick={() => addNode('buttonNode')}>Ajouter un bouton</MenuItem>
      </Menu>
    </Box>
  );
}

function NodeEditor(props) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
}

export default NodeEditor;
