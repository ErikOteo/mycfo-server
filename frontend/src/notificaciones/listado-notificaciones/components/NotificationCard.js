import { Card, CardContent, Typography, Chip, Stack } from "@mui/material";

export default function NotificationCard({
  titulo,
  mensaje,
  fecha,
  tipo,
  isRead,
  onClick,
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: 1,
        opacity: isRead ? 0.6 : 1,
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          flex: 1,
          minWidth: 0,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
          sx={{ minWidth: 0, gap: 1 }}
        >
          <Typography
            variant="h6"
            sx={{
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              flex: 1,
              minWidth: 0,
            }}
          >
            {titulo}
          </Typography>
          <Chip label={tipo} size="small" sx={{ flexShrink: 0 }} />
        </Stack>

        {mensaje ? (
          <Typography
            variant="body1"
            color="text.primary"
            sx={{
              whiteSpace: "normal",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
              lineHeight: 1.35,
            }}
          >
            {mensaje}
          </Typography>
        ) : null}

        <Typography variant="body2" color="text.secondary">
          {fecha}
        </Typography>
      </CardContent>
    </Card>
  );
}
