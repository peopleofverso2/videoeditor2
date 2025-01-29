import { useCallback } from 'react';
import { getMousePosition } from 'reactflow';

export function useDragAndDrop(reactFlowWrapper, setNodes) {
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // Vérifier si le type est valide
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = getMousePosition(
        event,
        reactFlowBounds,
        { x: 0, y: 0, zoom: 1 }
      );

      let newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `Nouveau ${type}` }
      };

      // Configuration spécifique selon le type de nœud
      switch (type) {
        case 'videoNode':
          newNode.data = {
            ...newNode.data,
            videoUrl: '',
            duration: 0,
            transition: {
              type: 'CUT',
              duration: 0
            }
          };
          break;

        case 'interactiveNode':
          newNode.data = {
            ...newNode.data,
            choices: [],
            variables: {}
          };
          break;

        case 'buttonNode':
          newNode.data = {
            ...newNode.data,
            style: {
              backgroundColor: '#ffffff',
              color: '#000000'
            }
          };
          break;

        default:
          break;
      }

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowWrapper, setNodes]
  );

  return {
    onDragOver,
    onDrop
  };
}
