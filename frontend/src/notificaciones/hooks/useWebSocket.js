import { useEffect, useRef, useCallback } from "react";
import websocketService from "../services/websocketService";

export function useWebSocket(userId) {
  const isConnectedRef = useRef(false);
  const notificationCallbackRef = useRef(null);
  const unreadCountCallbackRef = useRef(null);

  const connect = useCallback(async () => {
    if (isConnectedRef.current) {
      return;
    }

    try {
      await websocketService.connect(userId);
      isConnectedRef.current = true;

      // Suscribirse a notificaciones
      websocketService.subscribeToNotifications(userId, (notification) => {
        if (notificationCallbackRef.current) {
          notificationCallbackRef.current(notification);
        }
        // Emitir evento global
        window.dispatchEvent(
          new CustomEvent("notificationReceived", { detail: notification })
        );
      });

      // Suscribirse a actualizaciones de contador
      websocketService.subscribeToUnreadCount(userId, (count) => {
        if (unreadCountCallbackRef.current) {
          unreadCountCallbackRef.current(count);
        }
        // Emitir evento global
        window.dispatchEvent(
          new CustomEvent("unreadCountUpdated", { detail: count })
        );
      });

      console.log("WebSocket conectado y suscrito para usuario:", userId);
    } catch (error) {
      console.error("Error conectando WebSocket:", error);
      isConnectedRef.current = false;
    }
  }, [userId]);

  const disconnect = useCallback(() => {
    if (isConnectedRef.current) {
      websocketService.disconnect();
      isConnectedRef.current = false;
      console.log("WebSocket desconectado");
    }
  }, []);

  const onNotification = useCallback((callback) => {
    notificationCallbackRef.current = callback;
  }, []);

  const onUnreadCountUpdate = useCallback((callback) => {
    unreadCountCallbackRef.current = callback;
  }, []);

  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected: isConnectedRef.current,
    connect,
    disconnect,
    onNotification,
    onUnreadCountUpdate,
  };
}
