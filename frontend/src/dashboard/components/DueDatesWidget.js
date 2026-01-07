import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import { formatCurrencyAR } from "../../utils/formatters";

const typeLabels = {
  AFIP: { color: "warning", label: "AFIP" },
  Proveedor: { color: "primary", label: "Proveedor" },
  Cliente: { color: "success", label: "Cliente" },
  Tarjeta: { color: "info", label: "Tarjeta" },
};

const DueDatesWidget = ({
  data,
  loading = false,
  error = null,
  onRetry,
  onNavigate,
  onMarkPaid,
  onSendReminder,
}) => {
  if (loading) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader title="Notificaciones" subheader="Procesando recordatorios..." />
        <CardContent>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={56} sx={{ mb: 1.5 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader title="Notificaciones" />
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Alert severity="error">{error}</Alert>
          {onRetry ? (
            <Button variant="outlined" onClick={onRetry}>
              Reintentar
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const dueDates = data ?? [];

  return (
    <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        title="Notificaciones"
        subheader="Gestioná AFIP, proveedores y clientes en los próximos 14 días"
      />
      <CardContent sx={{ flexGrow: 1 }}>
        {dueDates.length === 0 ? (
          <Stack spacing={2} alignItems="flex-start">
            <Stack direction="row" spacing={1} alignItems="center">
              <EventBusyRoundedIcon color="warning" />
              <Typography variant="body2" color="text.secondary">
                No hay vencimientos próximos registrados.
              </Typography>
            </Stack>
            {onRetry ? (
              <Button variant="contained" onClick={onRetry}>
                Sincronizar cuentas
              </Button>
            ) : null}
          </Stack>
        ) : (
          <List dense disablePadding>
            {dueDates.map((item) => {
              const meta = typeLabels[item.type] ?? { color: "default", label: item.type };
              const formattedDate = new Date(item.date).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short",
              });

              return (
                <ListItem
                  key={item.id}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    mb: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2">{item.name}</Typography>
                        <Chip label={meta.label} color={meta.color} size="small" variant="outlined" />
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Vence: <b>{formattedDate}</b>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Monto: <b>{formatCurrencyAR(item.amount)}</b>
                        </Typography>
                      </Stack>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Enviar recordatorio">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onSendReminder?.(item)}
                        >
                          <SendRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Marcar pagado">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => onMarkPaid?.(item)}
                        >
                          <TaskAltRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
      <CardActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onNavigate} disabled={!onNavigate}>
          Ver más
        </Button>
      </CardActions>
    </Card>
  );
};

export default DueDatesWidget;
