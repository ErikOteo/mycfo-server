// components/NotificationButton.js

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

  // Polling cada 10s de las notificaciones NO leídas
  React.useEffect(() => {
    if (!isAuthenticated || !userId) {
      setUnread(0);
      setDrawerItems([]);
      return;
    }

    let cancelled = false;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const data = await getNotifications({
          userId,
          status: "unread",
          limit: 50,
        });

        if (cancelled) return;

        const items = data.items || [];

        // La lista de la solapa refleja SIEMPRE el estado del backend (solo no leídas)
        setDrawerItems(items);

        // Actualizar contador para el badge
        const unreadCount =
          typeof data.unread === "number" ? data.unread : items.length;
        setUnread(unreadCount);
      } catch (err) {
        if (!cancelled) {
          // Si el backend responde 304 (Not Modified), lo tomamos como "sin cambios"
          // y mantenemos la lista actual sin marcar error.
          const status = err?.response?.status;
          if (status === 304) {
            return;
          }

          console.error("Error en polling de notificaciones:", err);
          setDrawerError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    // Primera carga inmediata
    fetchNotifications();

    const intervalId = setInterval(fetchNotifications, 10000); // 10 segundos

    return () => {
      cancelled = true;
      clearInterval(intervalId);
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
            disabled={loading}
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
