import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import ListaNotificaciones from "./ListaNotificaciones";

export default function MainGrid() {
  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" }, p: 2 }}>
      <Typography component="h2" variant="h5" sx={{ mb: 2 }}>
        Notificaciones
      </Typography>
      <ListaNotificaciones />
    </Box>
  );
}
