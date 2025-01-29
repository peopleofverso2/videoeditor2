// Web Worker pour les calculs de graphe
import * as dagre from 'dagre';

self.onmessage = function(e) {
  const { nodes, edges, type } = e.data;
  
  switch (type) {
    case 'layout':
      const layoutedElements = calculateLayout(nodes, edges);
      self.postMessage({ type: 'layout', result: layoutedElements });
      break;
      
    case 'path':
      const paths = findAllPaths(nodes, edges);
      self.postMessage({ type: 'path', result: paths });
      break;
  }
};

function calculateLayout(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({});
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach(node => {
    g.setNode(node.id, { width: 300, height: 200 });
  });

  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x,
        y: nodeWithPosition.y
      }
    };
  });

  return { nodes: layoutedNodes, edges };
}

function findAllPaths(nodes, edges) {
  const graph = {};
  
  // Construire le graphe
  nodes.forEach(node => {
    graph[node.id] = [];
  });
  
  edges.forEach(edge => {
    graph[edge.source].push(edge.target);
  });

  const paths = [];
  const visited = new Set();

  function dfs(current, path) {
    if (visited.has(current)) return;
    
    visited.add(current);
    path.push(current);
    
    if (graph[current].length === 0) {
      paths.push([...path]);
    } else {
      graph[current].forEach(next => {
        dfs(next, path);
      });
    }
    
    path.pop();
    visited.delete(current);
  }

  // Trouver tous les nœuds de départ (sans arêtes entrantes)
  const startNodes = nodes.filter(node => 
    !edges.some(edge => edge.target === node.id)
  );

  startNodes.forEach(node => {
    dfs(node.id, []);
  });

  return paths;
}
