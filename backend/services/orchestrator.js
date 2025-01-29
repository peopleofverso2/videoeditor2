class ScenarioOrchestrator {
  constructor() {
    this.scenarios = new Map();
  }

  async executeNode({ scenarioId, nodeId, variables = {}, choice = null }) {
    console.log('Executing node:', { scenarioId, nodeId, variables, choice });
    return {
      success: true,
      nextNodeId: null,
      variables
    };
  }
}

module.exports = new ScenarioOrchestrator();
