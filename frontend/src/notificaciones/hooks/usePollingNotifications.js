import { useEffect, useRef, useCallback, useState } from "react";
import { getNotifications, getUnreadCount } from "../services/notificationsApi";

export function usePollingNotifications(userId, pollingInterval = 10000) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const lastFetchRef = useRef(null);
  const notificationCallbackRef = useRef(null);
  const unreadCountCallbackRef = useRef(null);

  // Función para obtener notificaciones
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const since = lastFetchRef.current ? new Date(lastFetchRef.current).toISOString() : undefined;
      
      // Obtener notificaciones nuevas (últimas 50)
      const data = await getNotifications({ 
        userId, 
        status: "all", 
        limit: 50,
        since 
      });
      
      // Obtener contador de no leídas usando endpoint dedicado (más eficiente)
      const newUnread = await getUnreadCount(userId);
      const newItems = data.items || [];

      // Actualizar estados
      setItems(newItems);
      setUnread(newUnread);
      setError(null);

      // Llamar callbacks si hay cambios
      if (notificationCallbackRef.current) {
        // Enviar solo notificaciones nuevas
        const newNotifications = newItems.filter(item => 
          !lastFetchRef.current || new Date(item.date) > new Date(lastFetchRef.current)
        );
        newNotifications.forEach(notification => {
          notificationCallbackRef.current(notification);
        });
      }

      if (unreadCountCallbackRef.current && newUnread !== unread) {
        unreadCountCallbackRef.current(newUnread);
      }

      // Actualizar timestamp del último fetch
      lastFetchRef.current = new Date().toISOString();
      
    } catch (err) {
      console.error("Error en polling de notificaciones:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId, unread]);

  // Iniciar polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (userId) {
      // Primera carga inmediata
      fetchNotifications();
      
      // Configurar intervalo de polling
      intervalRef.current = setInterval(() => {
        fetchNotifications();
      }, pollingInterval);
    }
  }, [userId, fetchNotifications, pollingInterval]);

  // Detener polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Configurar callbacks
  const onNotification = useCallback((callback) => {
    notificationCallbackRef.current = callback;
  }, []);

  const onUnreadCountUpdate = useCallback((callback) => {
    unreadCountCallbackRef.current = callback;
  }, []);

  // Efecto para manejar el ciclo de vida del polling
  useEffect(() => {
    if (userId) {
      startPolling();
    } else {
      stopPolling();
      // Resetear estados cuando no hay usuario
      setItems([]);
      setUnread(0);
      setError(null);
      lastFetchRef.current = null;
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
    items,
    unread,
    loading,
    error,
    isConnected: true, // Simpre "conectado" con HTTP
    startPolling,
    stopPolling,
    onNotification,
    onUnreadCountUpdate,
    refresh: fetchNotifications,
  };
}
