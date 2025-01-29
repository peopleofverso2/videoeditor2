import React, { useCallback, useRef, useState, useReducer, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Menu, MenuItem } from '@mui/material';

import VideoNode from './nodes/VideoNode';
import InteractiveNode from './nodes/InteractiveNode';
import ButtonNode from './nodes/ButtonNode';
import DimensionsNode from './nodes/DimensionsNode';

const nodeTypes = {
  videoNode: VideoNode,
  interactiveNode: InteractiveNode,
  buttonNode: ButtonNode,
  dimensions: DimensionsNode,
};

const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

// Actions pour le reducer
const ACTIONS = {
  PUSH_STATE: 'PUSH_STATE',
  UNDO: 'UNDO',
  REDO: 'REDO',
};

// Fonction pour créer un snapshot avec description
const createSnapshot = (nodes, edges, description) => ({
  nodes: structuredClone(nodes),
  edges: structuredClone(edges),
  description,
  timestamp: Date.now(),
});

// Reducer pour gérer l'historique
function historyReducer(state, action) {
  switch (action.type) {
    case ACTIONS.PUSH_STATE:
      return {
        past: [...state.past, action.payload],
        present: action.payload,
        future: []
      };
    case ACTIONS.UNDO:
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future]
      };
    case ACTIONS.REDO:
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture
      };
    default:
      return state;
  }
}

function Flow({ nodes: initialNodes, edges: initialEdges, onNodesChange, onEdgesChange, setNodes, setEdges }) {
  const reactFlowWrapper = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [lastActionTime, setLastActionTime] = useState(0);
  const [nodes, setLocalNodes] = useState(initialNodes);
  const [edges, setLocalEdges] = useState(initialEdges);

  // Update local state when props change
  useEffect(() => {
    setLocalNodes(initialNodes);
  }, [initialNodes]);

  useEffect(() => {
    setLocalEdges(initialEdges);
  }, [initialEdges]);

  // État initial de l'historique
  const initialHistory = {
    past: [],
    present: createSnapshot(initialNodes, initialEdges, 'Initial state'),
    future: []
  };

  // Utiliser useReducer pour gérer l'historique
  const [history, dispatch] = useReducer(historyReducer, initialHistory);

  // Fonction pour sauvegarder l'état avec une description
  const saveState = useCallback((newNodes, newEdges, description) => {
    const now = Date.now();
    // Ne pas sauvegarder si le dernier changement est trop récent, sauf pour les actions importantes
    if (description !== 'Node deleted' && description !== 'Edge created' && now - lastActionTime < 500) {
      return;
    }

    dispatch({
      type: ACTIONS.PUSH_STATE,
      payload: createSnapshot(newNodes, newEdges, description)
    });
    setLastActionTime(now);
  }, [lastActionTime]);

  // Gestionnaires pour Undo/Redo
  const handleUndo = useCallback(() => {
    if (history.past.length === 0) return;
    dispatch({ type: ACTIONS.UNDO });
    const previousState = history.past[history.past.length - 1];
    setNodes(structuredClone(previousState.nodes));
    setEdges(structuredClone(previousState.edges));
  }, [history.past, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (history.future.length === 0) return;
    dispatch({ type: ACTIONS.REDO });
    const nextState = history.future[0];
    setNodes(structuredClone(nextState.nodes));
    setEdges(structuredClone(nextState.edges));
  }, [history.future, setNodes, setEdges]);

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleUndo, handleRedo]);

  // Gestionnaires d'événements pour les actions importantes
  const onNodeDragStop = useCallback((event, node) => {
    saveState(nodes, edges, 'Node moved');
  }, [nodes, edges, saveState]);

  const onConnect = useCallback((params) => {
    const edge = {
      ...params,
      id: `e${params.source}-${params.target}`,
      animated: true,
    };
    const newEdges = [...edges, edge];
    setEdges(newEdges);
    setLocalEdges(newEdges);
    saveState(nodes, newEdges, 'Edge created');
  }, [edges, nodes, setEdges, saveState]);

  const onNodesDelete = useCallback((deleted) => {
    const newNodes = nodes.filter(n => !deleted.find(d => d.id === n.id));
    setNodes(newNodes);
    setLocalNodes(newNodes);
    saveState(newNodes, edges, 'Node deleted');
  }, [nodes, edges, setNodes, saveState]);

  const onEdgesDelete = useCallback((deleted) => {
    const newEdges = edges.filter(e => !deleted.find(d => d.id === e.id));
    setEdges(newEdges);
    setLocalEdges(newEdges);
    saveState(nodes, newEdges, 'Edge deleted');
  }, [edges, nodes, setEdges, saveState]);

  // Handler pour les changements de nœuds
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    // Sauvegarder l'état après les changements importants
    const hasImportantChanges = changes.some(change => 
      change.type === 'remove' || change.type === 'add' || change.type === 'position'
    );
    if (hasImportantChanges) {
      setTimeout(() => saveState(nodes, edges, 'Node changed'), 0);
    }
  }, [onNodesChange, nodes, edges, saveState]);

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
          : type === 'interactiveNode'
          ? 'Nouvelle interaction'
          : type === 'dimensions'
          ? 'Nouvelles dimensions'
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
    setLocalNodes((nds) => nds.concat(newNode));
    saveState(nodes, edges, 'Node added');
  }, [setNodes, saveState, nodes, edges]);

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
          : type === 'interactiveNode'
          ? 'Nouvelle interaction'
          : type === 'dimensions'
          ? 'Nouvelles dimensions'
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
    setLocalNodes((nds) => nds.concat(newNode));
    saveState(nodes, edges, 'Node added');
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
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onEdgesDelete={onEdgesDelete}
        onNodesDelete={onNodesDelete}
        nodeTypes={nodeTypes}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        defaultViewport={defaultViewport}
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
        <MenuItem onClick={() => addNode('interactiveNode')}>Ajouter une interaction</MenuItem>
        <MenuItem onClick={() => addNode('dimensions')}>Ajouter des dimensions</MenuItem>
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
