import * as React from 'react';
import { useState, useEffect } from 'react';
import { Box, Typography, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import TablaDinamica from './components/TablaDinamica';
import axios from 'axios';
import ExportadorSimple from '../../shared-components/ExportadorSimple';
import GraficoPorCategoria from './components/GraficoPorCategoria';
import API_CONFIG from '../../config/api-config';

const URL_REGISTRO = API_CONFIG.REGISTRO;

export default function MovimientosCargados() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterModel, setFilterModel] = useState({ items: [] });
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [initialColumnVisibility, setInitialColumnVisibility] = useState({});
  const [error, setError] = useState(null);
  const [vista, setVista] = useState("tabla"); // 👈 Vista actual

  const obtenerRegistros = async () => {
    try {
      console.log("📡 Solicitando datos desde:", `${URL_REGISTRO}/registros`);
      const response = await axios.get(`${URL_REGISTRO}/registros`);
      console.log("✅ Datos recibidos:", response.data);

      setData(response.data);
      setFilteredData(response.data);
      setFilterModel({ items: [] });

      if (response.data.length > 0) {
        const allVisible = Object.keys(response.data[0]).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {});
        setColumnVisibilityModel(allVisible);
        setInitialColumnVisibility(allVisible);
      }
    } catch (err) {
      console.error("❌ Error al obtener los datos:", err);
      setError("No se pudieron cargar los registros");
    }
  };

  const handleChipClick = (categoria) => {
    setFilteredData(
      data.filter(
        (row) => Array.isArray(row.categorias) && row.categorias.includes(categoria)
      )
    );
    setFilterModel({
      items: [
        { id: 1, field: 'categorias', operator: 'contains', value: categoria },
      ],
    });
  };

  const handleResetFiltro = () => {
    setFilteredData(data);
    setFilterModel({ items: [] });
    setColumnVisibilityModel(initialColumnVisibility);
  };

  useEffect(() => {
    obtenerRegistros();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("🔄 Pestaña activa, recargando movimientos...");
        obtenerRegistros();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <Box sx={{ p: 4, mx: "auto", display: "flex", flexDirection: "column", width: "100%", gap: 2 }}>
      <Typography variant="h5" gutterBottom>
        Movimientos cargados
      </Typography>

      {/* Botones de acciones */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2, alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'space-between' } }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          <Button variant="contained" size="medium" sx={{ height: 36 }} onClick={obtenerRegistros}>
            Recargar movimientos
          </Button>
          <Button variant="outlined" size="medium" sx={{ height: 36 }} onClick={handleResetFiltro}>
            Quitar filtro / Reset tabla
          </Button>
        </Box>

        <Box sx={{ mt: { xs: 1, sm: 0 } }}>
          <ExportadorSimple
            onExportPdf={() => alert('Exportar como PDF')}
            onExportExcel={() => alert('Exportar como Excel')}
            sx={{
              display: 'flex',
              gap: 1,
              '& button': {
                minWidth: 40,
                padding: '6px 8px',
                borderRadius: 1,
                height: 36,
                fontSize: '0.9rem',
              },
            }}
          />
        </Box>
      </Box>

      

      {error && <Typography color="error">{error}</Typography>}

      {/* Render condicional */}
      {vista === "tabla" ? (
        <TablaDinamica
          data={filteredData}
          onChipClick={handleChipClick}
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={setColumnVisibilityModel}
        />
      ) : (
        <GraficoPorCategoria data={filteredData} />
      )}
    </Box>
  );
}
