import React, { useEffect, useMemo, useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { TODAS_LAS_CATEGORIAS } from "../../../shared-components/categorias";
import { fetchCategorias } from "../../../shared-services/categoriasService";

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
  const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const [categoriasExtra, setCategoriasExtra] = useState([]);

  useEffect(() => {
    fetchCategorias()
      .then((lista) => setCategoriasExtra(lista))
      .catch(() => setCategoriasExtra([]));
  }, []);

  const categorias = useMemo(
    () => Array.from(new Set([...TODAS_LAS_CATEGORIAS, ...categoriasExtra])),
    [categoriasExtra]
  );

  return (
    <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
      {/* Mes (inicia vacio; label se contrae al elegir) */}
      <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
        <InputLabel id="mes-label">Mes</InputLabel>
        <Select
          labelId="mes-label"
          id="mes-select"
          value={selectedMonth}
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

      {/* Anio */}
      <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
        <InputLabel id="anio-label">Anio</InputLabel>
        <Select
          labelId="anio-label"
          id="anio-select"
          value={selectedYear}
          onChange={onYearChange}
          label="Anio"
        >
          {anios.map((anio) => (
            <MenuItem key={anio} value={anio}>
              {anio}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Categoria */}
      <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
        <InputLabel id="categoria-label" shrink>
          Categoria
        </InputLabel>
        <Select
          labelId="categoria-label"
          id="categoria-select"
          multiple
          displayEmpty
          value={Array.isArray(selectedCategoria) ? selectedCategoria : []}
          onChange={onCategoriaChange}
          label="Categoria"
          renderValue={(selected) => {
            if (!selected || selected.length === 0) {
              return <span style={{ opacity: 0.6 }}>Todas</span>;
            }
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
