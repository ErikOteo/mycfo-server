import { Container, Typography, Alert, Grid } from "@mui/material";
import NotificationCard from "./NotificationCard";
import { useNotifications } from "../../hooks/useNotifications";

export default function ListaNotificaciones({ userId = 1 }) {
  const { items, unread, loading, error, markOneRead } =
    useNotifications(userId);

  if (loading)
    return (
      <Container sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Cargando notificaciones...
        </Typography>
      </Container>
    );
  if (error)
    return (
      <Container sx={{ mt: 2 }}>
        <Alert severity="error">
          No se pudieron cargar las notificaciones.
        </Alert>
      </Container>
    );

  return (
    <Container sx={{ mt: 2 }} maxWidth={false}>
      <Typography variant="h5" gutterBottom>
        Notificaciones {unread > 0 ? `(${unread} sin leer)` : ""}
      </Typography>

      <Grid
        container
        spacing={2}
        sx={{
          alignItems: "stretch",
          gridAutoRows: "1fr",
        }}
      >
        {items.map((n) => (
          <Grid
            item
            key={n.id}
            xs={12}
            sm={6}
            md={6}
            sx={{ display: "flex", minWidth: 0 }}
          >
            <NotificationCard
              titulo={n.title}
              mensaje={n.body}
              fecha={new Date(n.date).toLocaleDateString()}
              tipo={n.badge} // "Movimiento", "Recordatorio", etc.
              isRead={n.is_read}
              onClick={() => markOneRead(n.id)}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
