import { useState, useEffect, useCallback } from 'react';

const useWebSocket = (url, options = {}) => {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const { onMessage, onError, reconnectInterval = 5000 } = options;

  const connect = useCallback(() => {
    try {
      const websocket = new WebSocket(url);

      websocket.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      websocket.onmessage = (event) => {
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
        setError(err);
        if (onError) {
          onError(err);
        }
      };

      websocket.onclose = () => {
        setIsConnected(false);
        // Tentative de reconnexion après un délai
        setTimeout(() => {
          if (!isConnected) {
            connect();
          }
        }, reconnectInterval);
      };

      setWs(websocket);
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
    }
  }, [url, onMessage, onError, reconnectInterval, isConnected]);

  useEffect(() => {
    connect();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify(data));
    }
  }, [ws, isConnected]);

  return {
    isConnected,
    error,
    sendMessage
  };
};

export default useWebSocket;
