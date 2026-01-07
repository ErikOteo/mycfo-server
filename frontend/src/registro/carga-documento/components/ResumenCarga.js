import React from "react";
import { Stack, Alert, Typography } from "@mui/material";

const ResumenCarga = ({ resumen }) => (
  <Stack sx={{ width: "100%" }} spacing={2}>
    <Typography variant="h6" gutterBottom>
      Resumen de la carga
    </Typography>
    <Alert severity="info" variant="filled" color="info">
      Total de filas procesadas: {resumen.total}
    </Alert>
    <Alert severity="success" variant="filled" color="success">
      Filas importadas correctamente: {resumen.correctos}
    </Alert>
    <Alert
      severity={resumen.errores.length > 0 ? "error" : "success"}
      variant="filled"
      color={resumen.errores.length > 0 ? "error" : "success"}
    >
      Filas con errores: {resumen.errores.length}
    </Alert>
  </Stack>
);

export default ResumenCarga;
