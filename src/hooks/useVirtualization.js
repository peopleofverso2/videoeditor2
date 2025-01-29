import { useCallback, useEffect, useState } from 'react';
import { useViewport } from 'reactflow';

const VIEWPORT_PADDING = 500; // pixels de marge autour de la vue

export function useVirtualization(allNodes, allEdges) {
  const viewport = useViewport();
  const [visibleNodes, setVisibleNodes] = useState([]);
  const [visibleEdges, setVisibleEdges] = useState([]);

  const updateVisibleElements = useCallback(() => {
    const { x, y, zoom } = viewport;
    
    // Calculer les limites de la vue avec padding
    const viewBounds = {
      left: (-x - VIEWPORT_PADDING) / zoom,
      right: (window.innerWidth - x + VIEWPORT_PADDING) / zoom,
      top: (-y - VIEWPORT_PADDING) / zoom,
      bottom: (window.innerHeight - y + VIEWPORT_PADDING) / zoom,
    };

    // Filtrer les nœuds visibles
    const newVisibleNodes = allNodes.filter(node => {
      return (
        node.position.x >= viewBounds.left &&
        node.position.x <= viewBounds.right &&
        node.position.y >= viewBounds.top &&
        node.position.y <= viewBounds.bottom
      );
    });

    // Obtenir les IDs des nœuds visibles
    const visibleNodeIds = new Set(newVisibleNodes.map(n => n.id));

    // Filtrer les arêtes connectées aux nœuds visibles
    const newVisibleEdges = allEdges.filter(edge => 
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );

    setVisibleNodes(newVisibleNodes);
    setVisibleEdges(newVisibleEdges);
  }, [viewport, allNodes, allEdges]);

  // Mettre à jour les éléments visibles quand la vue change
  useEffect(() => {
    updateVisibleElements();
  }, [viewport, updateVisibleElements]);

  return { visibleNodes, visibleEdges, updateVisibleElements };
}
