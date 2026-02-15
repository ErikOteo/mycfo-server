import React from "react";
import {
  Box,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";
import Grid from "@mui/material/Grid2";

const TIPOS_FACTURA = ["A", "B", "C", "E", "M"];
const ESTADOS_PAGO = [
  { value: "NO_PAGADO", label: "No Pagado" },
  { value: "PARCIALMENTE_PAGADO", label: "Parcialmente Pagado" },
  { value: "PAGADO", label: "Pagado" },
];

const FacturaFilters = ({ values, onChange, onReset }) => {
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange({
      ...values,
      [name]: value,
    });
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            label="Desde"
            type="date"
            name="fechaDesde"
            value={values.fechaDesde || ""}
            onChange={handleInputChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            label="Hasta"
            type="date"
            name="fechaHasta"
            value={values.fechaHasta || ""}
            onChange={handleInputChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            select
            label="Tipo de factura"
            name="tipoFactura"
            value={values.tipoFactura || ""}
            onChange={handleInputChange}
            fullWidth
          >
            <MenuItem value="">Todas</MenuItem>
            {TIPOS_FACTURA.map((tipo) => (
              <MenuItem key={tipo} value={tipo}>
                {tipo}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            select
            label="Estado de pago"
            name="estadoPago"
            value={values.estadoPago || ""}
            onChange={handleInputChange}
            fullWidth
          >
            <MenuItem value="">Todos</MenuItem>
            {ESTADOS_PAGO.map((estado) => (
              <MenuItem key={estado.value} value={estado.value}>
                {estado.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <Button variant="outlined" onClick={onReset}>
          Limpiar filtros
        </Button>
      </Box>
    </Box>
  );
};

export default FacturaFilters;


