import React from "react";
import {
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  Button,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  formatDate,
  formatNumber,
  formatMovementDate,
} from "../../utils/formatters";

export default function MainGrid({
  notifications = [],
  onClose,
  unreadCount = 0,
  onMarkAllRead,
  onMarkOneRead,
  userId,
}) {
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleMarkAsRead = async (notificationId) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Llamar al callback que maneja la API y refresco del badge
      if (onMarkOneRead) {
        onMarkOneRead(notificationId);
      }
    } catch (error) {
      console.error("Error marcando como leída:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      if (onMarkAllRead) {
        await onMarkAllRead();
      }
    } catch (error) {
      console.error("Error marcando todas como leídas:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRIT":
        return "error";
      case "WARN":
        return "warning";
      case "INFO":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {unreadCount > 0 && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            {unreadCount} sin leer
          </Typography>
          <Button size="small" onClick={handleMarkAllRead} disabled={loading}>
            Marcar todas como leídas
          </Button>
        </Stack>
      )}

      <Divider sx={{ mb: 2 }} />

      <List>
        {notifications.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No hay notificaciones
            </Typography>
          </Box>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <ListItem
              key={notification.id}
              disablePadding
              sx={{
                opacity: notification.is_read ? 0.7 : 1,
                borderLeft: notification.is_read ? "none" : "3px solid #2e7d67",
              }}
            >
              <ListItemButton
                onClick={() => {
                  if (!notification.is_read) {
                    handleMarkAsRead(notification.id);
                  }
                }}
                disabled={loading}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: notification.is_read ? "normal" : "bold",
                          flex: 1,
                        }}
                      >
                        {notification.title}
                      </Typography>
                      {/* Badge oculto en el drawer */}
                      {/* <Chip
                        label={notification.badge}
                        size="small"
                        color={getSeverityColor(notification.badge)}
                        variant="outlined"
                      /> */}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        {formatNumber(notification.body)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(notification.date)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>

      {notifications.length > 10 && (
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Button
            size="small"
            onClick={() => {
              onClose(); // Cerrar el drawer
              navigate("/listado-notificaciones"); // Navegar al centro
            }}
          >
            Ver todas ({notifications.length})
          </Button>
        </Box>
      )}
    </Box>
  );
}
