import React from "react";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { TODAS_LAS_CATEGORIAS } from "../../../shared-components/categorias";

const Filtros = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  selectedCategoria, // array
  onCategoriaChange,
}) => {
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const años = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  // Usar categorías unificadas
  const categorias = TODAS_LAS_CATEGORIAS;

  return (
    <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
      {/* Mes (inicia vacío; label se contrae al elegir) */}
      <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
        <InputLabel id="mes-label">Mes</InputLabel>
        <Select
          labelId="mes-label"
          id="mes-select"
          value={selectedMonth} // '' inicialmente
          onChange={onMonthChange}
          label="Mes"
        >
          {meses.map((mes, index) => (
            <MenuItem key={index} value={index}>
              {mes}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Año (inicia vacío) */}
      <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
        <InputLabel id="anio-label">Año</InputLabel>
        <Select
          labelId="anio-label"
          id="anio-select"
          value={selectedYear} // '' inicialmente
          onChange={onYearChange}
          label="Año"
        >
          {años.map((año) => (
            <MenuItem key={año} value={año}>
              {año}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Categoría (múltiple): si >1 => "Varios"; si 1 => nombre; si 0 => solo label */}
      <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
        <InputLabel id="categoria-label">Categoría</InputLabel>
        <Select
          labelId="categoria-label"
          id="categoria-select"
          multiple
          value={selectedCategoria} // [] inicialmente
          onChange={onCategoriaChange}
          label="Categoría"
          // Importante: no usamos displayEmpty para que, con [], el label quede visible
          renderValue={(selected) => {
            if (!selected || selected.length === 0) return undefined; // deja solo el label
            if (selected.length === 1) return selected[0];
            return "Varios";
          }}
        >
          {categorias.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default Filtros;
