import { WebSocket } from 'ws';

class PresenceService {
  constructor() {
    this.connections = new Map(); // userId -> ws
    this.onlineUsers = new Set();
  }

  initialize(wss) {
    console.log('Initialisation du service de présence');
    this.wss = wss;

    this.wss.on('connection', (ws, req) => {
      console.log('Nouvelle connexion WebSocket depuis:', req.socket.remoteAddress);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('Message WebSocket reçu:', data);
          
          if (data.type === 'identify') {
            this.handleIdentify(ws, data.userId);
          }
        } catch (error) {
          console.error('Erreur de parsing WebSocket:', error);
        }
      });

      ws.on('close', (code, reason) => {
        console.log('Connexion WebSocket fermée:', { code, reason: reason.toString() });
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('Erreur WebSocket:', error);
      });

      // Envoyer un message de bienvenue pour confirmer la connexion
      ws.send(JSON.stringify({ type: 'welcome', message: 'Connecté au service de présence' }));
    });

    this.wss.on('error', (error) => {
      console.error('Erreur du serveur WebSocket:', error);
    });
  }

  handleIdentify(ws, userId) {
    if (!userId) {
      console.error('Tentative d\'identification sans userId');
      return;
    }

    console.log('Identification utilisateur:', userId);
    
    // Si l'utilisateur était déjà connecté, fermer l'ancienne connexion
    const existingConnection = this.connections.get(userId);
    if (existingConnection && existingConnection !== ws) {
      console.log('Fermeture de l\'ancienne connexion pour:', userId);
      existingConnection.close();
    }

    // Enregistrer la nouvelle connexion
    this.connections.set(userId, ws);
    this.onlineUsers.add(userId);
    console.log('Utilisateurs en ligne:', Array.from(this.onlineUsers));

    // Confirmer l'identification à l'utilisateur
    ws.send(JSON.stringify({
      type: 'identified',
      userId: userId
    }));

    // Notifier tous les clients du changement
    this.broadcastPresence();
  }

  handleDisconnect(ws) {
    // Trouver et supprimer l'utilisateur déconnecté
    for (const [userId, conn] of this.connections.entries()) {
      if (conn === ws) {
        console.log('Déconnexion utilisateur:', userId);
        this.connections.delete(userId);
        this.onlineUsers.delete(userId);
        console.log('Utilisateurs en ligne après déconnexion:', Array.from(this.onlineUsers));
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

    console.log('Diffusion de la présence:', message);

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

export default new PresenceService();
