import React from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  MenuItem,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const numberFieldProps = {
  type: "number",
  inputProps: { min: 1, step: 1 },
  fullWidth: true,
  size: "small",
};

export default function ExcelLibreMapper({ value = {}, onChange, onOpenHelp }) {
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
      <Box
        sx={{
          mb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Mapeo de columnas
        </Typography>
        <Tooltip title="Guia de mapeo libre">
          <IconButton
            onClick={onOpenHelp}
            size="small"
            color="primary"
            sx={{
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
              "&:hover": { bgcolor: "action.selected" },
            }}
          >
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Indica que columna corresponde a cada campo. El conteo es desde 1:
        columna A = 1, B = 2, C = 3.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }} justifyContent="center">
        <Grid
          item
          xs={12}
          sm={4}
          sx={{ display: "flex", justifyContent: "center" }}
        >
          <TextField
            label="Fecha *"
            {...numberFieldProps}
            value={columnMap.fecha ?? ""}
            onChange={(e) => updateColumn("fecha", e.target.value)}
            sx={{ maxWidth: 320 }}
          />
        </Grid>
        <Grid
          item
          xs={12}
          sm={4}
          sx={{ display: "flex", justifyContent: "center" }}
        >
          <TextField
            label="Descripcion *"
            {...numberFieldProps}
            value={columnMap.descripcion ?? ""}
            onChange={(e) => updateColumn("descripcion", e.target.value)}
            sx={{ maxWidth: 320 }}
          />
        </Grid>
        <Grid
          item
          xs={12}
          sm={4}
          sx={{ display: "flex", justifyContent: "center" }}
        >
          <TextField
            label="Monto *"
            {...numberFieldProps}
            value={columnMap.monto ?? ""}
            onChange={(e) => updateColumn("monto", e.target.value)}
            sx={{ maxWidth: 320 }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} justifyContent="center">
        <Grid
          item
          xs={12}
          sm={4}
          sx={{ display: "flex", justifyContent: "center" }}
        >
          <TextField
            label="Fila donde empiezan los datos *"
            {...numberFieldProps}
            value={value.dataStartRow ?? 2}
            onChange={(e) =>
              handleChange(
                "dataStartRow",
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            sx={{ maxWidth: 320 }}
          />
        </Grid>
        <Grid
          item
          xs={12}
          sm={4}
          sx={{ display: "flex", justifyContent: "center" }}
        >
          <TextField
            select
            label="Formato de fecha"
            fullWidth
            size="small"
            value={value.dateFormat ?? "dd/MM/yyyy"}
            onChange={(e) => handleChange("dateFormat", e.target.value)}
            sx={{ maxWidth: 320 }}
          >
            <MenuItem value="dd/MM/yyyy">dd/MM/yyyy (31/01/2026)</MenuItem>
            <MenuItem value="dd-MM-yyyy">dd-MM-yyyy (31-01-2026)</MenuItem>
            <MenuItem value="yyyy-MM-dd">yyyy-MM-dd (2026-01-31)</MenuItem>
            <MenuItem value="MM/dd/yyyy">MM/dd/yyyy (01/31/2026)</MenuItem>
          </TextField>
        </Grid>
      </Grid>
    </Paper>
  );
}
