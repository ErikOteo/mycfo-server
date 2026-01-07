import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook personalizado para cargar datos de manera lazy y eficiente
 * Evita cargas innecesarias y mejora el rendimiento de navegación
 */
export const useLazyData = (dataLoader, dependencies = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const {
    delay = 100, // Delay mínimo antes de mostrar loading
    cacheTime = 30000, // Tiempo de cache en ms
    retryCount = 1,
    retryDelay = 1000
  } = options;

  const loadData = useCallback(async (retryAttempt = 0) => {
    if (!mountedRef.current) return;

    // Delay mínimo para evitar flashes de loading
    timeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;

      setLoading(true);
      setError(null);

      try {
        const result = await dataLoader();
        
        if (mountedRef.current) {
          setData(result);
          setInitialized(true);
        }
      } catch (err) {
        if (mountedRef.current) {
          if (retryAttempt < retryCount) {
            // Reintentar después del delay
            setTimeout(() => {
              if (mountedRef.current) {
                loadData(retryAttempt + 1);
              }
            }, retryDelay);
          } else {
            setError(err);
            setInitialized(true);
          }
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }, delay);
  }, [dataLoader, delay, retryCount, retryDelay]);

  const refresh = useCallback(() => {
    setInitialized(false);
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!initialized) {
      loadData();
    }
  }, [loadData, initialized]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Limpiar datos cuando cambian las dependencias
  useEffect(() => {
    if (initialized) {
      setInitialized(false);
      setData(null);
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    initialized,
    refresh
  };
};

export default useLazyData;
