import { useState, useEffect, useCallback } from 'react';

const VIDEO_CACHE_SIZE = 10; // Nombre maximum de vidéos en mémoire

export function useVideoCache() {
  const [cache, setCache] = useState(new Map());
  
  // Nettoyer le cache quand il devient trop grand
  const cleanCache = useCallback(() => {
    if (cache.size > VIDEO_CACHE_SIZE) {
      const entries = Array.from(cache.entries());
      // Garder les VIDEO_CACHE_SIZE plus récentes entrées
      const toKeep = entries.slice(-VIDEO_CACHE_SIZE);
      
      // Révoquer les URLs des vidéos supprimées
      entries.slice(0, -VIDEO_CACHE_SIZE).forEach(([_, url]) => {
        URL.revokeObjectURL(url);
      });
      
      setCache(new Map(toKeep));
    }
  }, [cache]);

  // Ajouter une vidéo au cache
  const cacheVideo = useCallback((videoId, blob) => {
    if (!cache.has(videoId)) {
      const url = URL.createObjectURL(blob);
      setCache(prev => {
        const next = new Map(prev);
        next.set(videoId, url);
        return next;
      });
    }
  }, [cache]);

  // Récupérer une vidéo du cache
  const getCachedVideo = useCallback((videoId) => {
    return cache.get(videoId);
  }, [cache]);

  // Nettoyer le cache périodiquement
  useEffect(() => {
    const interval = setInterval(cleanCache, 30000); // Toutes les 30 secondes
    return () => clearInterval(interval);
  }, [cleanCache]);

  // Nettoyer toutes les URLs à la fermeture
  useEffect(() => {
    return () => {
      cache.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  return {
    cacheVideo,
    getCachedVideo
  };
}
