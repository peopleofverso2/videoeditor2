import { useState, useEffect, useCallback } from 'react';
import { useViewport } from 'reactflow';

const VIEWPORT_PADDING = 500; // pixels de marge pour le préchargement

export function useVisibleNodes(allNodes) {
  const viewport = useViewport();
  const [visibleNodeIds, setVisibleNodeIds] = useState(new Set());

  const updateVisibleNodes = useCallback(() => {
    if (!allNodes?.length) return;

    const { x, y, zoom } = viewport;
    const viewBounds = {
      left: (-x - VIEWPORT_PADDING) / zoom,
      right: (window.innerWidth - x + VIEWPORT_PADDING) / zoom,
      top: (-y - VIEWPORT_PADDING) / zoom,
      bottom: (window.innerHeight - y + VIEWPORT_PADDING) / zoom,
    };

    const newVisibleIds = new Set();
    
    allNodes.forEach(node => {
      if (node.position.x >= viewBounds.left &&
          node.position.x <= viewBounds.right &&
          node.position.y >= viewBounds.top &&
          node.position.y <= viewBounds.bottom) {
        newVisibleIds.add(node.id);
      }
    });

    setVisibleNodeIds(newVisibleIds);
  }, [viewport, allNodes]);

  // Mettre à jour les nœuds visibles quand la vue change
  useEffect(() => {
    updateVisibleNodes();
  }, [updateVisibleNodes]);

  return {
    isNodeVisible: useCallback((nodeId) => visibleNodeIds.has(nodeId), [visibleNodeIds]),
    visibleNodeIds,
    updateVisibleNodes
  };
}
