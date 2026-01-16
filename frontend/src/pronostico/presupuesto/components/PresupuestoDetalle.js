import * as React from 'react';
import {
  Box, Typography, Paper, Grid, Button, Tabs, Tab, Avatar, Chip, Stack, Tooltip,
  IconButton, Divider, Drawer, List, ListItem, ListItemText, TextField, MenuItem, Switch,
  FormControlLabel, Menu, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router-dom';
import ExportadorSimple from '../../../shared-components/ExportadorSimple';
import http from '../../../api/http';
import { formatCurrency } from '../../../utils/currency';
import { eachMonthOfInterval, startOfMonth, endOfMonth, format as formatDate } from 'date-fns';
import { getMovimientosPorRango, getMovimientosParaPresupuesto } from '../../../reportes/reportes.service';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, Legend,
  LineChart, Line, Area, ReferenceLine
} from 'recharts';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import API_CONFIG from '../../../config/api-config';
import LoadingSpinner from '../../../shared-components/LoadingSpinner';
import { detectCurrencyFromName } from '../utils/currencyTag';

// Helper seguro para números
const safeNumber = (v) =>
  typeof v === 'number' ? v : v != null && !isNaN(Number(v)) ? Number(v) : 0;

// Colores
const INGRESO_EST_COLOR = '#a5d6a7';
const INGRESO_REAL_COLOR = '#4caf50';
const EGRESO_EST_COLOR = '#ef9a9a';
const EGRESO_REAL_COLOR = '#f44336';
const SUPERAVIT_COLOR = '#4caf50';
const DEFICIT_COLOR = '#f44336';
const DEFICIT_CHIP_SX = {
  fontWeight: 500,
  bgcolor: '#FFDE70',
  backgroundColor: '#FFDE70',
  color: '#000',
  border: '1px solid #F5C16C',
  '& .MuiChip-label': { color: '#000' },
  '& .MuiChip-icon': { color: '#000' },
  '&.MuiChip-filled': { backgroundColor: '#FFDE70' },
};

const datosBrutosTableSx = (theme) => ({
  borderCollapse: 'collapse',
  border: `1px solid ${(theme.vars || theme).palette.divider}`,
});

const datosBrutosCellSx = (theme) => ({
  border: `1px solid ${(theme.vars || theme).palette.divider}`,
  padding: '12px',
});

const datosBrutosHeaderCellSx = (theme) => ({
  ...datosBrutosCellSx(theme),
  fontWeight: 700,
});

// Mapeo de número de mes a nombre corto
const mesCorto = (numStr) => {
  const nombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const idx = parseInt(numStr, 10) - 1;
  return nombres[idx] || numStr;
};

// Semáforo de salud presupuestaria por % cumplimiento
function semaforoPorCumplimiento(pct) {
  if (pct >= 0.95) return { label: 'Salud: Verde', color: 'success' };
  if (pct >= 0.8) return { label: 'Salud: Amarillo', color: 'warning' };
  return { label: 'Salud: Rojo', color: 'error' };
}

// Formatear diferencia
const formatDiff = (est, real) => {
  const diff = safeNumber(real) - safeNumber(est);
  const formatted = formatCurrency(Math.abs(diff));
  return diff >= 0 ? `+${formatted}` : `-${formatted}`;
};

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const toDateSafe = (value) => {
  if (!value || typeof value !== 'string') return null;
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const date = new Date(year, month - 1, day);
  return isValidDate(date) ? date : null;
};

async function getRealPorMes(meses, tipo, moneda) {
  const out = {};

  for (const d of meses) {
    const desde = formatDate(startOfMonth(d), 'yyyy-MM-dd');
    const hasta = formatDate(endOfMonth(d), 'yyyy-MM-dd');
    const mesKey = formatDate(d, 'yyyy-MM');
    try {
      const resp = await getMovimientosPorRango({ fechaDesde: desde, fechaHasta: hasta, tipos: tipo, moneda });
      const movimientos = Array.isArray(resp?.content) ? resp.content : (Array.isArray(resp) ? resp : []);
      const totalMes = movimientos.reduce((acc, movimiento) => {
        const monto = Math.abs(Number(movimiento?.monto ?? movimiento?.montoTotal ?? 0));
        return Number.isFinite(monto) ? acc + monto : acc;
      }, 0);
      out[mesKey] = totalMes;
    } catch (error) {
      console.error(`Error al obtener movimientos del mes ${mesKey} (${tipo}):`, error);
      out[mesKey] = 0;
    }
  }

  return out;
}

export default function PresupuestoDetalle() {
  const { nombre: nombreUrl } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLightMode = theme.palette.mode === 'light';
  const paletteVars = theme.vars?.palette ?? theme.palette;
  const kpiColors = React.useMemo(
    () => ({
      ingresos: isLightMode ? 'hsl(120, 44%, 53%)' : paletteVars.success.light,
      egresos: isLightMode ? 'hsl(0, 90%, 40%)' : paletteVars.error.light,
      resultadoPos: isLightMode ? 'hsl(210, 98%, 42%)' : paletteVars.info.light,
      resultadoNeg: isLightMode ? 'hsl(45, 90%, 40%)' : paletteVars.warning.light,
    }),
    [isLightMode, paletteVars.error.light, paletteVars.info.light, paletteVars.success.light, paletteVars.warning.light]
  );
  const tabsLabelColor = isLightMode
    ? paletteVars.text?.primary ?? '#000'
    : paletteVars.common?.white ?? '#fff';

  const [presupuesto, setPresupuesto] = React.useState({
    id: null,
    nombre: '',
    detalleMensual: [],
  });
  const [presupuestoCurrency, setPresupuestoCurrency] = React.useState('ARS');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const [tab, setTab] = React.useState(0); // 0: resumen, 1: tabla

  // Filtros UI
  const [verSoloDeficit, setVerSoloDeficit] = React.useState(false);
  const [verSoloEstimados, setVerSoloEstimados] = React.useState(false);
  const [umbralDesvio, setUmbralDesvio] = React.useState(0); // %
  const [anchorFiltros, setAnchorFiltros] = React.useState(null);

  // Panel lateral (KPIs clicables)
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerTipo, setDrawerTipo] = React.useState('Ingresos'); // 'ingresos' | 'egresos' | 'resultado'

  React.useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Buscar presupuesto por nombre
        const res = await http.get(`${API_CONFIG.PRONOSTICO}/api/presupuestos`);
        const listaPayload = res?.data;
        let lista = [];
        if (Array.isArray(listaPayload)) {
          lista = listaPayload;
        } else if (Array.isArray(listaPayload?.content)) {
          lista = listaPayload.content;
        }

        const slug = decodeURIComponent(nombreUrl || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-');

        const encontrado = lista.find(
          (p) => (p?.nombre || '').trim().toLowerCase().replace(/\s+/g, '-') === slug
        );

        if (!encontrado?.id) {
          setPresupuesto({ id: null, nombre: 'No encontrado', detalleMensual: [] });
          setLoading(false);
          return;
        }

        // 2) (opcional) obtener nombre "oficial" desde header
        let nombreOficial = encontrado.nombre;
        try {
          const resHeader = await http.get(`${API_CONFIG.PRONOSTICO}/api/presupuestos/${encontrado.id}`);
          if (resHeader?.data?.nombre) nombreOficial = resHeader.data.nombre;
        } catch { /* no crítico */ }
        const currencyDetected = detectCurrencyFromName(nombreOficial || encontrado.nombre);
        setPresupuestoCurrency(currencyDetected);

        // 3) Traer TOTALES mensuales del backend nuevo
        const resTot = await http.get(`${API_CONFIG.PRONOSTICO}/api/presupuestos/${encontrado.id}/totales`);
        const totales = Array.isArray(resTot.data) ? resTot.data : [];

        // 4) Mapear a la forma que usa el front
        const detalleMensual = totales.map((t, idx) => {
          const ingresoEst = safeNumber(t.ingresoEstimado);
          const egresoEst = safeNumber(t.egresoEstimado);
          return {
            id: idx + 1,
            mes: t.mes, // "YYYY-MM"
            ingresoEst,
            ingresoReal: 0, // Inicializar en 0
            egresoEst,
            egresoReal: 0, // Inicializar en 0
            totalEst: ingresoEst - egresoEst,
            totalReal: 0,
          };
        });

        let realesIngresoPorMes = {};
        let realesEgresoPorMes = {};
        try {
          const fechasDisponibles = detalleMensual
            .map((detalle) => {
              const mesKey = (detalle?.mes || '').slice(0, 7);
              if (!mesKey) return null;
              return toDateSafe(`${mesKey}-01`);
            })
            .filter(Boolean);

          if (fechasDisponibles.length > 0) {
            const minTime = Math.min(...fechasDisponibles.map((d) => d.getTime()));
            const maxTime = Math.max(...fechasDisponibles.map((d) => d.getTime()));
            const rangoInicioDate = startOfMonth(new Date(minTime));
            const rangoFinDate = endOfMonth(new Date(maxTime));

            // 🚀 OPTIMIZACIÓN: Una sola llamada en lugar de 24+
            console.log('🚀 Usando endpoint optimizado para obtener movimientos del presupuesto');
            const fechaDesde = formatDate(rangoInicioDate, 'yyyy-MM-dd');
            const fechaHasta = formatDate(rangoFinDate, 'yyyy-MM-dd');
            
            const movimientosData = await getMovimientosParaPresupuesto({ 
              fechaDesde, 
              fechaHasta,
              moneda: currencyDetected
            });

            // Convertir la respuesta optimizada al formato esperado
            if (movimientosData?.datosMensuales) {
              movimientosData.datosMensuales.forEach(mesDatos => {
                const mesKey = mesDatos.mes; // "YYYY-MM"
                realesIngresoPorMes[mesKey] = Number(mesDatos.totalIngresos || 0);
                realesEgresoPorMes[mesKey] = Number(mesDatos.totalEgresos || 0);
              });
              console.log('✅ Datos obtenidos con endpoint optimizado:', {
                meses: Object.keys(realesIngresoPorMes).length,
                totalIngresos: movimientosData.resumenTotal?.totalIngresos,
                totalEgresos: movimientosData.resumenTotal?.totalEgresos
              });
            }
            // Si no vino nada en datosMensuales, intentar fallback explícito
            if (!movimientosData?.datosMensuales || movimientosData.datosMensuales.length === 0) {
              throw new Error('Respuesta sin datosMensuales');
            }
          }
        } catch (movError) {
          console.error('❌ Error al obtener datos reales del presupuesto:', movError);
          setError((prev) => prev ?? 'No se pudieron cargar los datos reales del presupuesto.');
          // Fallback: calcular reales mes a mes usando el endpoint de movimientos con moneda
          try {
            const mesesDate = detalleMensual
              .map((detalle) => {
                const mesKey = (detalle?.mes || '').slice(0, 7);
                return mesKey ? toDateSafe(`${mesKey}-01`) : null;
              })
              .filter(Boolean);
            if (mesesDate.length > 0) {
              const [ingresosFallback, egresosFallback] = await Promise.all([
                getRealPorMes(mesesDate, 'Ingreso', currencyDetected),
                getRealPorMes(mesesDate, 'Egreso', currencyDetected),
              ]);
              realesIngresoPorMes = ingresosFallback;
              realesEgresoPorMes = egresosFallback;
            }
          } catch (fallbackErr) {
            console.error('❌ Error en fallback de datos reales:', fallbackErr);
          }
        }

        const detalleMensualCompleto = detalleMensual.map((detalle) => {
          const mesKey = (detalle?.mes || '').slice(0, 7);
          const egresoReal = safeNumber(realesEgresoPorMes[mesKey] || 0);
          const ingresoReal = safeNumber(realesIngresoPorMes[mesKey] || 0);

          return {
            ...detalle,
            ingresoReal,
            egresoReal,
            totalReal: ingresoReal - egresoReal,
          };
        });

        setPresupuesto({
          id: encontrado.id,
          nombre: nombreOficial,
          detalleMensual: detalleMensualCompleto,
        });

      } catch (error) {
        console.error('Error al cargar presupuesto:', error);
        setError('Error al cargar el presupuesto');
        setPresupuesto({ id: null, nombre: 'Error', detalleMensual: [] });
      } finally {
        setLoading(false);
      }
    };

    if (nombreUrl) cargar();
  }, [nombreUrl]);

  // ⚠️ Antes filtrabas por fila.id != null → vaciaba todo porque el endpoint no trae id.
  // Ahora solo validamos que exista "mes".
  const datosMensualesRaw = Array.isArray(presupuesto.detalleMensual)
    ? presupuesto.detalleMensual.filter((fila) => !!fila?.mes)
    : [];

  // Transformaciones + filtros (sin tocar datos originales)
  const datosMensuales = React.useMemo(() => {
    let rows = [...datosMensualesRaw];

    // Calcular % desvío por mes (en base a total Estimado vs Real)
    rows = rows.map((fila) => {
      const est = safeNumber(fila.totalEst ?? (safeNumber(fila.ingresoEst) - safeNumber(fila.egresoEst)));
      const real = safeNumber(fila.totalReal ?? (safeNumber(fila.ingresoReal) - safeNumber(fila.egresoReal)));
      const base = Math.abs(est) > 0 ? Math.abs(est) : 1;
      const pctDesvio = (real - est) / base; // + = mejor que estimado, - = peor
      const deficit = real < 0;
      return { ...fila, _estTotal: est, _realTotal: real, _pctDesvio: pctDesvio, _deficit: deficit };
    });

    if (verSoloDeficit) {
      rows = rows.filter((r) => r._realTotal < 0);
    }

    // Aplicar filtro por umbral de desvío
    if (Number.isFinite(umbralDesvio) && umbralDesvio > 0) {
      const thr = umbralDesvio / 100;
      rows = rows.filter((r) => Math.abs(r._pctDesvio) >= thr || !Number.isFinite(r._pctDesvio));
    }

    return rows;
  }, [datosMensualesRaw, verSoloDeficit, umbralDesvio]);

  // Totales (sobre no-filtrados para KPIs globales)
  const totalIngresoEst = datosMensualesRaw.reduce((acc, fila) => acc + safeNumber(fila.ingresoEst), 0);
  const totalIngresoReal = datosMensualesRaw.reduce((acc, fila) => acc + safeNumber(fila.ingresoReal), 0);
  const totalEgresoEst = datosMensualesRaw.reduce((acc, fila) => acc + safeNumber(fila.egresoEst), 0);
  const totalEgresoReal = datosMensualesRaw.reduce((acc, fila) => acc + safeNumber(fila.egresoReal), 0);
  const resultadoReal = totalIngresoReal - totalEgresoReal;
  const resultadoEstimado = totalIngresoEst - totalEgresoEst;

  const pctCumplimientoGlobal = (() => {
    const base = Math.abs(resultadoEstimado) > 0 ? Math.abs(resultadoEstimado) : 1;
    // cap 120% para pintar semáforo
    return Math.max(0, Math.min(1.2, resultadoReal / base));
  })();

  const salud = semaforoPorCumplimiento(pctCumplimientoGlobal);

  // Datos para gráficos separados (respetan filtros visuales por meses)
  const ingresosData = datosMensuales.map((fila) => {
    const mm = (fila?.mes || '0000-01').split('-')[1];
    return {
      mes: mesCorto(mm),
      estimado: safeNumber(fila.ingresoEst),
      real: safeNumber(fila.ingresoReal),
    };
  });

  const egresosData = datosMensuales.map((fila) => {
    const mm = (fila?.mes || '0000-01').split('-')[1];
    return {
      mes: mesCorto(mm),
      estimado: safeNumber(fila.egresoEst),
      real: safeNumber(fila.egresoReal),
    };
  });

  // Desvío/superávit mensual
  const desvioData = datosMensuales.map((fila) => {
    const superavit = safeNumber(fila.totalReal ?? (safeNumber(fila.ingresoReal) - safeNumber(fila.egresoReal)));
    const mm = (fila?.mes || '0000-01').split('-')[1];
    return {
      mes: mesCorto(mm),
      superavit,
      fill: superavit >= 0 ? SUPERAVIT_COLOR : DEFICIT_COLOR,
    };
  });

  // Navegación al detalle del mes
  const goToMes = (fila) => {
    // ⚠️ Antes exigías fila.id → muchos casos no lo traen.
    // Con "mes" alcanza para derivar el nombre del mes.
    if (!fila?.mes) {
      alert('Mes no válido');
      return;
    }
    const nombreNormalizado = encodeURIComponent((presupuesto.nombre || '').trim().toLowerCase().replace(/\s+/g, '-'));
    const parts = (fila.mes || '0000-01').split('-');
    const mesNum = parseInt(parts[1] || '1', 10);
    const mesNombre = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2025, (mesNum || 1) - 1));
    navigate(`/presupuestos/${nombreNormalizado}/detalle/${mesNombre}`);
  };

  // EXPORTS (igual)
  const handleExportExcel = () => {
    const data = [
      ['Mes', 'Ingreso Estimado', 'Ingreso Real', 'Desvío Ingresos', 'Egreso Estimado', 'Egreso Real', 'Desvío Egresos', 'Total Estimado', 'Total Real', 'Total Desvío'],
      ...datosMensualesRaw.map((fila) => [
        fila.mes ?? '—',
        safeNumber(fila.ingresoEst),
        safeNumber(fila.ingresoReal),
        safeNumber(fila.ingresoReal) - safeNumber(fila.ingresoEst),
        safeNumber(fila.egresoEst),
        safeNumber(fila.egresoReal),
        safeNumber(fila.egresoReal) - safeNumber(fila.egresoEst),
        safeNumber(fila.totalEst),
        safeNumber(fila.totalReal),
        safeNumber(fila.totalReal) - safeNumber(fila.totalEst),
      ]),
    ];

    data.push(['', '', '', '', '', '', '', '', '', '']);
    data.push(['Totales:', '', '', '', '', '', '', '', '', '']);
    data.push([
      '',
      totalIngresoEst,
      totalIngresoReal,
      totalIngresoReal - totalIngresoEst,
      totalEgresoEst,
      totalEgresoReal,
      totalEgresoReal - totalEgresoEst,
      resultadoEstimado,
      resultadoReal,
      resultadoReal - resultadoEstimado,
    ]);

    import('xlsx').then(({ utils, writeFile }) => {
      const ws = utils.aoa_to_sheet(data, { cellStyles: true });
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Detalle Presupuesto');
      writeFile(wb, `Presupuesto_${presupuesto.nombre || ''}_${presupuesto.id || ''}.xlsx`, { cellStyles: true });
    });
  };

  const handleExportPdf = () => {
    import('html2pdf.js').then((html2pdf) => {
      const element = document.getElementById('presupuesto-detalle-content');
      const opt = {
        margin: 0.5,
        filename: `Presupuesto_${presupuesto.nombre || ''}_${presupuesto.id || ''}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
      };
      html2pdf.default().from(element).set(opt).save();
    });
  };

  // Drawer contenido: lista de meses ordenados por mayor desvío (absoluto)
  const mesesOrdenadosPorDesvio = React.useMemo(() => {
    const arr = datosMensualesRaw.map((fila) => {
      const est = safeNumber(fila.totalEst ?? (safeNumber(fila.ingresoEst) - safeNumber(fila.egresoEst)));
      const real = safeNumber(fila.totalReal ?? (safeNumber(fila.ingresoReal) - safeNumber(fila.egresoReal)));
      const delta = real - est;
      return { ...fila, _delta: delta, _absDelta: Math.abs(delta) };
    });
    return arr.sort((a, b) => b._absDelta - a._absDelta);
  }, [datosMensualesRaw]);

  const openMenu = Boolean(anchorFiltros);
  const handleOpenMenu = (e) => setAnchorFiltros(e.currentTarget);
  const handleCloseMenu = () => setAnchorFiltros(null);

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <LoadingSpinner message="Cargando presupuesto..." />
      </Box>
    );
  }

  return (
    <Box id="presupuesto-detalle-content" sx={{ width: '100%', p: 3 }}>
      {/* Breadcrumbs simples */}
      <Typography variant="h4" gutterBottom fontWeight="600">
        Detalle de {presupuesto.nombre}
      </Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ color: 'text.primary' }}>
        Compará tu planificación con lo real
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 1, gap: 1, flexWrap: 'wrap' }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} indicatorColor="primary">
          <Tab
            label="Resumen"
            sx={{
              color: tabsLabelColor,
              '&.Mui-selected': { color: tabsLabelColor },
              '& .MuiTab-wrapper': { color: tabsLabelColor },
            }}
          />
          <Tab
            label="Datos brutos"
            sx={{
              color: tabsLabelColor,
              '&.Mui-selected': { color: tabsLabelColor },
              '& .MuiTab-wrapper': { color: tabsLabelColor },
            }}
          />
        </Tabs>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Filtros">
            <IconButton onClick={handleOpenMenu}><FilterAltOutlinedIcon /></IconButton>
          </Tooltip>
          <ExportadorSimple onExportPdf={handleExportPdf} onExportExcel={handleExportExcel} />
        </Stack>
      </Box>

      {/* Menú de Filtros */}
      <Menu anchorEl={anchorFiltros} open={openMenu} onClose={handleCloseMenu}>
        <Box sx={{ p: 2, width: 280 }}>
          <Stack spacing={1.5}>
            <FormControlLabel
              control={<Switch checked={verSoloDeficit} onChange={(_, v) => setVerSoloDeficit(v)} />}
              label="Ver solo meses con déficit"
            />
            <FormControlLabel
              control={<Switch checked={verSoloEstimados} onChange={(_, v) => setVerSoloEstimados(v)} />}
              label="Mostrar foco en estimados (oculta ‘Real’ en gráficas)"
            />
            <TextField
              label="Umbral de desvío (%)"
              type="number"
              size="small"
              value={umbralDesvio}
              onChange={(e) => setUmbralDesvio(Math.max(0, Number(e.target.value)))}
            />
          </Stack>
        </Box>
      </Menu>

      {/* === PESTAÑA 0: RESUMEN VISUAL === */}
      {tab === 0 && (
        <>
          {/* KPIs con acciones rápidas */}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: kpiColors.ingresos, color: 'white', position: 'relative', height: '100%' }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'white', color: 'success.main', mx: 'auto', mb: 1 }}>+</Avatar>
                <Typography variant="h6">Ingresos</Typography>
                <Typography variant="body2" sx={{ display: 'block', color: 'rgba(255,255,255,0.9)' }}>
                  Real acumulado
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(totalIngresoReal)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Estimado: {formatCurrency(totalIngresoEst)}
                </Typography>
                <Tooltip title="Ver meses con mayor desvío en ingresos">
                  <IconButton
                    size="small"
                    onClick={() => setDrawerOpen(true) || setDrawerTipo('Ingresos')}
                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)' }}
                  >
                    <RuleOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: kpiColors.egresos, color: 'white', position: 'relative', height: '100%' }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'white', color: 'error.main', mx: 'auto', mb: 1 }}>-</Avatar>
                <Typography variant="h6">Egresos</Typography>
                <Typography variant="body2" sx={{ display: 'block', color: 'rgba(255,255,255,0.9)' }}>
                  Real acumulado
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(totalEgresoReal)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Estimado: {formatCurrency(totalEgresoEst)}
                </Typography>
                <Tooltip title="Ver meses con mayor desvío en egresos">
                  <IconButton
                    size="small"
                    onClick={() => setDrawerOpen(true) || setDrawerTipo('egresos')}
                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)' }}
                  >
                    <SettingsOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: resultadoReal >= 0 ? kpiColors.resultadoPos : kpiColors.resultadoNeg,
                  color: 'white',
                  position: 'relative',
                  height: '100%'
                }}
              >
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: 'white',
                    color: resultadoReal >= 0 ? 'info.main' : 'warning.main',
                    mx: 'auto',
                    mb: 1,
                  }}
                >
                  {resultadoReal >= 0 ? '✓' : '⚠'}
                </Avatar>
                <Typography variant="h6">Resultado</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(resultadoReal)}
                </Typography>
                <Typography variant="body2">
                  {resultadoReal >= 0 ? 'Superávit' : 'Déficit'}
                </Typography>
                <Tooltip title="Ver meses ordenados por impacto en resultado">
                  <IconButton
                    size="small"
                    onClick={() => setDrawerOpen(true) || setDrawerTipo('resultado')}
                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)' }}
                  >
                    <HistoryOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="overline">Marcador de salud</Typography>
                <Stack alignItems="center" spacing={1}>
                  <Chip label={`${salud.label}`} color={salud.color} />
                  <Typography variant="body2" color="text.secondary">
                    Cumplimiento: {(pctCumplimientoGlobal * 100).toFixed(0)}%
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          {/* === GRÁFICO 1: Ingresos Estimado vs Real por mes === */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight="600">Ingresos: Estimado vs Real</Typography>
              <Chip size="small" label={verSoloEstimados ? 'Foco: Estimados' : 'Todos'} />
            </Stack>
            <Box sx={{ mt: 2 }}>
              {ingresosData.map((item, index) => {
                const max = Math.max(item.estimado, item.real) * 1.2 || 1;
                const fila = datosMensuales[index];
                return (
                  <Box key={`${item.mes}-${index}`} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                      {item.mes}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* Estimado */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}
                           onClick={() => fila && goToMes(fila)}>
                        <Typography variant="body2" sx={{ minWidth: 80 }}>Estimado:</Typography>
                        <Box sx={{ flex: 1, height: 30 }}>
                          <ResponsiveContainer width="100%" height={30}>
                            <BarChart data={[{ name: item.mes, valor: item.estimado }]} layout="vertical">
                              <XAxis type="number" domain={[0, max]} hide />
                              <YAxis type="category" dataKey="name" hide />
                              <RTooltip formatter={(value) => [formatCurrency(value), '']} />
                              <Bar dataKey="valor" fill={INGRESO_EST_COLOR} radius={[4, 4, 4, 4]}
                                   label={{ position: 'right', formatter: (v) => formatCurrency(v) }} />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      </Box>

                      {/* Real */}
                      {!verSoloEstimados && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}
                             onClick={() => fila && goToMes(fila)}>
                          <Typography variant="body2" sx={{ minWidth: 80 }}>Real:</Typography>
                          <Box sx={{ flex: 1, height: 30 }}>
                            <ResponsiveContainer width="100%" height={30}>
                              <BarChart data={[{ name: item.mes, valor: item.real }]} layout="vertical">
                                <XAxis type="number" domain={[0, max]} hide />
                                <YAxis type="category" dataKey="name" hide />
                                <RTooltip formatter={(value) => [formatCurrency(value), '']} />
                                <Bar dataKey="valor" fill={INGRESO_REAL_COLOR} radius={[4, 4, 4, 4]}
                                     label={{ position: 'right', formatter: (v) => formatCurrency(v) }} />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>

          {/* === GRÁFICO 2: Egresos Estimado vs Real por mes === */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Egresos: Estimado vs Real
            </Typography>
            <Box sx={{ mt: 2 }}>
              {egresosData.map((item, index) => {
                const max = Math.max(item.estimado, item.real) * 1.2 || 1;
                const fila = datosMensuales[index];
                return (
                  <Box key={`${item.mes}-${index}`} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                      {item.mes}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* Estimado */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}
                           onClick={() => fila && goToMes(fila)}>
                        <Typography variant="body2" sx={{ minWidth: 80 }}>Estimado:</Typography>
                        <Box sx={{ flex: 1, height: 30 }}>
                          <ResponsiveContainer width="100%" height={30}>
                            <BarChart data={[{ name: item.mes, valor: item.estimado }]} layout="vertical">
                              <XAxis type="number" domain={[0, max]} hide />
                              <YAxis type="category" dataKey="name" hide />
                              <RTooltip formatter={(value) => [formatCurrency(value), '']} />
                              <Bar dataKey="valor" fill={EGRESO_EST_COLOR} radius={[4, 4, 4, 4]}
                                   label={{ position: 'right', formatter: (v) => formatCurrency(v) }} />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      </Box>

                      {/* Real */}
                      {!verSoloEstimados && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}
                             onClick={() => fila && goToMes(fila)}>
                          <Typography variant="body2" sx={{ minWidth: 80 }}>Real:</Typography>
                          <Box sx={{ flex: 1, height: 30 }}>
                            <ResponsiveContainer width="100%" height={30}>
                              <BarChart data={[{ name: item.mes, valor: item.real }]} layout="vertical">
                                <XAxis type="number" domain={[0, max]} hide />
                                <YAxis type="category" dataKey="name" hide />
                                <RTooltip formatter={(value) => [formatCurrency(value), '']} />
                                <Bar dataKey="valor" fill={EGRESO_REAL_COLOR} radius={[4, 4, 4, 4]}
                                     label={{ position: 'right', formatter: (v) => formatCurrency(v) }} />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>

          {/* === GRÁFICO 3: Tendencia del Resultado === */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Tendencia del Resultado Mensual
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={desvioData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="50%" stopColor="#4caf50" stopOpacity={0.1} />
                    <stop offset="50%" stopColor="#f44336" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Area dataKey="superavit" fill="url(#splitColor)" stroke="none" yAxisId="left" />
                <Line
                  type="monotone"
                  dataKey="superavit"
                  stroke="#2196f3"
                  strokeWidth={2}
                  dot={{ r: 6, cursor: 'pointer' }}
                  activeDot={{ r: 8 }}
                  yAxisId="left"
                  onClick={(_, index) => {
                    const fila = datosMensuales[index];
                    if (fila) goToMes(fila);
                  }}
                />
                <ReferenceLine
                  y={0}
                  stroke="#666"
                  strokeDasharray="3 3"
                  label={{ value: 'Punto de equilibrio', position: 'right', fill: '#666', fontSize: 12 }}
                />
                <XAxis dataKey="mes" />
                <YAxis
                  yAxisId="left"
                  domain={[dataMin => Math.min(dataMin, 0), dataMax => Math.max(dataMax, 0)]}
                  tickFormatter={(value) => formatCurrency(value)}
                  width={70}
                />
                <RTooltip
                  formatter={(value) => [
                    Number(value) >= 0
                      ? `Superávit: ${formatCurrency(value)}`
                      : `Déficit: ${formatCurrency(value)}`,
                    'Resultado'
                  ]}
                  contentStyle={{ color: 'black' }}
                />
                <Legend
                  payload={[
                    { value: 'Resultado mensual', type: 'line', color: '#2196f3' },
                    { value: 'Punto de equilibrio', type: 'dashedLine', color: '#666' },
                  ]}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </>
      )}

      {/* === PESTAÑA 1: TABLA === */}
      {tab === 1 && (
        <Paper sx={{ overflowX: 'auto' }}>
          <Table sx={datosBrutosTableSx}>
            <TableHead>
              <TableRow>
                <TableCell sx={datosBrutosHeaderCellSx}>Mes</TableCell>
                <TableCell sx={datosBrutosHeaderCellSx}>Ingreso Est.</TableCell>
                <TableCell sx={datosBrutosHeaderCellSx}>Ingreso Real</TableCell>
                <TableCell sx={datosBrutosHeaderCellSx}>Egreso Est.</TableCell>
                <TableCell sx={datosBrutosHeaderCellSx}>Egreso Real</TableCell>
                <TableCell sx={datosBrutosHeaderCellSx}>Resultado</TableCell>
                <TableCell sx={datosBrutosHeaderCellSx}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datosMensuales.length > 0 ? (
                datosMensuales.map((fila, idx) => {
                  const ingresoEst = safeNumber(fila.ingresoEst);
                  const ingresoReal = safeNumber(fila.ingresoReal);
                  const egresoEst = safeNumber(fila.egresoEst);
                  const egresoReal = safeNumber(fila.egresoReal);
                  const totalReal = safeNumber(fila.totalReal ?? (ingresoReal - egresoReal));
                  const totalEst = safeNumber(fila.totalEst ?? (ingresoEst - egresoEst));
                  const diff = totalReal - totalEst;
                  const pct = Math.abs(totalEst) > 0 ? (diff / Math.abs(totalEst)) * 100 : 0;

                  return (
                    <TableRow key={fila.mes || idx}>
                      <TableCell sx={datosBrutosCellSx}>
                        {fila.mes}
                        {totalReal < 0 && (
                          <Chip
                            size="small"
                            icon={<WarningAmberOutlinedIcon fontSize="small" />}
                            sx={{ ml: 1, ...DEFICIT_CHIP_SX }}
                            label="Mes con déficit"
                          />
                        )}
                      </TableCell>
                      <TableCell sx={datosBrutosCellSx}>{formatCurrency(ingresoEst)}</TableCell>
                      <TableCell sx={datosBrutosCellSx}>{formatCurrency(ingresoReal)}</TableCell>
                      <TableCell sx={datosBrutosCellSx}>{formatCurrency(egresoEst)}</TableCell>
                      <TableCell sx={datosBrutosCellSx}>{formatCurrency(egresoReal)}</TableCell>
                      <TableCell
                        sx={(theme) => ({
                          ...datosBrutosCellSx(theme),
                          fontWeight: 700,
                          color: pct >= 0 ? '#66bb6a' : '#ef5350',
                        })}
                      >
                        {formatCurrency(totalReal)}{' '}
                        <span style={{ color: pct >= 0 ? '#66bb6a' : '#ef5350' }}>({pct.toFixed(0)}%)</span>
                      </TableCell>
                      <TableCell sx={datosBrutosCellSx}>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="contained" onClick={() => goToMes(fila)}>Ver mes</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    sx={(theme) => ({
                      ...datosBrutosCellSx(theme),
                      textAlign: 'center',
                      padding: '20px',
                      color: (theme.vars || theme).palette.text.secondary,
                    })}
                  >
                    No hay datos mensuales con los filtros actuales.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Botón de volver */}
      <Box mt={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Button variant="outlined" onClick={() => navigate(-1)}>Volver</Button>
      </Box>

      {/* Drawer lateral de KPIs */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 360, p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6">Meses con mayor desvío</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {drawerTipo === 'Ingresos' && 'Ordenado por diferencia Ingreso Real vs Estimado.'}
            {drawerTipo === 'Egresos' && 'Ordenado por diferencia Egreso Real vs Estimado.'}
            {drawerTipo === 'resultado' && 'Ordenado por diferencia de Resultado Real vs Estimado.'}
          </Typography>
          <List dense>
            {mesesOrdenadosPorDesvio.map((fila, idx) => {
              const ingresoDelta = safeNumber(fila.ingresoReal) - safeNumber(fila.ingresoEst);
              const egresoDelta = safeNumber(fila.egresoReal) - safeNumber(fila.egresoEst);
              const resEst = safeNumber(fila.totalEst ?? (safeNumber(fila.ingresoEst) - safeNumber(fila.egresoEst)));
              const resReal = safeNumber(fila.totalReal ?? (safeNumber(fila.ingresoReal) - safeNumber(fila.egresoReal)));
              const resDelta = resReal - resEst;

              const valor = drawerTipo === 'Ingresos' ? ingresoDelta : drawerTipo === 'egresos' ? egresoDelta : resDelta;

              return (
                <ListItem
                  key={fila.mes || idx}
                  secondaryAction={
                    <Button size="small" variant="text" onClick={() => { setDrawerOpen(false); goToMes(fila); }}>
                      Ajustar mes
                    </Button>
                  }
                >
                  <ListItemText
                    primary={fila.mes}
                    secondary={
                      <span style={{ color: valor >= 0 ? '#66bb6a' : '#ef5350' }}>
                        {valor >= 0 ? '+' : '-'}{formatCurrency(Math.abs(valor))}
                      </span>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
