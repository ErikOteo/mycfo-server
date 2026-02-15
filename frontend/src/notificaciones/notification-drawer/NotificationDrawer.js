import React from "react";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import MainGrid from "./components/MainGrid";
import { useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export default function NotificationDrawer({
  open,
  onClose,
  notifications = [],
  unreadCount = 0,
  loading = false,
  error = null,
  onMarkAllRead,
  onMarkOneRead,
  userId,
}) {
  const navigate = useNavigate();
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: 400,
          maxWidth: "90vw",
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center" }}>
        <Tooltip title="Ver todas las notificaciones">
          <IconButton
            onClick={() => {
              navigate("/listado-notificaciones");
              onClose();
            }}
            size="small"
            sx={{ mr: 1 }}
          >
            <OpenInNewIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" component="h2">
          Notificaciones
          {unreadCount > 0 && (
            <Typography
              component="span"
              variant="body2"
              color="error"
              sx={{ ml: 1 }}
            >
              ({unreadCount} sin leer)
            </Typography>
          )}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto" }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Cargando notificaciones...
            </Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">
              Error al cargar las notificaciones: {error.message}
            </Alert>
          </Box>
        )}

        {!loading && !error && (
          <MainGrid
            notifications={notifications}
            onClose={onClose}
            unreadCount={unreadCount}
            onMarkAllRead={onMarkAllRead}
            onMarkOneRead={onMarkOneRead}
            userId={userId}
          />
        )}
      </Box>
    </Drawer>
  );
}
