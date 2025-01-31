import { useState, useEffect, useCallback, useRef } from 'react';

const useWebSocket = (url, options = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const { onMessage, onError, reconnectInterval = 5000 } = options;

  const connect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('Nombre maximum de tentatives de reconnexion atteint');
      return;
    }

    // Ne pas créer une nouvelle connexion si une existe déjà
    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Connexion WebSocket déjà établie ou en cours...');
      return;
    }

    try {
      console.log(`Tentative de connexion WebSocket à: ${url} (tentative ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
      const websocket = new WebSocket(url);
      wsRef.current = websocket;

      websocket.onopen = () => {
        console.log('WebSocket connecté avec succès');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      websocket.onmessage = (event) => {
        console.log('Message WebSocket reçu:', event.data);
        if (onMessage) {
          try {
            const data = JSON.parse(event.data);
            onMessage(data);
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        }
      };

      websocket.onerror = (err) => {
        console.error('Erreur WebSocket:', err);
        setError(err);
        if (onError) {
          onError(err);
        }
      };

      websocket.onclose = (event) => {
        console.log('WebSocket fermé:', event.code, event.reason);
        setIsConnected(false);

        // Incrémenter le compteur de tentatives seulement si ce n'est pas une fermeture volontaire
        if (event.code !== 1000) {
          reconnectAttempts.current += 1;

          // Tentative de reconnexion après un délai, sauf si on a atteint le maximum
          if (reconnectAttempts.current < maxReconnectAttempts) {
            console.log(`Tentative de reconnexion dans ${reconnectInterval}ms...`);
            setTimeout(() => {
              if (!isConnected) {
                connect();
              }
            }, reconnectInterval);
          } else {
            console.log('Nombre maximum de tentatives de reconnexion atteint');
          }
        }
      };
    } catch (err) {
      console.error('Erreur lors de la création du WebSocket:', err);
      setError(err);
      if (onError) {
        onError(err);
      }
    }
  }, [url, onMessage, onError, reconnectInterval, isConnected]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        console.log('Nettoyage de la connexion WebSocket');
        wsRef.current.close(1000, 'Fermeture volontaire');
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Fonction pour envoyer un message
  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket non connecté, impossible d\'envoyer le message');
    }
  }, []);

  return { isConnected, error, sendMessage };
};

export default useWebSocket;
