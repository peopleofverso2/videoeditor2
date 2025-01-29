import React, { useCallback, useMemo } from 'react';
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
import VideoNode from './nodes/VideoNode';
import VideoInteractiveNode from './nodes/VideoInteractiveNode';
import ImageButtonNode from './nodes/ImageButtonNode';
import { Button, ButtonGroup } from '@mui/material';
import 'reactflow/dist/style.css';

// Define nodeTypes outside of component to prevent unnecessary re-renders
const NODE_TYPES = {
  videoNode: VideoNode,
  videoInteractiveNode: VideoInteractiveNode,
  imageButtonNode: ImageButtonNode,
};

function NodeEditor() {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
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
        label: 'Add content',
        onChange: (newData) => {
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
    };

    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, navigateToNode]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-right">
          <ButtonGroup variant="contained">
            <Button onClick={() => addNode('videoNode')}>
              Basic Video
            </Button>
            <Button onClick={() => addNode('videoInteractiveNode')}>
              Interactive Video
            </Button>
            <Button onClick={() => addNode('imageButtonNode')}>
              Image Button
            </Button>
          </ButtonGroup>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default NodeEditor;
