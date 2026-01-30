import { useEffect, useState, useCallback } from "react";
import { getNotifications, markAsRead } from "../services/notificationsApi";

// Hook de uso general para el "centro de notificaciones"
// - NO hace polling
// - Carga solo cuando el componente se monta (o cuando cambia userId)
// - Solo trae notificaciones NO leídas (status="unread")
export function useNotifications(userId) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (options = {}) => {
    const { isBackground = false } = options;

    if (!userId) {
      setItems([]);
      setUnread(0);
      return;
    }

    try {
      if (!isBackground) {
        setLoading(true);
      }
      setError(null);

      const data = await getNotifications({
        userId,
        status: "unread",
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
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, [userId]);

  // Polling cada 10s igual que la solapa (drawer)
  useEffect(() => {
    if (!userId) {
      setItems([]);
      setUnread(0);
      return;
    }

    let cancelled = false;

    const loop = async () => {
      // La primera vez (o al cambiar userId) podría no ser background si queremos mostrar spinner,
      // pero como este efecto corre después del montaje, podemos asumir que la primera carga
      // explicita (si la hubiese) o este loop manejan la carga.
      // Para simplificar y mantener comportamiento:
      // La primera ejecución del loop será isBackground: false (para mostrar spinner inicial)
      // Las siguientes serán isBackground: true.

      // NOTA: Para evitar race conditions con el "loop", idealmente deberíamos tener un flag.
      // Pero dado el código actual, haremos que la PRIMERA de este efecto sea con loading
      // y las subsiguientes (setTimeout) sean background.

      await fetchNotifications({ isBackground: false });

      if (!cancelled) {
        const runBackgroundLoop = async () => {
          if (cancelled) return;
          await fetchNotifications({ isBackground: true });
          if (!cancelled) setTimeout(runBackgroundLoop, 10000);
        };
        setTimeout(runBackgroundLoop, 10000);
      }
    };

    // Sin embargo, para no complicar la lógica del loop recursivo original:
    const simpleLoop = async (firstTime) => {
      if (cancelled) return;
      await fetchNotifications({ isBackground: !firstTime });
      if (!cancelled) {
        setTimeout(() => simpleLoop(false), 10000);
      }
    }

    simpleLoop(true);

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

        // Eliminar del listado local (porque ya está leída y no debe mostrarse)
        setItems((prev) => prev.filter((n) => n.id !== id));
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

        // Vaciar listado local (todas quedan leídas y no deben mostrarse)
        setItems([]);
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
