class StateService {
  constructor() {
    this.projectStates = new Map();
    this.activeUsers = new Map();
  }

  /**
   * Gère l'état d'un projet
   */
  getProjectState(projectId) {
    if (!this.projectStates.has(projectId)) {
      this.projectStates.set(projectId, {
        activeUsers: new Set(),
        lastModified: Date.now(),
        undoStack: [],
        redoStack: []
      });
    }
    return this.projectStates.get(projectId);
  }

  /**
   * Ajoute un utilisateur à un projet
   */
  addUserToProject(projectId, userId, username) {
    const state = this.getProjectState(projectId);
    state.activeUsers.add({
      id: userId,
      username,
      joinedAt: Date.now()
    });
    this.activeUsers.set(userId, projectId);
  }

  /**
   * Retire un utilisateur d'un projet
   */
  removeUserFromProject(userId) {
    const projectId = this.activeUsers.get(userId);
    if (projectId) {
      const state = this.getProjectState(projectId);
      state.activeUsers = new Set(
        [...state.activeUsers].filter(user => user.id !== userId)
      );
      this.activeUsers.delete(userId);
    }
  }

  /**
   * Enregistre une action pour le undo/redo
   */
  pushAction(projectId, action) {
    const state = this.getProjectState(projectId);
    state.undoStack.push(action);
    state.redoStack = []; // Clear redo stack on new action
    state.lastModified = Date.now();
  }

  /**
   * Annule la dernière action
   */
  undo(projectId) {
    const state = this.getProjectState(projectId);
    if (state.undoStack.length > 0) {
      const action = state.undoStack.pop();
      state.redoStack.push(action);
      return {
        action,
        type: 'undo'
      };
    }
    return null;
  }

  /**
   * Rétablit la dernière action annulée
   */
  redo(projectId) {
    const state = this.getProjectState(projectId);
    if (state.redoStack.length > 0) {
      const action = state.redoStack.pop();
      state.undoStack.push(action);
      return {
        action,
        type: 'redo'
      };
    }
    return null;
  }

  /**
   * Nettoie les projets inactifs
   */
  cleanup(maxInactiveTime = 24 * 60 * 60 * 1000) { // 24h par défaut
    const now = Date.now();
    for (const [projectId, state] of this.projectStates.entries()) {
      if (state.activeUsers.size === 0 && 
          now - state.lastModified > maxInactiveTime) {
        this.projectStates.delete(projectId);
      }
    }
  }
}

module.exports = new StateService();
