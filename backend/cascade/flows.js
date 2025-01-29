const { Flow } = require('cascade');
const { VideoNode, InteractiveNode } = require('./nodes');

/**
 * ScenarioFlow - Flow principal pour l'exécution des scénarios
 * Gère l'enchaînement des nœuds vidéo et interactifs
 */
const ScenarioFlow = new Flow({
  id: 'scenario-flow',
  title: 'Exécution de scénarios vidéo interactifs',
  nodes: {
    'video-node': VideoNode,
    'interactive-node': InteractiveNode
  },
  edges: [
    // Un nœud vidéo peut mener à un autre nœud vidéo ou à un nœud interactif
    { source: 'video-node', target: 'video-node' },
    { source: 'video-node', target: 'interactive-node' },
    // Un nœud interactif mène toujours à un nœud vidéo
    { source: 'interactive-node', target: 'video-node' }
  ]
});

module.exports = {
  ScenarioFlow
};
