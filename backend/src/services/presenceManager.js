import { USER_STATUS } from '../types/presence.js';

class PresenceManager {
  constructor() {
    this.users = new Map();
    this.typingUsers = new Set();
  }

  handleConnection(ws) {
    ws.on('message', (message) => this.handleMessage(ws, message));
    ws.on('close', () => this.handleDisconnection(ws));
    
    // Envoyer le message de bienvenue
    this.sendToClient(ws, {
      type: 'welcome',
      message: 'Connecté au service de présence'
    });
  }

  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'identify':
          this.handleIdentification(ws, data);
          break;
        
        case 'updateStatus':
          this.handleStatusUpdate(ws, data);
          break;
        
        case 'typing':
          this.handleTyping(ws, data);
          break;
        
        default:
          console.warn('Type de message non géré:', data.type);
      }
    } catch (err) {
      console.error('Erreur traitement message:', err);
    }
  }

  handleIdentification(ws, data) {
    const { userId, displayName, avatarUrl, status } = data;
    
    // Stocker les informations de l'utilisateur
    const userInfo = {
      userId,
      displayName,
      avatarUrl,
      status: status || USER_STATUS.ONLINE,
      ws
    };
    
    // Si l'utilisateur était déjà connecté, nettoyer l'ancienne connexion
    if (this.users.has(userId)) {
      const oldWs = this.users.get(userId).ws;
      if (oldWs && oldWs !== ws) {
        oldWs.close();
      }
    }
    
    this.users.set(userId, userInfo);
    
    // Confirmer l'identification
    this.sendToClient(ws, {
      type: 'identified',
      userId
    });
    
    // Notifier les autres utilisateurs
    this.broadcastUserJoined(userInfo);
    
    // Envoyer la liste mise à jour des utilisateurs à tout le monde
    this.broadcastPresence();
  }

  handleStatusUpdate(ws, data) {
    const user = this.getUserByWs(ws);
    if (!user) return;

    const { status } = data;
    if (!Object.values(USER_STATUS).includes(status)) {
      console.warn('Statut invalide:', status);
      return;
    }

    user.status = status;
    this.broadcastPresence();
  }

  handleTyping(ws, data) {
    const user = this.getUserByWs(ws);
    if (!user) return;

    const { isTyping } = data;
    
    // Mettre à jour l'état de frappe
    if (isTyping) {
      this.typingUsers.add(user.userId);
    } else {
      this.typingUsers.delete(user.userId);
    }
    
    // Diffuser l'état de frappe
    this.broadcast({
      type: 'typing',
      user: this.sanitizeUser(user),
      isTyping
    }, ws);
  }

  handleDisconnection(ws) {
    const user = this.getUserByWs(ws);
    if (!user) return;

    // Nettoyer les états
    this.users.delete(user.userId);
    this.typingUsers.delete(user.userId);
    
    // Notifier les autres utilisateurs
    this.broadcastUserLeft(user);
    
    // Mettre à jour la liste des utilisateurs
    this.broadcastPresence();
  }

  broadcastUserJoined(user) {
    this.broadcast({
      type: 'userJoined',
      user: this.sanitizeUser(user)
    }, user.ws);
  }

  broadcastUserLeft(user) {
    this.broadcast({
      type: 'userLeft',
      user: this.sanitizeUser(user)
    });
  }

  broadcastPresence() {
    const users = Array.from(this.users.values()).map(user => this.sanitizeUser(user));
    this.broadcast({
      type: 'presence',
      users
    });
  }

  getUserByWs(ws) {
    for (const user of this.users.values()) {
      if (user.ws === ws) {
        return user;
      }
    }
    return null;
  }

  sanitizeUser(user) {
    // Ne pas envoyer la connexion WebSocket aux clients
    const { ws, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  sendToClient(ws, data) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify(data));
    }
  }

  broadcast(data, excludeWs = null) {
    const message = JSON.stringify(data);
    this.users.forEach(user => {
      if (user.ws !== excludeWs) {
        this.sendToClient(user.ws, data);
      }
    });
  }
}

const presenceManager = new PresenceManager();
export default presenceManager;
