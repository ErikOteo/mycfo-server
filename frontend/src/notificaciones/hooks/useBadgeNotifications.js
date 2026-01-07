import { useEffect, useRef, useCallback, useState } from "react";
import { getUnreadCount } from "../services/notificationsApi";

export function useBadgeNotifications(userId, pollingInterval = 10000) {
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  // Función para obtener el contador de no leídas
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const newUnread = await getUnreadCount(userId);
      
      setUnread(newUnread);
      setError(null);
      
    } catch (err) {
      console.error("Error obteniendo contador de notificaciones:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Iniciar polling para el badge
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (userId) {
      // Primera carga inmediata
      fetchUnreadCount();
      
      // Configurar intervalo de polling ligero (solo contador)
      intervalRef.current = setInterval(() => {
        fetchUnreadCount();
      }, pollingInterval);
    }
  }, [userId, fetchUnreadCount, pollingInterval]);

  // Detener polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Refrescar manualmente
  const refresh = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Efecto para manejar el ciclo de vida del polling
  useEffect(() => {
    if (userId) {
      startPolling();
    } else {
      stopPolling();
      // Resetear estados cuando no hay usuario
      setUnread(0);
      setError(null);
    }

    return () => {
      stopPolling();
    };
  }, [userId, startPolling, stopPolling]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    unread,
    loading,
    error,
    isConnected: true, // Siempre "conectado" con HTTP
    refresh,
  };
}
