import { useState, useCallback } from 'react';

const videoCache = new Map();

export function useVideoCache() {
  const [loading, setLoading] = useState(false);

  const preloadVideo = useCallback(async (url) => {
    if (videoCache.has(url)) {
      return videoCache.get(url);
    }

    setLoading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      videoCache.set(url, objectUrl);
      return objectUrl;
    } catch (error) {
      console.error('Error preloading video:', error);
      return url;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCachedVideo = useCallback((url) => {
    return videoCache.get(url) || url;
  }, []);

  const clearCache = useCallback(() => {
    videoCache.forEach((objectUrl) => {
      URL.revokeObjectURL(objectUrl);
    });
    videoCache.clear();
  }, []);

  return {
    preloadVideo,
    getCachedVideo,
    clearCache,
    loading
  };
}
