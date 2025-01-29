const { Node } = require('cascade');
const Scenario = require('../models/scenario.model');

/**
 * VideoNode - Gère la logique des nœuds vidéo
 * - Charge la vidéo
 * - Gère les transitions
 * - Applique les effets
 */
class VideoNode extends Node {
  async execute(context) {
    const { scenarioId, nodeId, variables } = context;

    const scenario = await Scenario.findById(scenarioId).lean();
    if (!scenario) {
      throw new Error(`Scénario non trouvé : ${scenarioId}`);
    }

    const node = scenario.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Nœud non trouvé : ${nodeId}`);
    }

    // Filtre les choix selon les conditions
    const validChoices = node.choices.filter(choice => {
      if (!choice.conditions || choice.conditions.length === 0) {
        return true;
      }
      return choice.conditions.every(cond => variables[cond]);
    });

    return {
      node,
      validChoices,
      variables,
      videoUrl: node.videoUrl,
      transition: node.transition || { type: 'CUT', duration: 0 }
    };
  }
}

/**
 * InteractiveNode - Gère la logique des nœuds interactifs
 * - Gère les choix utilisateur
 * - Met à jour les variables
 */
class InteractiveNode extends Node {
  async execute(context) {
    const { scenarioId, nodeId, variables, choice } = context;

    const scenario = await Scenario.findById(scenarioId).lean();
    if (!scenario) {
      throw new Error(`Scénario non trouvé : ${scenarioId}`);
    }

    const node = scenario.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Nœud non trouvé : ${nodeId}`);
    }

    // Met à jour les variables selon le choix
    if (choice && choice.effects) {
      Object.assign(variables, choice.effects);
    }

    return {
      node,
      variables,
      nextNodeId: choice ? choice.targetId : null
    };
  }
}

module.exports = {
  VideoNode,
  InteractiveNode
};
