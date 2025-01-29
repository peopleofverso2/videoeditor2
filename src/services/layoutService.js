import dagre from 'dagre';
import { Position } from 'reactflow';

const NODE_WIDTH = 300;
const NODE_HEIGHT = 200;

export function getLayoutedElements(nodes, edges, direction = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  // Ajouter les nœuds au graphe dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Ajouter les arêtes au graphe dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculer le layout
  dagre.layout(dagreGraph);

  // Récupérer les positions calculées
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
    };
  });

  return { nodes: layoutedNodes, edges };
}

export function chunkNodes(nodes, chunkSize = 50) {
  const chunks = [];
  for (let i = 0; i < nodes.length; i += chunkSize) {
    chunks.push(nodes.slice(i, i + chunkSize));
  }
  return chunks;
}

export function getVisibleNodes(nodes, viewport) {
  const { x, y, zoom } = viewport;
  const padding = 500; // pixels de padding pour le préchargement

  return nodes.filter(node => {
    const nodeX = node.position.x * zoom + x;
    const nodeY = node.position.y * zoom + y;
    
    return (
      nodeX >= -padding &&
      nodeX <= window.innerWidth + padding &&
      nodeY >= -padding &&
      nodeY <= window.innerHeight + padding
    );
  });
}
