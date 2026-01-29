import * as React from 'react';
import { useState, useEffect } from 'react';
import { Box, Typography, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import TablaDinamica from './components/TablaDinamica';
import axios from 'axios';
import ExportadorSimple from '../../shared-components/ExportadorSimple';
import GraficoPorCategoria from './components/GraficoPorCategoria';
import API_CONFIG from '../../config/api-config';
import { exportToExcel } from '../../utils/exportExcelUtils';
import { exportPdfReport } from '../../utils/exportPdfUtils';
import { useChatbotScreenContext } from '../../shared-components/useChatbotScreenContext';

const URL_REGISTRO = API_CONFIG.REGISTRO;

export default function MovimientosCargados() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterModel, setFilterModel] = useState({ items: [] });
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [initialColumnVisibility, setInitialColumnVisibility] = useState({});
  const [error, setError] = useState(null);
  const [vista, setVista] = useState("tabla"); // Vista actual
  const [logoDataUrl, setLogoDataUrl] = useState(null);

  const visibleRows = filteredData.length > 0 ? filteredData : data;
  const sampleRows = React.useMemo(() => {
    const rows = Array.isArray(visibleRows) ? visibleRows : [];
    return rows.slice(0, 5).map((row) => ({
      id: row.id ?? row.uuid ?? row.codigo ?? null,
      tipo: row.tipo ?? row.tipoMovimiento ?? row.tipoOperacion ?? null,
      montoTotal: row.montoTotal ?? row.monto ?? row.importe ?? null,
      moneda: row.moneda ?? row.monedaCodigo ?? null,
      fechaEmision: row.fechaEmision ?? row.fecha ?? row.fechaRegistro ?? null,
      categoria: row.categoria ?? row.categoriaNombre ?? row.categoriaDescripcion ?? null,
      categorias: Array.isArray(row.categorias) ? row.categorias : undefined,
    }));
  }, [visibleRows]);

  const chatbotContext = React.useMemo(
    () => ({
      screen: "movimientos-cargados",
      vista,
      totalRegistros: data.length,
      registrosFiltrados: filteredData.length,
      filtrosActivos: filterModel?.items ?? [],
      muestra: sampleRows,
    }),
    [vista, data.length, filteredData.length, filterModel, sampleRows]
  );

  useChatbotScreenContext(chatbotContext);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await fetch('/logo512.png');
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoDataUrl(reader.result);
        reader.readAsDataURL(blob);
      } catch {
        setLogoDataUrl(null);
      }
    };
    loadLogo();
  }, []);

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

  const formatValue = (value) => {
    if (value == null) return '';
    if (Array.isArray(value)) return value.join(', ');
    if (value instanceof Date) return value.toLocaleString();
    const asDate = new Date(value);
    if (typeof value === 'string' && !Number.isNaN(asDate.getTime()) && value.match(/\\d{4}-\\d{2}-\\d{2}/)) {
      return asDate.toLocaleString();
    }
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  };

  const handleExportExcel = () => {
    const rows = filteredData.length > 0 ? filteredData : data;
    if (!rows || rows.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const visibleKeys = Object.keys(columnVisibilityModel).filter((k) => columnVisibilityModel[k] !== false);
    const keys = visibleKeys.length > 0 ? visibleKeys : Object.keys(rows[0] || {});
    if (keys.length === 0) {
      alert('No hay columnas seleccionadas para exportar.');
      return;
    }

    const headers = keys.map((k) => k.charAt(0).toUpperCase() + k.slice(1));
    const excelData = [
      headers,
      ...rows.map((row) => keys.map((k) => formatValue(row[k]))),
    ];

    const colsConfig = keys.map(() => ({ wch: 20 }));

    exportToExcel(
      excelData,
      'Movimientos',
      'Movimientos',
      colsConfig,
      [],
      [],
      {
        headerRows: [0],
        zebra: true,
        freezePane: { rowSplit: 1, colSplit: 1 },
      }
    );
  };

  const handleExportPdf = async () => {
    const rows = filteredData.length > 0 ? filteredData : data;
    if (!rows || rows.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const visibleKeys = Object.keys(columnVisibilityModel).filter((k) => columnVisibilityModel[k] !== false);
    const keys = visibleKeys.length > 0 ? visibleKeys : Object.keys(rows[0] || {});
    if (keys.length === 0) {
      alert('No hay columnas seleccionadas para exportar.');
      return;
    }

    const headers = keys.map((k) => k.charAt(0).toUpperCase() + k.slice(1));
    const body = rows.map((row) => keys.map((k) => formatValue(row[k])));

    const categoriasSet = new Set();
    rows.forEach((r) => {
      if (Array.isArray(r?.categorias)) {
        r.categorias.forEach((c) => categoriasSet.add(c));
      }
    });

    await exportPdfReport({
      title: 'Movimientos cargados',
      subtitle: 'Exportación',
      charts: [],
      table: { head: [headers], body },
      fileName: 'Movimientos',
      footerOnFirstPage: false,
      cover: {
        show: true,
        subtitle: 'Listado actualizado',
        logo: logoDataUrl,
        meta: [
          { label: 'Total registros', value: rows.length },
          { label: 'Columnas', value: keys.length },
          { label: 'Generado', value: new Date().toLocaleDateString('es-AR') },
        ],
        kpis: [
          { label: 'Registros', value: rows.length.toString() },
          { label: 'Categorías', value: categoriasSet.size.toString() },
          { label: 'Vista', value: vista === 'tabla' ? 'Tabla' : 'Gráfico' },
        ],
        summary: [
          'Incluye filtros y columnas visibles al momento de exportar.',
        ],
      },
    });
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
            onExportPdf={handleExportPdf}
            onExportExcel={handleExportExcel}
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
