import { useEffect, useState, useCallback } from "react";
import { getNotifications, markAsRead } from "../services/notificationsApi";

// Hook de uso general para el "centro de notificaciones"
// - NO hace polling
// - Carga solo cuando el componente se monta (o cuando cambia userId)
// Por defecto trae todas las notificaciones (status="all") y permite marcar sin quitarlas de la lista.
export function useNotifications(userId) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setUnread(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getNotifications({
        userId,
        status: "all",
        limit: 50,
      });

      // El backend devuelve { unread, items: [...] }
      setItems(data.items || []);
      // Si el backend no devuelve unread, usamos items.length
      setUnread(typeof data.unread === "number" ? data.unread : (data.items || []).length);
    } catch (err) {
      console.error("Error obteniendo notificaciones:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Polling cada 60s
  useEffect(() => {
    if (!userId) {
      setItems([]);
      setUnread(0);
      return;
    }

    let cancelled = false;

    const loop = async () => {
      await fetchNotifications();
      if (!cancelled) {
        setTimeout(loop, 60000); // 60 segundos
      }
    };

    // Primera carga inmediata + inicio del loop
    loop();

    return () => {
      cancelled = true;
    };
  }, [fetchNotifications, userId]);

  // Sincronizar cuando la solapa marque como leída (evento global)
  useEffect(() => {
    const handleExternalMarkRead = (event) => {
      const id = event.detail?.id;
      if (!id) return;
      setItems((prev) => prev.filter((n) => n.id !== id));
      setUnread((prev) => Math.max(0, prev - 1));
    };

    const handleExternalMarkAll = () => {
      setItems([]);
      setUnread(0);
    };

    window.addEventListener("notification-mark-read", handleExternalMarkRead);
    window.addEventListener("notification-mark-all-read", handleExternalMarkAll);

    return () => {
      window.removeEventListener("notification-mark-read", handleExternalMarkRead);
      window.removeEventListener("notification-mark-all-read", handleExternalMarkAll);
    };
  }, []);

  const markOneRead = useCallback(
    async (id) => {
      if (!userId) return;

      try {
        await markAsRead({ userId, notifId: id });

        // Marcar en el estado local
        setItems((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          )
        );
        setUnread((prev) => Math.max(0, prev - 1));

        // Notificar a otros componentes (solapa) que esta notificación fue leída
        window.dispatchEvent(
          new CustomEvent("notification-mark-read", { detail: { id } })
        );
      } catch (error) {
        console.error("Error marcando como leída:", error);
      }
    },
    [userId]
  );

  const markAllAsRead = useCallback(
    async () => {
      if (!userId) return;

      try {
        const { markAllRead } = await import("../services/notificationsApi");
        await markAllRead(userId);

        // Marcar todas como leídas en local
        setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnread(0);

        // Notificar a otros componentes (solapa) que todas fueron leídas
        window.dispatchEvent(new CustomEvent("notification-mark-all-read"));
      } catch (error) {
        console.error("Error marcando todas como leídas:", error);
      }
    },
    [userId]
  );

  return {
    items,
    unread,
    loading,
    error,
    reload: fetchNotifications,
    markOneRead,
    markAllAsRead,
    isWebSocketConnected: true, // compatibilidad con código existente
  };
}
