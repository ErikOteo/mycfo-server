import { useRef, useCallback } from 'react';

/**
 * Hook para cachear datos y evitar llamadas innecesarias
 * Especialmente útil para componentes que se navegan frecuentemente
 */
export const useDataCache = (key, dataLoader, options = {}) => {
  const cacheRef = useRef(new Map());
  const loadingRef = useRef(new Set());
  const { ttl = 30000 } = options; // 30 segundos por defecto

  const getCachedData = useCallback(() => {
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }, [key, ttl]);

  const loadData = useCallback(async () => {
    // Evitar múltiples llamadas simultáneas
    if (loadingRef.current.has(key)) {
      return getCachedData();
    }

    const cached = getCachedData();
    if (cached) {
      return cached;
    }

    loadingRef.current.add(key);
    
    try {
      const data = await dataLoader();
      cacheRef.current.set(key, {
        data,
        timestamp: Date.now()
      });
      return data;
    } finally {
      loadingRef.current.delete(key);
    }
  }, [key, dataLoader, getCachedData]);

  const clearCache = useCallback(() => {
    cacheRef.current.delete(key);
  }, [key]);

  const clearAllCache = useCallback(() => {
    cacheRef.current.clear();
    loadingRef.current.clear();
  }, []);

  return {
    loadData,
    getCachedData,
    clearCache,
    clearAllCache
  };
};

export default useDataCache;
