import { WebSocketServer } from 'ws';

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // projectId -> Set of WebSocket clients
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws) => {
      console.log('Nouvelle connexion WebSocket');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'join') {
            this.handleJoin(ws, data.projectId);
          } else if (data.type === 'leave') {
            this.handleLeave(ws, data.projectId);
          }
        } catch (error) {
          console.error('Erreur lors du traitement du message:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
    });
  }

  handleJoin(ws, projectId) {
    if (!this.clients.has(projectId)) {
      this.clients.set(projectId, new Set());
    }
    this.clients.get(projectId).add(ws);
    ws.projectId = projectId;

    // Informer les autres clients qu'un nouvel utilisateur est en ligne
    this.broadcastToProject(projectId, {
      type: 'presence',
      online: this.clients.get(projectId).size
    });
  }

  handleLeave(ws, projectId) {
    if (this.clients.has(projectId)) {
      this.clients.get(projectId).delete(ws);
      if (this.clients.get(projectId).size === 0) {
        this.clients.delete(projectId);
      } else {
        this.broadcastToProject(projectId, {
          type: 'presence',
          online: this.clients.get(projectId).size
        });
      }
    }
    delete ws.projectId;
  }

  handleDisconnect(ws) {
    if (ws.projectId) {
      this.handleLeave(ws, ws.projectId);
    }
  }

  broadcastToProject(projectId, message) {
    if (!this.clients.has(projectId)) return;

    const messageStr = JSON.stringify(message);
    this.clients.get(projectId).forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
}

export default new WebSocketService();
