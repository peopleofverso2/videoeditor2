import { WS_URL } from '../constants/api';
import { USER_STATUS } from '../types/presence';

class PresenceService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.listeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000;
    this.typingTimeouts = new Map();
    this.typingInterval = 2000; // 2 secondes avant de considérer que l'utilisateur ne tape plus
    
    // Info utilisateur temporaire pour les tests
    this.userInfo = {
      userId: 'test-user-1',
      displayName: 'Test User',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=test-user-1`,
      status: USER_STATUS.ONLINE
    };
  }

  connect() {
    if (this.ws?.readyState === WebSocket.CONNECTING || 
        this.ws?.readyState === WebSocket.OPEN) {
      console.log('Déjà connecté ou en cours de connexion');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Nombre maximum de tentatives de reconnexion atteint');
      return;
    }

    try {
      console.log(`Tentative de connexion WebSocket (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('WebSocket connecté');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyListeners({ type: 'connection', status: true });
        
        // Envoyer l'identification immédiatement
        this.identify();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Message reçu:', data);
          
          // Gérer les notifications de présence
          if (data.type === 'userJoined') {
            this.notifyListeners({ 
              type: 'notification',
              message: `${data.user.displayName} a rejoint la session`
            });
          } else if (data.type === 'userLeft') {
            this.notifyListeners({ 
              type: 'notification',
              message: `${data.user.displayName} a quitté la session`
            });
          }
          
          this.notifyListeners({ type: 'message', data });
        } catch (err) {
          console.error('Erreur parsing message:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        this.notifyListeners({ type: 'error', error });
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket fermé:', event.code, event.reason);
        this.isConnected = false;
        this.ws = null;
        this.notifyListeners({ type: 'connection', status: false });

        if (event.code !== 1000) {
          this.reconnectAttempts++;
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`Reconnexion dans ${this.reconnectInterval}ms...`);
            setTimeout(() => this.connect(), this.reconnectInterval);
          }
        }
      };
    } catch (err) {
      console.error('Erreur création WebSocket:', err);
      this.notifyListeners({ type: 'error', error: err });
    }
  }

  identify() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'identify',
        ...this.userInfo
      }));
    }
  }

  updateStatus(status) {
    if (!Object.values(USER_STATUS).includes(status)) {
      console.error('Statut invalide:', status);
      return;
    }

    this.userInfo.status = status;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'updateStatus',
        status
      }));
    }
  }

  startTyping() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'typing',
        isTyping: true
      }));

      // Réinitialiser le timeout existant s'il y en a un
      if (this.typingTimeouts.has(this.userInfo.userId)) {
        clearTimeout(this.typingTimeouts.get(this.userInfo.userId));
      }

      // Définir un nouveau timeout
      const timeout = setTimeout(() => {
        this.stopTyping();
      }, this.typingInterval);

      this.typingTimeouts.set(this.userInfo.userId, timeout);
    }
  }

  stopTyping() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'typing',
        isTyping: false
      }));

      // Nettoyer le timeout
      if (this.typingTimeouts.has(this.userInfo.userId)) {
        clearTimeout(this.typingTimeouts.get(this.userInfo.userId));
        this.typingTimeouts.delete(this.userInfo.userId);
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Déconnexion volontaire');
      this.ws = null;
      this.isConnected = false;
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
    // Envoyer l'état actuel au nouveau listener
    callback({ type: 'connection', status: this.isConnected });
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('Erreur notification listener:', err);
      }
    });
  }
}

// Créer une instance unique du service
const presenceService = new PresenceService();
export default presenceService;
