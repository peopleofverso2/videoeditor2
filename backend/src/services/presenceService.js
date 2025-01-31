const WebSocket = require('ws');

class PresenceService {
  constructor() {
    this.connections = new Map(); // userId -> ws
    this.onlineUsers = new Set();
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server, path: '/presence' });

    this.wss.on('connection', (ws) => {
      console.log('Nouvelle connexion WebSocket');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'identify') {
            this.handleIdentify(ws, data.userId);
          }
        } catch (error) {
          console.error('Erreur WebSocket:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
    });
  }

  handleIdentify(ws, userId) {
    // Enregistrer la connexion
    this.connections.set(userId, ws);
    this.onlineUsers.add(userId);

    // Notifier tous les clients du changement
    this.broadcastPresence();
  }

  handleDisconnect(ws) {
    // Trouver et supprimer l'utilisateur déconnecté
    for (const [userId, conn] of this.connections.entries()) {
      if (conn === ws) {
        this.connections.delete(userId);
        this.onlineUsers.delete(userId);
        break;
      }
    }

    // Notifier tous les clients du changement
    this.broadcastPresence();
  }

  broadcastPresence() {
    const message = JSON.stringify({
      type: 'presence',
      onlineUsers: Array.from(this.onlineUsers)
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

module.exports = new PresenceService();
