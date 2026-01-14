import React from "react";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import NotificationDrawer from "../notification-drawer/NotificationDrawer";
import Box from "@mui/material/Box";
import { useAuth } from "../../hooks/useAuth";
import {
  getNotifications,
  markAsRead,
  markAllRead,
} from "../services/notificationsApi";

export default function NotificationButton(props) {
  const [openDrawer, setOpenDrawer] = React.useState(false);

  // Obtener userId del estado de autenticación
  const { userId, isAuthenticated } = useAuth();
  
  // Estado compartido para badge y drawer
  const [unread, setUnread] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [drawerItems, setDrawerItems] = React.useState([]);
  const [drawerLoading, setDrawerLoading] = React.useState(false);
  const [drawerError, setDrawerError] = React.useState(null);

  // Lógica de Smart Polling (reemplaza a setInterval)
  React.useEffect(() => {
    // Si no hay usuario, limpiamos y no hacemos nada
    if (!isAuthenticated || !userId) {
      setUnread(0);
      setDrawerItems([]);
      return;
    }

    // 1. Controlador para cancelar la petición si el componente se desmonta
    const controller = new AbortController();
    let timeoutId;

    const fetchNotifications = async () => {
      try {
        // Solo mostramos loading visual en la primera carga si la lista está vacía
        if (drawerItems.length === 0) {
            setLoading(true);
        }

        // Pasamos la señal de cancelación a la API (requiere actualización en notificationsApi.js)
        const data = await getNotifications({
          userId,
          status: "unread",
          limit: 50,
          signal: controller.signal, 
        });

        const items = data.items || [];

        // La lista de la solapa refleja el estado del backend
        setDrawerItems(items);

        // Actualizar contador para el badge
        const unreadCount = typeof data.unread === "number" ? data.unread : items.length;
        setUnread(unreadCount);
        
        // Si tuvo éxito, limpiamos errores previos de red
        setDrawerError(null);

      } catch (err) {
        // Si el error es por cancelación (usuario salió de pantalla), no hacemos nada
        if (err.name === 'CanceledError' || err.code === "ERR_CANCELED") {
            return;
        }

        // Ignoramos errores 304 (Not Modified)
        const status = err?.response?.status;
        if (status !== 304) {
          console.error("Error en polling de notificaciones:", err.message);
          // Opcional: setDrawerError(err); // Descomentar si quieres mostrar alerta visual
        }
      } finally {
        setLoading(false);
        
        // 2. SMART POLLING:
        // Solo programamos la SIGUIENTE llamada cuando la actual terminó.
        // Y solo si el componente sigue montado (signal no abortada).
        if (!controller.signal.aborted) {
            // Aumentado a 15 segundos para dar respiro al servidor
            timeoutId = setTimeout(fetchNotifications, 15000); 
        }
      }
    };

    // Iniciar el ciclo
    fetchNotifications();

    // Cleanup: Se ejecuta si el usuario cambia de página o cierra sesión
    return () => {
      controller.abort(); // Cancela petición de red en curso
      clearTimeout(timeoutId); // Cancela el timer pendiente
    };
  }, [isAuthenticated, userId]);

  // Sincronizar cuando el centro marque como leída (evento global)
  React.useEffect(() => {
    const handleExternalMarkRead = (event) => {
      const id = event.detail?.id;
      if (!id) return;
      setDrawerItems((prev) => prev.filter((n) => n.id !== id));
      setUnread((prev) => Math.max(0, prev - 1));
    };

    const handleExternalMarkAll = () => {
      setDrawerItems([]);
      setUnread(0);
    };

    window.addEventListener("notification-mark-read", handleExternalMarkRead);
    window.addEventListener("notification-mark-all-read", handleExternalMarkAll);

    return () => {
      window.removeEventListener("notification-mark-read", handleExternalMarkRead);
      window.removeEventListener("notification-mark-all-read", handleExternalMarkAll);
    };
  }, []);

  const handleOpenDrawer = () => {
    if (!isAuthenticated || !userId) return;
    setOpenDrawer(true);
  };

  const handleCloseDrawer = () => {
    setOpenDrawer(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!isAuthenticated || !userId) return;
    
    try {
      await markAllRead(userId);
      
      // Eliminar todas las notificaciones del drawer (están leídas)
      setDrawerItems([]);
      setUnread(0);

      // Notificar a otros componentes (centro) que todas fueron leídas
      window.dispatchEvent(new CustomEvent("notification-mark-all-read"));
    } catch (error) {
      console.error("Error marcando todas como leídas:", error);
    }
  };

  const handleMarkOneAsRead = async (notifId) => {
    if (!isAuthenticated || !userId) return;
    
    try {
      await markAsRead({ userId, notifId });
      
      // Eliminar la notificación del drawer (está leída)
      setDrawerItems(prev => prev.filter(n => n.id !== notifId));
      setUnread(prev => Math.max(0, prev - 1));

      // Notificar a otros componentes (centro) que esta notificación fue leída
      window.dispatchEvent(new CustomEvent("notification-mark-read", { detail: { id: notifId } }));
    } catch (error) {
      console.error("Error marcando notificación como leída:", error);
    }
  };

  return (
    <React.Fragment>
      <Box
        sx={(theme) => ({
          verticalAlign: "bottom",
          display: "inline-flex",
          width: "2.25rem",
          height: "2.25rem",
          borderRadius: (theme.vars || theme).shape.borderRadius,
          border: "1px solid",
          borderColor: (theme.vars || theme).palette.divider,
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Tooltip
          title={`Notificaciones (${unread} sin leer)`}
        >
          <IconButton
            onClick={handleOpenDrawer}
            disableRipple
            size="small"
            aria-label="Open notifications"
            disabled={loading && drawerItems.length === 0} // Solo deshabilitar si carga por primera vez
            sx={(theme) => ({
              color: (theme.vars || theme).palette.text.primary,
              transition: 'color 0.2s, background-color 0.2s',
              '&:hover': {
                backgroundColor:
                  (theme.vars || theme).palette.mode === "light"
                    ? "#fff"
                    : "rgba(255,255,255,0.08)",
                color: (theme.vars || theme).palette.text.primary,
              },
            })}
            {...props}
          >
            <Badge
              badgeContent={unread}
              color="error"
              overlap="circular"
              max={99}
            >
              <NotificationsRoundedIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>

      <NotificationDrawer
        open={openDrawer}
        onClose={handleCloseDrawer}
        notifications={drawerItems}
        unreadCount={unread}
        loading={drawerLoading}
        error={drawerError}
        onMarkAllRead={handleMarkAllAsRead}
        onMarkOneRead={handleMarkOneAsRead}
        userId={userId}
      />
    </React.Fragment>
  );
}