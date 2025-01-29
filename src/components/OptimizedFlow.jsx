import React, { useCallback, useEffect, useState, useMemo } from 'react';
import ReactFlow, { Controls, Background } from 'reactflow';
import { useVirtualization } from '../hooks/useVirtualization';
import { getLayoutedElements } from '../services/layoutService';
import dagre from 'dagre';

// Créer le worker
const graphWorker = new Worker(new URL('../workers/graphWorker.js', import.meta.url), {
  type: 'module'
});

const OptimizedFlow = ({ 
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  nodeTypes,
  ...props 
}) => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [isLayouting, setIsLayouting] = useState(false);

  // Utiliser la virtualisation pour n'afficher que les nœuds visibles
  const { visibleNodes, visibleEdges } = useVirtualization(nodes, edges);

  // Mettre en cache les calculs de layout
  const layoutCache = useMemo(() => new Map(), []);

  const handleLayout = useCallback(() => {
    setIsLayouting(true);

    // Vérifier si le layout est en cache
    const cacheKey = JSON.stringify({ nodes, edges });
    if (layoutCache.has(cacheKey)) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = layoutCache.get(cacheKey);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setIsLayouting(false);
      return;
    }

    // Sinon, calculer le layout dans le worker
    graphWorker.postMessage({ 
      type: 'layout',
      nodes,
      edges
    });
  }, [nodes, edges, layoutCache]);

  // Écouter les réponses du worker
  useEffect(() => {
    const handleWorkerMessage = (event) => {
      const { type, result } = event.data;
      
      if (type === 'layout') {
        // Mettre en cache le résultat
        const cacheKey = JSON.stringify({ nodes, edges });
        layoutCache.set(cacheKey, result);

        setNodes(result.nodes);
        setEdges(result.edges);
        setIsLayouting(false);
      }
    };

    graphWorker.addEventListener('message', handleWorkerMessage);
    return () => graphWorker.removeEventListener('message', handleWorkerMessage);
  }, [nodes, edges, layoutCache]);

  // Optimiser les mises à jour de nœuds
  const handleNodesChange = useCallback((changes) => {
    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      changes.forEach(change => {
        const index = newNodes.findIndex(n => n.id === change.id);
        if (index !== -1) {
          newNodes[index] = { ...newNodes[index], ...change };
        }
      });
      return newNodes;
    });
    
    if (onNodesChange) {
      onNodesChange(changes);
    }
  }, [onNodesChange]);

  return (
    <ReactFlow
      nodes={visibleNodes}
      edges={visibleEdges}
      onNodesChange={handleNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      {...props}
    >
      <Background />
      <Controls />
      {isLayouting && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.5)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px'
        }}>
          Optimisation du layout...
        </div>
      )}
    </ReactFlow>
  );
};

export default OptimizedFlow;
