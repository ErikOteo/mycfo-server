import React from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  MenuItem,
  Paper,
  Divider,
} from "@mui/material";

const numberFieldProps = {
  type: "number",
  inputProps: { min: 0, step: 1 },
  fullWidth: true,
  size: "small",
};

export default function ExcelLibreMapper({ value = {}, onChange }) {
  const handleChange = (key, newValue) => {
    onChange?.({
      ...value,
      [key]: newValue,
    });
  };

  const columnMap = value.columnMap || {};

  const updateColumn = (key, v) => {
    const parsed = v === "" ? undefined : Number(v);
    handleChange("columnMap", { ...columnMap, [key]: parsed });
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
        Mapeo de columnas
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Indicá qué columna corresponde a cada campo. Ej: si la fecha está en la
        columna A, usá 0; B es 1; C es 2.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Fecha *"
            {...numberFieldProps}
            value={columnMap.fecha ?? ""}
            onChange={(e) => updateColumn("fecha", e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Descripción *"
            {...numberFieldProps}
            value={columnMap.descripcion ?? ""}
            onChange={(e) => updateColumn("descripcion", e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Monto *"
            {...numberFieldProps}
            value={columnMap.monto ?? ""}
            onChange={(e) => updateColumn("monto", e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            label="Medio de pago"
            {...numberFieldProps}
            value={columnMap.mediopago ?? ""}
            onChange={(e) => updateColumn("mediopago", e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="Origen/Referencia"
            {...numberFieldProps}
            value={columnMap.origen ?? ""}
            onChange={(e) => updateColumn("origen", e.target.value)}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Fila de inicio de datos (1 = primera)"
            {...numberFieldProps}
            value={value.dataStartRow ?? 2}
            onChange={(e) =>
              handleChange(
                "dataStartRow",
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Formato de fecha"
            placeholder="dd/MM/yyyy"
            fullWidth
            size="small"
            value={value.dateFormat ?? "dd/MM/yyyy"}
            onChange={(e) => handleChange("dateFormat", e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Separador decimal"
            fullWidth
            size="small"
            value={value.decimalSeparator ?? ","}
            onChange={(e) => handleChange("decimalSeparator", e.target.value)}
          >
            <MenuItem value=",">Coma (,)</MenuItem>
            <MenuItem value=".">Punto (.)</MenuItem>
          </TextField>
        </Grid>
      </Grid>
    </Paper>
  );
}
