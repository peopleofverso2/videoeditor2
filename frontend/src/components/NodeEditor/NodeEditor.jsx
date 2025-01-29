import React, { useCallback, useRef, useState } from 'react';
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

const nodeTypes = {
  videoNode: VideoNode,
  interactiveNode: InteractiveNode,
  buttonNode: ButtonNode,
};

const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

function Flow({ nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges }) {
  const reactFlowWrapper = useRef(null);
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

  const onDrop = useCallback((event) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = {
      x: (event.clientX - reactFlowBounds.left) / 1.5,
      y: (event.clientY - reactFlowBounds.top) / 1.5,
    };

    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: { 
        label: type === 'videoNode' 
          ? 'Nouvelle vidéo'
          : type === 'buttonNode'
          ? 'Nouveau bouton'
          : '',
        style: type === 'buttonNode' ? {
          backgroundColor: '#1976d2',
          color: 'white',
          hoverBackgroundColor: '#1565c0',
          fontSize: '1rem'
        } : undefined
      },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

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
      id: `${type}-${Date.now()}`,
      type,
      position: contextMenu.position,
      data: { 
        label: type === 'videoNode' 
          ? 'Nouvelle vidéo'
          : type === 'buttonNode'
          ? 'Nouveau bouton'
          : '',
        style: type === 'buttonNode' ? {
          backgroundColor: '#1976d2',
          color: 'white',
          hoverBackgroundColor: '#1565c0',
          fontSize: '1rem'
        } : undefined
      },
    };

    setNodes((nds) => nds.concat(newNode));
    handleClose();
  };

  return (
    <Box
      ref={reactFlowWrapper}
      sx={{
        width: '100%',
        height: '100%',
      }}
      onContextMenu={handleContextMenu}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        defaultViewport={defaultViewport}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        minZoom={0.1}
      >
        <Controls />
        <MiniMap />
        <Background gap={16} size={1} />
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
