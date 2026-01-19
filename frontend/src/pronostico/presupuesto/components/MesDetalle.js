import * as React from 'react';
import {
  Box, Typography, Paper, Grid, Button, Tabs, Tab, Avatar, Chip, Stack, Tooltip,
  IconButton, Divider, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Autocomplete, FormControlLabel, Switch, Select, InputLabel, FormControl, Snackbar, Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router-dom';
import ExportadorSimple from '../../../shared-components/ExportadorSimple';
import { buildTipoSelectSx } from '../../../shared-components/tipoSelectStyles';
import http from '../../../api/http';
import { formatCurrency, formatCurrencyInput, parseCurrency } from '../../../utils/currency';
import { fetchCategorias } from '../../../shared-services/categoriasService';
import dayjs from 'dayjs';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { getMovimientosPorRango } from '../../../reportes/reportes.service';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, Legend
} from 'recharts';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EditOffOutlinedIcon from '@mui/icons-material/EditOffOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { TODAS_LAS_CATEGORIAS } from '../../../shared-components/categorias';
import API_CONFIG from '../../../config/api-config';
import LoadingSpinner from '../../../shared-components/LoadingSpinner';

// ===== Helpers =====
const safeNumber = (v) =>
  typeof v === 'number' ? v : v != null && !isNaN(Number(v)) ? Number(v) : 0;

const baseURL = API_CONFIG.PRONOSTICO;

const GUARD_MESSAGES = {
  categoria: {
    title: 'Habilitar edicion manual',
    body: 'La categoria, tipo y monto estimado ayudan a ordenar tus analisis. Cambiarlos manualmente puede afectar reportes y automatizaciones. Queres habilitar la edicion manual?',
    confirmLabel: 'Habilitar edicion'
  },
  real: {
    title: 'Editar monto real',
    body: 'El monto real refleja los registros consolidados. Para ajustarlo, edita los movimientos registrados del periodo. Te llevamos a Ver movimientos.',
    confirmLabel: 'Habilitar edicion en movimientos'
  }
};

const GUARD_FIELD_LABELS = {
  categoria: 'la categoria, tipo y estimado',
  tipo: 'el tipo',
  montoEstimado: 'el estimado',
  real: 'el monto real'
};
const INGRESO_COLOR = '#4caf50';
const EGRESO_COLOR = '#f44336';
const INGRESO_EST_COLOR = '#a5d6a7';
const EGRESO_EST_COLOR = '#ef9a9a';
const SIN_PRONOSTICO_CHIP_SX = {
  fontWeight: 500,
  bgcolor: '#FFDE70',
  backgroundColor: '#FFDE70',
  color: '#000',
  border: '1px solid #F5C16C',
  '& .MuiChip-label': { color: '#000' },
  '& .MuiChip-icon': { color: '#000' },
  '&.MuiChip-filled': { backgroundColor: '#FFDE70' },
};

const CENTERED_INPUT_LABEL_SX = {
  top: '50%',
  transform: 'translate(14px, -50%) scale(1)',
  '&.MuiInputLabel-shrink': {
    top: 0,
    transform: 'translate(14px, -9px) scale(0.75)',
  },
};
const mesANumero = {
  enero: '01', febrero: '02', marzo: '03', abril: '04',
  mayo: '05', junio: '06', julio: '07', agosto: '08',
  septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
};

const formatearMes = (ym) => {
  if (!ym) return 'Mes desconocido';
  const [anio, mes] = ym.split('-');
  const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const i = parseInt(mes, 10);
  return isNaN(i) ? ym : `${nombres[i-1]} ${anio}`;
};

// YYYY-MM → YYYY-MM-01
const ymToYmd = (ym) => `${ym}-01`;

// Devuelve array de YYYY-MM entre from y to (inclusive)
const mesesEntre = (fromYM, toYM) => {
  const out = [];
  if (!fromYM || !toYM) return out;
  let [fy, fm] = fromYM.split('-').map(Number);
  const [ty, tm] = toYM.split('-').map(Number);
  let y = fy, m = fm, guard = 0;
  while (guard++ < 600) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    if (y === ty && m === tm) break;
    m++; if (m > 12) { m = 1; y++; }
  }
  return out;
};

// Normaliza payload de distintas respuestas posibles
const normalizeLine = (x) => {
  const rawMovementArray = x?.movimientoIds ?? x?.movimiento_ids ?? x?.movementIds;
  const rawMovementSingle = x?.movimientoId ?? x?.movimiento_id ?? x?.movementId ?? null;
  const movementIds = Array.isArray(rawMovementArray)
    ? rawMovementArray.map((id) => String(id))
    : rawMovementSingle != null
      ? [String(rawMovementSingle)]
      : [];
  return {
    id: x.id,
    categoria: x.categoria,
    tipo: normalizeTipo(x.tipo),
    montoEstimado: x.montoEstimado ?? x.monto_estimado ?? 0,
    real: 0,
    movimientoIds: movementIds,
  };
};

const normCat = (value) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const normalizeTipo = (value) => {
  const upper = (value || '').toString().toUpperCase();
  if (upper === 'INGRESO') return 'Ingreso';
  if (upper === 'EGRESO') return 'Egreso';
  return value || '';
};

export default function MesDetalle() {
  const { nombre: nombreUrl, mesNombre: mesNombreUrl } = useParams();
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

  React.useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

  // ===== State principal =====
  const [lineas, setLineas] = React.useState([]);
  const [lineasSoloReal, setLineasSoloReal] = React.useState([]);
  const [edits, setEdits] = React.useState({}); // { [id]: {categoria, tipo, montoEstimado, real} }
  const [manualGuards, setManualGuards] = React.useState({}); // { [id]: { categoria: bool, tipo: bool, montoEstimado: bool, real: bool } }
  const [guardPrompt, setGuardPrompt] = React.useState({ open: false, id: null, field: null, title: '', message: '', confirmLabel: '', movementIds: [] });
  const [nombreMes, setNombreMes] = React.useState('Mes desconocido');
  const [presupuestoNombre, setPresupuestoNombre] = React.useState('');
  const [presupuestoId, setPresupuestoId] = React.useState(null);
  const [ym, setYm] = React.useState(null); // YYYY-MM
  const [mesesDisponibles, setMesesDisponibles] = React.useState([]);
  const [tab, setTab] = React.useState(0);
  const [totalRealMes, setTotalRealMes] = React.useState(0);
  const goToDatosBrutos = React.useCallback(() => setTab(1), [setTab]);

  // UI
  const [simulacion, setSimulacion] = React.useState(false);
  const [rowMenuIdx, setRowMenuIdx] = React.useState(null);
  const [snack, setSnack] = React.useState({ open: false, message: '', severity: 'success' });

  const [nueva, setNueva] = React.useState({ categoria: '', tipo: 'Egreso', montoEstimado: '' });
  const [agregando, setAgregando] = React.useState(false);

  const [dlgReglas, setDlgReglas] = React.useState(false);
  const [regla, setRegla] = React.useState({ ambito: 'este_mes', modo: 'AJUSTE_PCT', valor: 10, solo: 'todos', rangoDesde: '', rangoHasta: '' });

  const [dlgVarios, setDlgVarios] = React.useState(false);
  const [bulkCfg, setBulkCfg] = React.useState({ accion: 'replicar', desde: '', hasta: '' });
  const [deletePrompt, setDeletePrompt] = React.useState({ open: false, id: null, categoria: '', tipo: '' });
  const [categoriasOptions, setCategoriasOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [usuarioRol, setUsuarioRol] = React.useState(null);

  const categoriasPronosticadas = React.useMemo(() => {
    const ocupadas = new Set();
    for (const linea of lineas) {
      const normalizada = normCat(linea?.categoria);
      if (normalizada) ocupadas.add(normalizada);
    }
    return ocupadas;
  }, [lineas]);

  const opcionesNuevaLinea = React.useMemo(() => {
    let disponibles = categoriasOptions.filter((option) => {
      if (typeof option !== 'string') return false;
      const normalizada = normCat(option);
      if (!normalizada) return false;
      return !categoriasPronosticadas.has(normalizada);
    });

    if (nueva.categoria) {
      const categoriaActualNorm = normCat(nueva.categoria);
      const yaIncluida = disponibles.some((opt) => normCat(opt) === categoriaActualNorm);
      if (!yaIncluida) {
        disponibles = [nueva.categoria, ...disponibles];
      }
    }

    return disponibles;
  }, [categoriasOptions, categoriasPronosticadas, nueva.categoria]);

  const { prevYm, nextYm } = React.useMemo(() => {
    if (!ym || !mesesDisponibles.length) {
      return { prevYm: null, nextYm: null };
    }
    const idx = mesesDisponibles.findIndex((value) => value === ym);
    if (idx === -1) {
      return { prevYm: null, nextYm: null };
    }
    return {
      prevYm: idx > 0 ? mesesDisponibles[idx - 1] : null,
      nextYm: idx < mesesDisponibles.length - 1 ? mesesDisponibles[idx + 1] : null,
    };
  }, [ym, mesesDisponibles]);

  React.useEffect(() => {
    let activo = true;
    const cargarCategorias = async () => {
      try {
        const lista = await fetchCategorias();
        if (!activo) return;
        if (Array.isArray(lista) && lista.length > 0) {
          setCategoriasOptions(lista);
        } else {
          setCategoriasOptions(TODAS_LAS_CATEGORIAS);
        }
      } catch (error) {
        console.error('No se pudieron obtener las categorias, se usan las predefinidas', error);
        if (!activo) return;
        setCategoriasOptions(TODAS_LAS_CATEGORIAS);
      }
    };
    cargarCategorias();
    return () => {
      activo = false;
    };
  }, []);

  React.useEffect(() => {
    const cargarRolUsuario = async () => {
      try {
        const sub = sessionStorage.getItem('sub');
        if (!sub) return;
        const res = await fetch(`${API_CONFIG.ADMINISTRACION}/api/usuarios/perfil`, {
          headers: { 'X-Usuario-Sub': sub },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.rol) {
          setUsuarioRol(data.rol);
        }
      } catch (err) {
        console.error('Error cargando rol de usuario para presupuesto:', err);
      }
    };
    cargarRolUsuario();
  }, []);

  const esAdmin = React.useMemo(
    () => (usuarioRol || '').toUpperCase().includes('ADMIN'),
    [usuarioRol]
  );

  // ===== Carga de datos =====
  const fetchMes = React.useCallback(async (pid, ymStr, { skipStateUpdate = false } = {}) => {
    if (!pid || !ymStr) return;

    // 1) intento con YYYY-MM
    const url1 = `${baseURL}/api/presupuestos/${pid}/mes/${ymStr}`;
    // 2) fallback YYYY-MM-01 (si el backend guarda date)
    const url2 = `${baseURL}/api/presupuestos/${pid}/mes/${ymToYmd(ymStr)}`;

    const tryFetch = async (url) => {
      try {
        const res = await http.get(url);
        const d = res?.data;
        let arr =
          Array.isArray(d) ? d :
          Array.isArray(d?.lineas) ? d.lineas :
          Array.isArray(d?.categorias) ? d.categorias : [];
        const norm = arr.map(normalizeLine);
        return norm;
      } catch {
        return null;
      }
    };

    let l = await tryFetch(url1);
    if (!l || l.length === 0) l = await tryFetch(url2);
    const finalLineas = l || [];
    if (!skipStateUpdate) setLineas(finalLineas);
    return finalLineas;
  }, []);

  const cargarLineasConReales = React.useCallback(async (pid, ymStr) => {
    const lineasBase = (await fetchMes(pid, ymStr, { skipStateUpdate: true })) || [];
    const ymKey = typeof ymStr === 'string' ? ymStr.slice(0, 7) : '';
    const referencia = dayjs(`${ymKey}-01`);
    if (!referencia.isValid()) {
      const sinReales = lineasBase.map((linea) => ({ ...linea, real: 0 }));
      setLineas(sinReales);
      setLineasSoloReal([]);
      setTotalRealMes(0);
      return sinReales;
    }

    try {
      const refDate = referencia.toDate();
      const fechaDesde = format(startOfMonth(refDate), 'yyyy-MM-dd');
      const fechaHasta = format(endOfMonth(refDate), 'yyyy-MM-dd');

      const [respEgreso, respIngreso] = await Promise.all([
        getMovimientosPorRango({
          fechaDesde,
          fechaHasta,
          tipos: 'Egreso',
        }),
        getMovimientosPorRango({
          fechaDesde,
          fechaHasta,
          tipos: 'Ingreso',
        }),
      ]);
      const movimientosEgreso = Array.isArray(respEgreso?.content) ? respEgreso.content : (Array.isArray(respEgreso) ? respEgreso : []);
      const movimientosIngreso = Array.isArray(respIngreso?.content) ? respIngreso.content : (Array.isArray(respIngreso) ? respIngreso : []);

      const agruparPorCategoria = (lista) => lista.reduce((acc, movimiento) => {
        const nombreOriginal =
          movimiento?.categoriaNombre || movimiento?.categoria || movimiento?.categoria_id_nombre || 'Sin categoría';
        const key = normCat(nombreOriginal);
        if (!key) return acc;
        const monto = Math.abs(
          Number(movimiento?.monto ?? movimiento?.montoTotal ?? movimiento?.monto_total ?? 0)
        ) || 0;
        if (!Number.isFinite(monto)) return acc;
        if (!acc[key]) {
          acc[key] = { total: 0, label: nombreOriginal || 'Sin categoría', movementIds: [] };
        }
        acc[key].total += monto;
        const rawMovimientoId =
          movimiento?.id ??
          movimiento?.movimientoId ??
          movimiento?.movimiento_id ??
          movimiento?.movimientoID ??
          movimiento?.idMovimiento ??
          null;
        const movimientoId = rawMovimientoId != null ? String(rawMovimientoId) : null;
        if (movimientoId && !acc[key].movementIds.includes(movimientoId)) {
          acc[key].movementIds.push(movimientoId);
        }
        return acc;
      }, {});

      const realesPorCategoriaEgreso = agruparPorCategoria(movimientosEgreso);
      const realesPorCategoriaIngreso = agruparPorCategoria(movimientosIngreso);
      const totalRealEgreso = Object.values(realesPorCategoriaEgreso).reduce((acc, data) => acc + data.total, 0);

      const lineasConReales = lineasBase.map((linea) => {
        const key = normCat(linea.categoriaNombre || linea.categoria);
        const tipoKey = (linea.tipo || '').toUpperCase();
        const baseMovementIds = Array.isArray(linea.movimientoIds)
          ? linea.movimientoIds.map((id) => String(id))
          : [];
        let real = 0;
        let movementIds = baseMovementIds;
        if (tipoKey === 'INGRESO') {
          const info = realesPorCategoriaIngreso[key];
          real = info?.total || 0;
          const extraIds = Array.isArray(info?.movementIds) ? info.movementIds.map((id) => String(id)) : [];
          movementIds = Array.from(new Set([...baseMovementIds, ...extraIds]));
        } else if (tipoKey === 'EGRESO') {
          const info = realesPorCategoriaEgreso[key];
          real = info?.total || 0;
          const extraIds = Array.isArray(info?.movementIds) ? info.movementIds.map((id) => String(id)) : [];
          movementIds = Array.from(new Set([...baseMovementIds, ...extraIds]));
        }
        return {
          ...linea,
          real,
          movimientoIds: movementIds,
        };
      });

      const categoriasPorTipo = lineasBase.reduce((acc, linea) => {
        const tipoKey = (linea.tipo || '').toUpperCase();
        const key = normCat(linea.categoriaNombre || linea.categoria);
        if (!acc[tipoKey]) acc[tipoKey] = new Set();
        acc[tipoKey].add(key);
        return acc;
      }, {});

      const adicionales = [];
      const registrarAdicionales = (tipoKey, mapa) => {
        const set = categoriasPorTipo[tipoKey] || new Set();
        Object.entries(mapa).forEach(([key, data]) => {
          if (!set.has(key)) {
            adicionales.push({
              id: `real-only-${tipoKey}-${key}`,
              categoria: data.label || 'Sin categoría',
              tipo: normalizeTipo(tipoKey),
              montoEstimado: 0,
              real: data.total,
              _soloReal: true,
              movimientoIds: Array.from(new Set((data.movementIds || []).map((id) => String(id)))),
            });
          }
        });
      };

      registrarAdicionales('EGRESO', realesPorCategoriaEgreso);
      registrarAdicionales('INGRESO', realesPorCategoriaIngreso);

      setLineas(lineasConReales);
      setLineasSoloReal(adicionales);
      setTotalRealMes(totalRealEgreso);
      return lineasConReales;
    } catch (movErr) {
      console.error('Error al obtener datos reales del mes:', movErr);
      const fallback = lineasBase.map((linea) => ({
        ...linea,
        real: 0,
      }));
      setLineas(fallback);
      setLineasSoloReal([]);
      setTotalRealMes(0);
      setSnack({ open: true, message: 'No se pudieron cargar los datos reales del mes.', severity: 'error' });
      return fallback;
    }
  }, [fetchMes, setSnack]);

  React.useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        // 1) buscar presupuesto por nombre
        const resPres = await http.get(`${baseURL}/api/presupuestos`);
        const listaPayload = resPres?.data;
        let lista = [];
        if (Array.isArray(listaPayload)) {
          lista = listaPayload;
        } else if (Array.isArray(listaPayload?.content)) {
          lista = listaPayload.content;
        }

        const decodedNombre = decodeURIComponent(nombreUrl || '').trim().toLowerCase().replace(/\s+/g, '-');
        const p = lista.find(pp => (pp?.nombre || '').trim().toLowerCase().replace(/\s+/g, '-') === decodedNombre);
        if (!p?.id) throw new Error('Presupuesto no encontrado');

        setPresupuestoNombre(p.nombre);
        setPresupuestoId(p.id);

      // 2) resolver YYYY-MM desde mesNombreUrl usando /totales
      const mesNumStr = mesANumero[(mesNombreUrl || '').toLowerCase().trim()];
      if (!mesNumStr) throw new Error('Mes no válido');

      const resTot = await http.get(`${baseURL}/api/presupuestos/${p.id}/totales`);
      const totales = Array.isArray(resTot.data) ? resTot.data : [];
      const mesesLista = Array.from(
        new Set(
          totales
            .map((t) => (t?.mes ? String(t.mes) : ''))
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));
      setMesesDisponibles(mesesLista);
      const item = totales.find(t => String(t?.mes || '').endsWith(`-${mesNumStr}`));
      if (!item?.mes) throw new Error('Mes no encontrado en totales');

      setYm(item.mes);
      setNombreMes(formatearMes(item.mes));

      // 3) cargar lineas reales
      await cargarLineasConReales(p.id, item.mes);
  
      } catch (err) {
        console.error(err);
        setLineas([]);
        setMesesDisponibles([]);
        setYm(null);
        setNombreMes('Mes desconocido');
        setSnack({ open: true, message: err?.message || 'Error cargando mes', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (nombreUrl && mesNombreUrl) cargar();
  }, [nombreUrl, mesNombreUrl, cargarLineasConReales]);

  const handleCambiarMes = React.useCallback(async (targetYm) => {
    if (!targetYm || !presupuestoId) return;
    try {
      setLoading(true);
      await cargarLineasConReales(presupuestoId, targetYm);
      setYm(targetYm);
      setNombreMes(formatearMes(targetYm));
    } catch (err) {
      console.error('Error cambiando de mes', err);
      setSnack({ open: true, message: 'No se pudieron cargar los datos del mes seleccionado.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [presupuestoId, cargarLineasConReales, setSnack]);

  // Sincronizo `edits` cuando cambian las lineas
  const lineasCompleto = React.useMemo(
    () => [...lineas, ...lineasSoloReal],
    [lineas, lineasSoloReal]
  );

  React.useEffect(() => {
    const nextEdits = {};
    for (const l of lineasCompleto) {
      nextEdits[l.id] = {
        categoria: l.categoria,
        tipo: l.tipo,
        montoEstimado: safeNumber(l.montoEstimado),
        real: l.real === null || typeof l.real === 'undefined' ? '' : safeNumber(l.real)
      };
    }
    setEdits(nextEdits);
    setManualGuards((prev) => {
      const nextGuards = {};
      for (const l of lineasCompleto) {
        nextGuards[l.id] = {
          categoria: prev[l.id]?.categoria || false,
          tipo: prev[l.id]?.tipo || false,
          montoEstimado: prev[l.id]?.montoEstimado || false,
          real: prev[l.id]?.real || false,
        };
      }
      return nextGuards;
    });
  }, [lineasCompleto]);

  const requestManualUnlock = React.useCallback((id, field) => {
    const cfg = GUARD_MESSAGES[field] || {};
    if (field === 'real') {
      const targetLine = lineasCompleto.find((l) => l.id === id);
      const movementIds = Array.isArray(targetLine?.movimientoIds)
        ? targetLine.movimientoIds.map((value) => String(value))
        : [];
      if (!movementIds.length) {
        setSnack({ open: true, message: 'No se encontro el movimiento para editar.', severity: 'error' });
        return;
      }
      setGuardPrompt({
        open: true,
        id,
        field,
        title: cfg.title || 'Editar monto real',
        message: cfg.body || 'Esta accion habilita la edicion manual.',
        confirmLabel: cfg.confirmLabel || 'Habilitar edicion en movimientos',
        movementIds,
      });
      return;
    }
    setGuardPrompt({
      open: true,
      id,
      field,
      title: cfg.title || 'Confirmar edicion manual',
      message: cfg.body || 'Esta accion habilita la edicion manual.',
      confirmLabel: cfg.confirmLabel || 'Habilitar',
      movementIds: [],
    });
  }, [lineasCompleto, setSnack]);

  const handleGuardCancel = React.useCallback(() => {
    setGuardPrompt({ open: false, id: null, field: null, title: '', message: '', confirmLabel: '', movementIds: [] });
  }, []);

  const toggleManualGuard = React.useCallback((id, field, enabled) => {
    const fieldsToToggle = field === 'categoria' ? ['categoria', 'tipo', 'montoEstimado'] : [field];
    setManualGuards((prev) => {
      const next = { ...prev };
      const current = { ...(next[id] || {}) };
      fieldsToToggle.forEach((key) => {
        current[key] = enabled;
      });
      next[id] = current;
      return next;
    });
    if (!enabled) {
      const linea = lineasCompleto.find((l) => l.id === id);
      if (linea) {
        setEdits((prev) => {
          const updated = { ...(prev[id] || {}) };
          fieldsToToggle.forEach((key) => {
            if (key === 'real') {
              updated[key] = linea.real === null || typeof linea.real === 'undefined' ? '' : safeNumber(linea.real);
            } else if (key === 'tipo') {
              updated[key] = linea.tipo;
            } else if (key === 'montoEstimado') {
              updated[key] = safeNumber(linea.montoEstimado);
            } else if (key === 'categoria') {
              updated[key] = linea.categoria;
            }
          });
          return { ...prev, [id]: updated };
        });
      }
      const label = GUARD_FIELD_LABELS[field] || field;
      setSnack({ open: true, message: `Edición manual desactivada para ${label}.`, severity: 'info' });
    }
  }, [lineasCompleto, setSnack]);

  const handleGuardConfirm = React.useCallback(() => {
    if (!(guardPrompt.open && guardPrompt.id != null && guardPrompt.field)) {
      setGuardPrompt({ open: false, id: null, field: null, title: '', message: '', confirmLabel: '', movementIds: [] });
      return;
    }

    if (guardPrompt.field === 'real') {
      const targetLine = lineasCompleto.find((l) => l.id === guardPrompt.id);
      const combinedIds = guardPrompt.movementIds && guardPrompt.movementIds.length
        ? guardPrompt.movementIds
        : Array.isArray(targetLine?.movimientoIds)
          ? targetLine.movimientoIds.map((value) => String(value))
          : [];
      const movementId = combinedIds[0];
      setGuardPrompt({ open: false, id: null, field: null, title: '', message: '', confirmLabel: '', movementIds: [] });
      if (!movementId) {
        setSnack({ open: true, message: 'No se encontro el movimiento para editar.', severity: 'error' });
        return;
      }
      const params = new URLSearchParams();
      params.set('editMovementId', movementId);
      navigate(`/ver-movimientos?${params.toString()}`, {
        state: {
          editMovementId: movementId,
          editMovementMeta: {
            from: 'presupuesto',
            presupuestoId,
            ym,
            categoria: targetLine?.categoria || '',
            movimientoIds: combinedIds,
          },
        },
      });
      return;
    }

    toggleManualGuard(guardPrompt.id, guardPrompt.field, true);
    const label = GUARD_FIELD_LABELS[guardPrompt.field] || guardPrompt.field;
    setSnack({ open: true, message: `Edicion manual habilitada para ${label}.`, severity: 'warning' });
    setGuardPrompt({ open: false, id: null, field: null, title: '', message: '', confirmLabel: '', movementIds: [] });
  }, [guardPrompt, lineasCompleto, navigate, toggleManualGuard, setSnack, presupuestoId, ym]);

  const isFieldUnlocked = React.useCallback(
    (id, field) => manualGuards[id]?.[field] === true,
    [manualGuards]
  );

  const reloadMes = React.useCallback(async () => {
    if (presupuestoId && ym) {
      setLoading(true);
      try {
        await cargarLineasConReales(presupuestoId, ym);
      } finally {
        setLoading(false);
      }
    }
  }, [presupuestoId, ym, cargarLineasConReales]);

  // ===== Derivados =====
  const ingresos = React.useMemo(
    () => lineasCompleto.filter((c) => (c.tipo || '').toUpperCase() === 'INGRESO'),
    [lineasCompleto]
  );
  const egresos = React.useMemo(
    () => lineasCompleto.filter((c) => (c.tipo || '').toUpperCase() === 'EGRESO'),
    [lineasCompleto]
  );

  const totalIngresos = ingresos.reduce((acc, c) => acc + safeNumber(c.real), 0);
  const totalEgresosCalculado = egresos.reduce((acc, c) => acc + safeNumber(c.real), 0);
  const totalEgresos = Number.isFinite(totalRealMes) ? totalRealMes : totalEgresosCalculado;
  const totalIngresoEst = ingresos.reduce((acc, c) => acc + safeNumber(c.montoEstimado), 0);
  const totalEgresoEst = egresos.reduce((acc, c) => acc + safeNumber(c.montoEstimado), 0);
  const resultado = totalIngresos - totalEgresos;

  const estimadoTotal = lineasCompleto.reduce(
    (acc, c) => acc + safeNumber(c.montoEstimado) * (c.tipo === 'Ingreso' ? 1 : -1),
    0
  );
  const cumplimiento = Math.abs(estimadoTotal) > 0 ? (resultado / Math.abs(estimadoTotal)) : 0;

  const vencidosEstimados = lineas.filter(
    (c) => safeNumber(c.montoEstimado) !== 0 && safeNumber(c.real) === 0
  ).length;

  const pieDataIngresos = ingresos.map((i) => ({ name: i.categoria, value: safeNumber(i.real) }));
  const barDataIngresos = ingresos.map((i) => ({
    name: i.categoria,
    estimado: safeNumber(i.montoEstimado),
    real: safeNumber(i.real),
  }));
  const pieDataEgresos = egresos.map((e) => ({ name: e.categoria, value: safeNumber(e.real) }));
  const barDataEgresos = egresos.map((e) => ({
    name: e.categoria,
    estimado: safeNumber(e.montoEstimado),
    real: safeNumber(e.real),
  }));

  // ===== Export =====
  const handleExportExcel = () => {
    const data = [
      ['Categoría', 'Tipo', 'Monto Estimado', 'Monto Registrado', 'Desvío'],
      ...lineasCompleto.map((item) => [
        item.categoria,
        item.tipo,
        safeNumber(item.montoEstimado),
        safeNumber(item.real),
        (item.tipo === 'Egreso'
            ? safeNumber(item.montoEstimado) - safeNumber(item.real)
            : safeNumber(item.real) - safeNumber(item.montoEstimado)),
      ]),
    ];
    data.push(['', '', '', '', '']);
    data.push(['Resultado:', '', '', '', resultado]);

    import('xlsx').then(({ utils, writeFile }) => {
      const ws = utils.aoa_to_sheet(data, { cellStyles: true });
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Detalle Mes');
      writeFile(wb, `Mes_${nombreMes}_${Date.now()}.xlsx`, { cellStyles: true });
    });
  };

  const handleExportPdf = () => {
    import('html2pdf.js').then((html2pdf) => {
      const element = document.getElementById('mes-detalle-content');
      const opt = {
        margin: 1,
        filename: `Mes_${nombreMes}_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      };
      html2pdf.default().from(element).set(opt).save();
    });
  };

  // ===== CRUD =====
  const toCamelPayload = (l) => ({
    categoria: l.categoria,
    tipo: l.tipo,
    montoEstimado: Number(l.montoEstimado ?? 0),
    real: l.real === '' || l.real == null ? null : Number(l.real),
  });

  const toSnakePayload = (l) => ({
    categoria: l.categoria,
    tipo: l.tipo,
    monto_estimado: Number(l.montoEstimado ?? 0),
    real: l.real === '' || l.real == null ? null : Number(l.real),
  });

  const tryPatchOrPut = async (method, url, data) => {
    if (method === 'patch') return http.patch(url, data);
    return http.put(url, data);
  };

  const patchLinea = async (l) => {
    try {
      if (!esAdmin) {
        setSnack({
          open: true,
          message: 'No tenés permisos para editar este presupuesto. Solo los administradores pueden editar datos brutos.',
          severity: 'warning',
        });
        return;
      }
      if (!presupuestoId || !ym || !l?.id) return;

      const urls = [
        `${baseURL}/api/presupuestos/${presupuestoId}/mes/${ym}/lineas/${l.id}`,
        `${baseURL}/api/presupuestos/${presupuestoId}/mes/${ymToYmd(ym)}/lineas/${l.id}`,
      ];
      const methods = ['patch', 'put']; // por si el backend usa PUT
      const payloads = [toCamelPayload(l), toSnakePayload(l)];

      let lastErr = null;

      for (const url of urls) {
        for (const method of methods) {
          // 1) camelCase
          try {
            await tryPatchOrPut(method, url, payloads[0]);
            setManualGuards((prev) => {
              if (!prev || !prev[l.id]) return prev;
              return { ...prev, [l.id]: { categoria: false, real: false } };
            });
            await reloadMes();
            setSnack({ open: true, message: 'Línea actualizada', severity: 'success' });
            return;
          } catch (e1) {
            lastErr = e1;
            // 2) snake_case si hubo 400 (bad request por nombres de campos)
            const status = e1?.response?.status;
            if (status === 400) {
              try {
                await tryPatchOrPut(method, url, payloads[1]);
                setManualGuards((prev) => {
                  if (!prev || !prev[l.id]) return prev;
                  return { ...prev, [l.id]: { categoria: false, real: false } };
                });
                await reloadMes();
                setSnack({ open: true, message: 'Línea actualizada', severity: 'success' });
                return;
              } catch (e2) {
                lastErr = e2;
              }
            }
            // si 404/405 seguimos probando con otra URL o método
          }
        }
      }

      const serverMsg =
        lastErr?.response?.data?.message ||
        lastErr?.response?.data?.error ||
        lastErr?.message ||
        'Error al actualizar';

      setSnack({ open: true, message: serverMsg, severity: 'error' });
      console.error('patchLinea error:', lastErr?.response || lastErr);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, message: 'Error al actualizar', severity: 'error' });
    }
  };

  const openDeletePrompt = (item) => {
    setDeletePrompt({ open: true, id: item.id, categoria: item.categoria, tipo: item.tipo });
  };

  const closeDeletePrompt = () => {
    setDeletePrompt((prev) => ({ ...prev, open: false }));
  };

  const deleteLinea = async (lineaId) => {
    try {
      if (!esAdmin) {
        setSnack({
          open: true,
          message: 'No tenés permisos para editar este presupuesto. Solo los administradores pueden editar datos brutos.',
          severity: 'warning',
        });
        return;
      }
      if (!presupuestoId || !ym || !lineaId) return;
      await http.delete(`${baseURL}/api/presupuestos/${presupuestoId}/mes/${ym}/lineas/${lineaId}`);
      await reloadMes();
      setSnack({ open: true, message: 'Línea eliminada', severity: 'success' });
    } catch (e) {
      console.error(e);
      setSnack({ open: true, message: 'Error al eliminar', severity: 'error' });
    }
  };

  const confirmDeletePrompt = async () => {
    const targetId = deletePrompt.id;
    setDeletePrompt({ open: false, id: null, categoria: '', tipo: '' });
    if (targetId != null) {
      await deleteLinea(targetId);
    }
  };

  const addLinea = async () => {
    try {
      if (!esAdmin) {
        setSnack({
          open: true,
          message: 'No tenés permisos para editar este presupuesto. Solo los administradores pueden editar datos brutos.',
          severity: 'warning',
        });
        return;
      }
      if (!presupuestoId || !ym) return;
      if (!nueva.categoria || !nueva.tipo) {
        setSnack({ open: true, message: 'Completá Categoría y tipo', severity: 'warning' });
        return;
      }
      const payload = {
        categoria: nueva.categoria,
        tipo: nueva.tipo,
        montoEstimado: Number(nueva.montoEstimado || 0),
      };
      await http.post(`${baseURL}/api/presupuestos/${presupuestoId}/mes/${ym}/lineas`, payload);
      setNueva({ categoria: '', tipo: 'Egreso', montoEstimado: '' });
      setAgregando(false);
      await reloadMes();
      setSnack({ open: true, message: 'Línea agregada', severity: 'success' });
    } catch (e) {
      console.error(e);
      setSnack({ open: true, message: 'Error al agregar', severity: 'error' });
    }
  };

  const crearLineaDesdeReal = async (l) => {
    try {
      if (!esAdmin) {
        setSnack({
          open: true,
          message: 'No tenés permisos para editar este presupuesto. Solo los administradores pueden editar datos brutos.',
          severity: 'warning',
        });
        return;
      }
      if (!presupuestoId || !ym) return;
      const payload = {
        categoria: l.categoria,
        tipo: l.tipo,
        montoEstimado: safeNumber(l.montoEstimado),
        real: l.real === '' || l.real == null ? null : safeNumber(l.real),
      };
      await http.post(`${baseURL}/api/presupuestos/${presupuestoId}/mes/${ym}/lineas`, payload);
      setSnack({ open: true, message: 'Línea agregada desde movimiento real.', severity: 'success' });
      await reloadMes();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Error al crear línea';
      setSnack({ open: true, message: msg, severity: 'error' });
    }
  };

  // ===== Bulk en varios meses =====
  const abrirDlgVariosConFila = (idx) => {
    const idxEfectivo = (typeof idx === 'number') ? idx : rowMenuIdx;
    if (idxEfectivo == null) return;
    setRowMenuIdx(idxEfectivo); // asegura que quede seteado
    setBulkCfg((c) => ({ ...c, accion: 'replicar', desde: ym || '', hasta: ym || '' }));
    setDlgVarios(true);
  };

  const ejecutarBulk = async () => {
    try {
      if (!esAdmin) {
        setSnack({
          open: true,
          message: 'No tenés permisos para editar este presupuesto. Solo los administradores pueden editar datos brutos.',
          severity: 'warning',
        });
        return;
      }
      if (rowMenuIdx == null) return;
      const l = lineas[rowMenuIdx];
      if (!l || !presupuestoId) return;

      const { accion, desde, hasta } = bulkCfg;
      if (!desde || !hasta) {
        setSnack({ open: true, message: 'Completá rango de meses', severity: 'warning' });
        return;
      }
      const meses = mesesEntre(desde, hasta);
      if (meses.length === 0) {
        setSnack({ open: true, message: 'Rango inválido', severity: 'warning' });
        return;
      }

      if (accion === 'replicar') {
        const payload = {
          categoria: l.categoria,
          tipo: l.tipo,
          montoEstimado: Number(l.montoEstimado || 0),
          real: l.real === '' || l.real == null ? null : Number(l.real),
        };
        for (const ymX of meses) {
          await http.post(`${baseURL}/api/presupuestos/${presupuestoId}/mes/${ymX}/lineas`, payload);
        }
        setSnack({ open: true, message: `Replicado en ${meses.length} mes(es)`, severity: 'success' });
      } else if (accion === 'eliminar') {
        for (const ymX of meses) {
          // tolerante con los dos formatos
          const urls = [
            `${baseURL}/api/presupuestos/${presupuestoId}/mes/${ymX}`,
            `${baseURL}/api/presupuestos/${presupuestoId}/mes/${ymToYmd(ymX)}`
          ];
          let ls = [];
          for (const u of urls) {
            try {
              const res = await http.get(u);
              const d = res?.data;
              const arr = Array.isArray(d) ? d : Array.isArray(d?.lineas) ? d.lineas : Array.isArray(d?.categorias) ? d.categorias : [];
              ls = arr.map(normalizeLine);
              if (ls.length) break;
            } catch { /* ignore */ }
          }
          const toDelete = ls.filter(ll =>
            (ll.categoria || '').toLowerCase().trim() === (l.categoria || '').toLowerCase().trim() &&
            ll.tipo === l.tipo
          );
          for (const d of toDelete) {
            await http.delete(`${baseURL}/api/presupuestos/${presupuestoId}/mes/${ymX}/lineas/${d.id}`);
          }
        }
        setSnack({ open: true, message: `Eliminado en ${meses.length} mes(es)`, severity: 'success' });
      }
      setDlgVarios(false);
      await reloadMes();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, message: 'Error en operación por múltiples meses', severity: 'error' });
    }
  };
  // ===== Render =====
  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <LoadingSpinner message="Cargando detalle del mes..." />
      </Box>
    );
  }

  return (
    <Box id="mes-detalle-content" sx={{ width: '100%', p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 1.5,
          justifyContent: 'flex-start',
        }}
      >
        <Box sx={{ width: 40, display: 'flex', justifyContent: 'flex-start' }}>
          <IconButton
            size="small"
            onClick={() => prevYm && handleCambiarMes(prevYm)}
            aria-label="Mes anterior"
            disabled={!prevYm}
            sx={{
              color: '#04564c',
              '&.Mui-disabled': { color: '#04564c', opacity: 0.5 },
            }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography
          variant="h4"
          fontWeight="600"
          sx={{
            flexGrow: 0,
            flexShrink: 0,
            textAlign: 'center',
            minWidth: '14ch',
            whiteSpace: 'nowrap',
          }}
        >
          {nombreMes}
        </Typography>
        <Box sx={{ width: 40, display: 'flex', justifyContent: 'flex-start' }}>
          <IconButton
            size="small"
            onClick={() => nextYm && handleCambiarMes(nextYm)}
            aria-label="Mes siguiente"
            disabled={!nextYm}
            sx={{
              color: '#04564c',
              '&.Mui-disabled': { color: '#04564c', opacity: 0.5 },
            }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Typography variant="subtitle1" sx={{ color: 'text.primary' }} gutterBottom>Detalle de {presupuestoNombre}</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip label={`Cumplimiento: ${(cumplimiento * 100).toFixed(0)}%`} color={cumplimiento >= 0.95 ? 'success' : cumplimiento >= 0.8 ? 'warning' : 'error'} />
            <Chip
              icon={vencidosEstimados > 0 ? <WarningAmberOutlinedIcon /> : undefined}
              label={`${vencidosEstimados} movimientos estimados sin registrar`}
              variant="filled"
              color={vencidosEstimados === 0 ? 'success' : undefined}
              sx={vencidosEstimados === 0 ? undefined : SIN_PRONOSTICO_CHIP_SX}
            />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <ExportadorSimple onExportPdf={handleExportPdf} onExportExcel={handleExportExcel} />
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 2, mt: 1, gap: 1, flexWrap: 'wrap' }}>
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
            label="Datos brutos (editar)"
            sx={{
              color: tabsLabelColor,
              '&.Mui-selected': { color: tabsLabelColor },
              '& .MuiTab-wrapper': { color: tabsLabelColor },
            }}
          />
        </Tabs>
      </Box>

      {/* === Pestaña 0 === */}
      {tab === 0 && (
        <>
          <Grid container spacing={3} mb={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: kpiColors.ingresos, color: 'white', height: '100%' }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'white', color: 'success.main', mx: 'auto', mb: 1 }}>+</Avatar>
                <Typography variant="h6">Ingresos</Typography>
                <Typography variant="body2" sx={{ display: 'block', color: 'rgba(255,255,255,0.9)' }}>Real del mes</Typography>
                <Typography variant="h4" fontWeight="bold">{formatCurrency(totalIngresos)}</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Estimado: {formatCurrency(totalIngresoEst)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: kpiColors.egresos, color: 'white', height: '100%' }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'white', color: 'error.main', mx: 'auto', mb: 1 }}>-</Avatar>
                <Typography variant="h6">Egresos</Typography>
                <Typography variant="body2" sx={{ display: 'block', color: 'rgba(255,255,255,0.9)' }}>Real del mes</Typography>
                <Typography variant="h4" fontWeight="bold">{formatCurrency(totalEgresos)}</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Estimado: {formatCurrency(totalEgresoEst)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: resultado >= 0 ? kpiColors.resultadoPos : kpiColors.resultadoNeg, color: 'white', height: '100%' }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'white', color: resultado >= 0 ? 'info.main' : 'warning.main', mx: 'auto', mb: 1 }}>
                  {resultado >= 0 ? '✓' : '⚠'}
                </Avatar>
                <Typography variant="h6">Resultado</Typography>
                <Typography variant="h4" fontWeight="bold">{formatCurrency(resultado)}</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {resultado >= 0 ? 'Superávit' : 'Déficit'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* GrÃ¡ficos */}
          {pieDataIngresos.length > 0 ? (
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="600">Distribución de Ingresos por Categoría</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieDataIngresos} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                       label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieDataIngresos.map((_, i) => <Cell key={`ing-${i}`} fill={INGRESO_COLOR} opacity={0.7 + i * 0.1} />)}
                  </Pie>
                  <RTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, mb: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">No hay ingresos registrados este mes.</Typography>
            </Paper>
          )}

          {barDataIngresos.length > 0 && (
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="600">Ingresos: Estimado vs Real por Categoría</Typography>
              <Box sx={{ mt: 2 }}>
                {barDataIngresos.map((item, index) => {
                  const estimadoN = safeNumber(item.estimado);
                  const realN = safeNumber(item.real);
                  const max = Math.max(estimadoN, realN) * 1.2 || 1;
                  const sinPronostico = estimadoN === 0 && realN > 0;
                  return (
                    <Box key={`${item.name}-${index}`} sx={{ mb: 3 }}>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <Typography variant="subtitle1" fontWeight="600">{item.name}</Typography>
                        {sinPronostico && (
                          <Tooltip
                            title="Este movimiento no tiene un monto estimado. Hacé clic para pronosticar."
                            disableHoverListener={!sinPronostico}
                          >
                            <Chip
                              icon={<WarningAmberOutlinedIcon />}
                              size="small"
                              label="Movimiento sin pronosticar"
                              sx={{ ...SIN_PRONOSTICO_CHIP_SX, cursor: 'pointer' }}
                              onClick={goToDatosBrutos}
                            />
                          </Tooltip>
                        )}
                      </Stack>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body2" sx={{ minWidth: 80 }}>Estimado:</Typography>
                          <Box sx={{ flex: 1, height: 30 }}>
                            <ResponsiveContainer width="100%" height={30}>
                              <BarChart data={[{ name: item.name, valor: item.estimado }]} layout="vertical">
                                <XAxis type="number" domain={[0, max]} hide />
                                <YAxis type="category" dataKey="name" hide />
                                <RTooltip formatter={(value) => [formatCurrency(value), '']} />
                                <Bar dataKey="valor" fill={INGRESO_EST_COLOR} radius={[4,4,4,4]}
                                     label={{ position: 'right', formatter: (v) => formatCurrency(v) }} />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body2" sx={{ minWidth: 80 }}>Real:</Typography>
                          <Box sx={{ flex: 1, height: 30 }}>
                            <ResponsiveContainer width="100%" height={30}>
                              <BarChart data={[{ name: item.name, valor: item.real }]} layout="vertical">
                                <XAxis type="number" domain={[0, max]} hide />
                                <YAxis type="category" dataKey="name" hide />
                                <RTooltip formatter={(value) => [formatCurrency(value), '']} />
                                <Bar dataKey="valor" fill={INGRESO_COLOR} radius={[4,4,4,4]}
                                     label={{ position: 'right', formatter: (v) => formatCurrency(v) }} />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          )}

          {pieDataEgresos.length > 0 ? (
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="600">Distribución de Egresos por Categoría</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieDataEgresos} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                       label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieDataEgresos.map((_, i) => <Cell key={`egr-${i}`} fill={EGRESO_COLOR} opacity={0.7 + i * 0.1} />)}
                  </Pie>
                  <RTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, mb: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">No hay egresos registrados este mes.</Typography>
            </Paper>
          )}

          {barDataEgresos.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="600">Egresos: Estimado vs Real por Categoría</Typography>
              <Box sx={{ mt: 2 }}>
                {barDataEgresos.map((item, index) => {
                  const estimadoN = safeNumber(item.estimado);
                  const realN = safeNumber(item.real);
                  const max = Math.max(estimadoN, realN) * 1.2 || 1;
                  const sinPronostico = estimadoN === 0 && realN > 0;
                  return (
                    <Box key={`${item.name}-${index}`} sx={{ mb: 3 }}>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <Typography variant="subtitle1" fontWeight="600">{item.name}</Typography>
                        {sinPronostico && (
                          <Tooltip
                            title="Este movimiento no tiene un monto estimado. Hacé clic para pronosticar."
                            disableHoverListener={!sinPronostico}
                          >
                            <Chip
                              icon={<WarningAmberOutlinedIcon />}
                              size="small"
                              label="Movimiento sin pronosticar"
                              sx={{ ...SIN_PRONOSTICO_CHIP_SX, cursor: 'pointer' }}
                              onClick={goToDatosBrutos}
                            />
                          </Tooltip>
                        )}
                      </Stack>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body2" sx={{ minWidth: 80 }}>Estimado:</Typography>
                          <Box sx={{ flex: 1, height: 30 }}>
                            <ResponsiveContainer width="100%" height={30}>
                              <BarChart data={[{ name: item.name, valor: item.estimado }]} layout="vertical">
                                <XAxis type="number" domain={[0, max]} hide />
                                <YAxis type="category" dataKey="name" hide />
                                <RTooltip formatter={(value) => [formatCurrency(value), '']} />
                                <Bar dataKey="valor" fill={EGRESO_EST_COLOR} radius={[4,4,4,4]}
                                     label={{ position: 'right', formatter: (v) => formatCurrency(v) }} />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body2" sx={{ minWidth: 80 }}>Real:</Typography>
                          <Box sx={{ flex: 1, height: 30 }}>
                            <ResponsiveContainer width="100%" height={30}>
                              <BarChart data={[{ name: item.name, valor: item.real }]} layout="vertical">
                                <XAxis type="number" domain={[0, max]} hide />
                                <YAxis type="category" dataKey="name" hide />
                                <RTooltip formatter={(value) => [formatCurrency(value), '']} />
                                <Bar dataKey="valor" fill={EGRESO_COLOR} radius={[4,4,4,4]}
                                     label={{ position: 'right', formatter: (v) => formatCurrency(v) }} />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          )}
        </>
      )}

      {/* === PestaÃ±a 1: Tabla editable === */}
      {tab === 1 && (
        <Paper sx={{ p: 2 }}>
          {/* Agregar nueva lÃ­nea */}
          {esAdmin && (
          <Box sx={{ mb: 2 }}>
            {!agregando ? (
              <Button startIcon={<AddCircleOutlineIcon />} variant="contained" onClick={() => setAgregando(true)}>
                Agregar categoría
              </Button>
            ) : (
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} md={4} sx={{ minWidth: 240 }}>
                  <Autocomplete
                    size="small"
                    fullWidth
                    value={nueva.categoria || null}
                    onChange={(_, newValue) => {
                      setNueva((s) => ({ ...s, categoria: newValue || '' }));
                    }}
                    options={opcionesNuevaLinea}
                    freeSolo={false}
                    disableClearable
                    forcePopupIcon
                    popupIcon={<KeyboardArrowDownIcon />}
                    componentsProps={{
                      popupIndicator: {
                        disableRipple: true,
                        disableFocusRipple: true,
                        sx: {
                          p: 0,
                          m: 0,
                          bgcolor: 'transparent',
                          border: 'none',
                          boxShadow: 'none',
                          '&:hover': { bgcolor: 'transparent' },
                          '& .MuiTouchRipple-root': { display: 'none' },
                          '& .MuiSvgIcon-root': { fontSize: 24 },
                        },
                      },
                      clearIndicator: { sx: { display: 'none' } },
                    }}
                    sx={{
                      '& .MuiAutocomplete-endAdornment': {
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                      },
                      '& .MuiAutocomplete-popupIndicator': { p: 0 },
                      '& .MuiAutocomplete-popupIndicatorOpen .MuiSvgIcon-root': {
                        transform: 'none',
                      },
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Categoría"
                        size="small"
                        fullWidth
                        InputLabelProps={params.InputLabelProps}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small" sx={buildTipoSelectSx(nueva.tipo)}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      label="Tipo"
                      value={nueva.tipo}
                      onChange={(e) => setNueva((s) => ({ ...s, tipo: e.target.value }))}
                      size="small"
                    >
                      <MenuItem value="Ingreso">INGRESO</MenuItem>
                      <MenuItem value="Egreso">EGRESO</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Estimado"
                    type="text"
                    fullWidth
                    size="small"
                    InputLabelProps={{ sx: CENTERED_INPUT_LABEL_SX }}
                    value={formatCurrencyInput(nueva.montoEstimado)}
                    onChange={(e) => {
                      const parsed = parseCurrency(e.target.value, { returnEmpty: true });
                      setNueva((s) => ({ ...s, montoEstimado: parsed === '' ? '' : parsed }));
                    }}
                    inputProps={{ inputMode: 'numeric' }}
                  />
                </Grid>
                <Grid item xs={12} md={3} display="flex" gap={1} justifyContent="flex-end">
                  <Button variant="outlined" onClick={() => { setAgregando(false); setNueva({ categoria: '', tipo: 'Egreso', montoEstimado: '' }); }}>
                    Cancelar
                  </Button>
                  <Button variant="contained" onClick={addLinea}>Guardar</Button>
                </Grid>
              </Grid>
            )}
          </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ fontWeight: 'bold', borderBottom: '1px solid var(--mui-palette-divider)' }}>
                  <th style={{ padding: 12, borderRight: '1px solid var(--mui-palette-divider)' }}>Categoría</th>
                  <th style={{ padding: 12, borderRight: '1px solid var(--mui-palette-divider)' }}>Tipo</th>
                  <th style={{ padding: 12, borderRight: '1px solid var(--mui-palette-divider)' }}>Estimado</th>
                  <th style={{ padding: 12, borderRight: '1px solid var(--mui-palette-divider)' }}>Real</th>
                  <th style={{ padding: 12, borderRight: '1px solid var(--mui-palette-divider)' }}>Desvío</th>
                  {esAdmin && <th style={{ padding: 12 }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {lineasCompleto.length > 0 ? (
                  lineasCompleto.map((item, idx) => {
                    const e = edits[item.id] || { categoria: '', tipo: 'Egreso', montoEstimado: 0, real: '' };
                    const estimadoOriginal = safeNumber(item.montoEstimado);
                    const estimadoRaw = e.montoEstimado;
                    const estimadoN = estimadoRaw === '' ? 0 : safeNumber(estimadoRaw);
                    const realN = e.real === '' ? 0 : safeNumber(e.real);
                    const manualEnabled = isFieldUnlocked(item.id, 'categoria');
                    const esSoloReal = Boolean(item._soloReal);
                    const cambioPendienteEstimado = manualEnabled && (estimadoRaw === '' || estimadoN !== estimadoOriginal);
                    const sinPronostico = esSoloReal && realN > 0 && !cambioPendienteEstimado;
                    const desvio = e.tipo === 'Egreso' ? (estimadoN - realN) : (realN - estimadoN);
                    const realMovementIds = Array.isArray(item.movimientoIds) ? item.movimientoIds : [];
                    const baseIdx = lineas.findIndex((l) => l.id === item.id);

                    const updateField = (field, value) =>
                      setEdits((prev) => ({ ...prev, [item.id]: { ...prev[item.id], [field]: value } }));

                    const handleGuardar = () => {
                      const payload = {
                        id: item.id,
                        categoria: e.categoria,
                        tipo: e.tipo,
                        montoEstimado: safeNumber(e.montoEstimado),
                        real: e.real === '' ? null : safeNumber(e.real),
                      };
                      if (esSoloReal) {
                        crearLineaDesdeReal(payload);
                      } else {
                        patchLinea(payload);
                      }
                    };

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--mui-palette-divider)' }}>
                        <td style={{ padding: 12, borderRight: '1px solid var(--mui-palette-divider)', minWidth: 215 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {esAdmin && manualEnabled ? (
                              (() => {
                                // Oculta las categorías ya asignadas a otras líneas del mismo mes.
                                const categoriaActual = e.categoria || '';
                                const categoriaActualNorm = normCat(categoriaActual);
                                const categoriasOcupadas = new Set(
                                  lineasCompleto
                                    .filter((otra) => otra.id !== item.id)
                                    .map((otra) => (edits[otra.id]?.categoria ?? otra.categoria ?? ''))
                                    .map((valor) => normCat(valor))
                                    .filter(Boolean)
                                );

                                let opcionesDisponibles = categoriasOptions.filter((option) => {
                                  if (typeof option !== 'string') return false;
                                  const normalizada = normCat(option);
                                  if (!normalizada) return false;
                                  if (normalizada === categoriaActualNorm) return true;
                                  return !categoriasOcupadas.has(normalizada);
                                });

                                if (categoriaActual && !opcionesDisponibles.some((opt) => normCat(opt) === categoriaActualNorm)) {
                                  opcionesDisponibles = [categoriaActual, ...opcionesDisponibles];
                                }

                                return (
                                  <Autocomplete
                                    size="small"
                                    fullWidth
                                    value={e.categoria || null}
                                    onChange={(_, newValue) => {
                                      updateField('categoria', newValue || '');
                                    }}
                                    options={opcionesDisponibles}
                                    freeSolo={false}
                                    disableClearable
                                    forcePopupIcon
                                    popupIcon={<KeyboardArrowDownIcon />}
                                    componentsProps={{
                                      popupIndicator: {
                                        disableRipple: true,
                                        disableFocusRipple: true,
                                        sx: {
                                          p: 0,
                                          m: 0,
                                          bgcolor: 'transparent',
                                          border: 'none',
                                          boxShadow: 'none',
                                          '&:hover': { bgcolor: 'transparent' },
                                          '& .MuiTouchRipple-root': { display: 'none' },
                                          '& .MuiSvgIcon-root': { fontSize: 24 },
                                        },
                                      },
                                      clearIndicator: { sx: { display: 'none' } },
                                    }}
                                    sx={{
                                      '& .MuiAutocomplete-endAdornment': {
                                        right: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                      },
                                      '& .MuiAutocomplete-popupIndicator': { p: 0 },
                                      '& .MuiAutocomplete-popupIndicatorOpen .MuiSvgIcon-root': {
                                        transform: 'none',
                                      },
                                    }}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        size="small"
                                        fullWidth
                                      />
                                    )}
                                  />
                                );
                              })()
                            ) : (
                              <TextField
                                size="small"
                                fullWidth
                                value={e.categoria}
                                InputProps={{ readOnly: true }}
                              />
                            )}
                          </Box>
                        </td>
                        <td style={{ padding: 12, borderRight: '1px solid var(--mui-palette-divider)', minWidth: 100 }}>
                          <FormControl size="small" fullWidth disabled={!manualEnabled || !esAdmin} sx={buildTipoSelectSx(e.tipo)}>
                            <Select
                              value={e.tipo}
                              onChange={(ev) => {
                                if (!manualEnabled || !esAdmin) return;
                                updateField('tipo', ev.target.value);
                              }}
                              size="small"
                              disabled={!manualEnabled || !esAdmin}
                            >
                              <MenuItem value="Ingreso">INGRESO</MenuItem>
                              <MenuItem value="Egreso">EGRESO</MenuItem>
                            </Select>
                          </FormControl>
                        </td>
                        <td style={{ padding: 12, borderRight: '1px solid var(--mui-palette-divider)', minWidth: 180 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <TextField
                              size="small"
                              type="text"
                              fullWidth
                              value={formatCurrencyInput(e.montoEstimado)}
                              onChange={(ev) => {
                                if (!manualEnabled) return;
                                updateField('montoEstimado', parseCurrency(ev.target.value));
                              }}
                              InputProps={{ readOnly: !manualEnabled || !esAdmin }}
                              inputProps={{ inputMode: 'numeric' }}
                            />
                            {esAdmin && (
                              manualEnabled ? (
                                <Tooltip title="Deshabilitar edición manual">
                                  <IconButton size="small" onClick={() => toggleManualGuard(item.id, 'categoria', false)}>
                                    <EditOffOutlinedIcon fontSize="small" color="warning" />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Editar (categoría, tipo y estimado)">
                                  <IconButton size="small" onClick={() => requestManualUnlock(item.id, 'categoria')}>
                                    <EditOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )
                            )}
                          </Box>
                        </td>
                        <td style={{ padding: 12, borderRight: '1px solid var(--mui-palette-divider)', minWidth: 180 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <TextField
                              size="small"
                              type="text"
                              fullWidth
                              value={formatCurrencyInput(e.real)}
                              InputProps={{ readOnly: true }}
                              inputProps={{ inputMode: 'numeric' }}
                            />
                            <Tooltip title={realMovementIds.length ? 'Editar monto real' : 'No hay movimientos para editar'}>
                              <IconButton size="small" onClick={() => requestManualUnlock(item.id, 'real')}>
                                <LockOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </td>
                        <td style={{ padding: 12, borderRight: '1px solid var(--mui-palette-divider)', color: desvio >= 0 ? '#66bb6a' : '#ef5350' , minWidth: 100 }}>
                          {desvio >= 0 ? '+' : '-'}{formatCurrency(Math.abs(desvio))}
                        </td>
                        {esAdmin && (
                        <td style={{ padding: 12, whiteSpace: 'nowrap', textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5 }}>
                            <Tooltip title={esSoloReal ? 'Crear linea de presupuesto con este movimiento' : 'Guardar cambios'}>
                              <span>
                                <IconButton size="small" onClick={handleGuardar}>
                                  <SaveOutlinedIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                            {sinPronostico && (
                              <Tooltip title="Movimiento sin pronosticar: no tiene monto estimado.">
                                <Chip
                                  size="small"
                                  icon={<WarningAmberOutlinedIcon fontSize="small" />}
                                  label="Sin pronosticar"
                                  variant="filled"
                                  sx={SIN_PRONOSTICO_CHIP_SX}
                                />
                              </Tooltip>
                            )}
                            {!esSoloReal && (
                              <>
                                <Tooltip title="Eliminar esta linea">
                                  <span>
                                    <IconButton size="small" onClick={() => openDeletePrompt(item)}>
                                      <DeleteOutlineIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Aplicar esta linea a varios meses">
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        if (baseIdx >= 0) abrirDlgVariosConFila(baseIdx);
                                      }}
                                    >
                                      <ContentCopyIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={esAdmin ? 6 : 5} style={{ textAlign: 'center', padding: 20, color: 'var(--mui-palette-text-secondary)' }}>
                      No hay datos disponibles.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>
        </Paper>
      )}

      {/* Volver */}
      <Box mt={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Button variant="outlined" onClick={() => navigate(-1)}>Volver</Button>
      </Box>

      {/* Confirmar edición manual */}
      <Dialog open={guardPrompt.open} onClose={handleGuardCancel} maxWidth="sm" fullWidth>
        <DialogTitle>{guardPrompt.title || 'Confirmar edición manual'}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            {guardPrompt.message || 'Esta acción habilita la edición manual.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleGuardCancel}>Cancelar</Button>
          <Button variant="contained" color="warning" onClick={handleGuardConfirm}>
            {guardPrompt.confirmLabel || 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deletePrompt.open} onClose={closeDeletePrompt} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar movimiento</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            Se eliminará la categoría <strong>{deletePrompt.categoria || 'sin nombre'}</strong> ({deletePrompt.tipo ? deletePrompt.tipo.toLowerCase() : 'movimiento'}) de este mes.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeletePrompt}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={confirmDeletePrompt}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Reglas rápidas (visual) */}
      <Dialog open={dlgReglas} onClose={() => setDlgReglas(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reglas rápidas (simulación)</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Ámbito" value={regla.ambito} onChange={(e) => setRegla((r) => ({ ...r, ambito: e.target.value }))}>
              <MenuItem value="este_mes">Este mes</MenuItem>
              <MenuItem value="hasta_fin">Desde este mes hasta fin de año</MenuItem>
              <MenuItem value="rango">Rango personalizado</MenuItem>
            </TextField>
            {regla.ambito === 'rango' && (
              <Stack direction="row" spacing={2}>
                <TextField label="Desde (YYYY-MM)" value={regla.rangoDesde} onChange={(e) => setRegla((r) => ({ ...r, rangoDesde: e.target.value }))} />
                <TextField label="Hasta (YYYY-MM)" value={regla.rangoHasta} onChange={(e) => setRegla((r) => ({ ...r, rangoHasta: e.target.value }))} />
              </Stack>
            )}
            <TextField select label="Modo" value={regla.modo} onChange={(e) => setRegla((r) => ({ ...r, modo: e.target.value }))}>
              <MenuItem value="FIJO">Monto fijo</MenuItem>
              <MenuItem value="AJUSTE_PCT">% Ajuste mensual</MenuItem>
              <MenuItem value="UNICO">Único (1 mes)</MenuItem>
              <MenuItem value="CUOTAS">En cuotas</MenuItem>
            </TextField>
            <TextField
              label={regla.modo === 'AJUSTE_PCT' ? '% valor' : 'Monto'}
              type={regla.modo === 'AJUSTE_PCT' ? 'number' : 'text'}
              value={regla.modo === 'AJUSTE_PCT' ? regla.valor : formatCurrencyInput(regla.valor)}
              onChange={(e) => {
                if (regla.modo === 'AJUSTE_PCT') {
                  setRegla((r) => ({ ...r, valor: Number(e.target.value) }));
                } else {
                  const parsed = parseCurrency(e.target.value, { returnEmpty: true });
                  setRegla((r) => ({ ...r, valor: parsed === '' ? '' : parsed }));
                }
              }}
              inputProps={regla.modo === 'AJUSTE_PCT' ? { step: 0.1, inputMode: 'decimal' } : { inputMode: 'numeric' }}
            />
            <TextField select label="Aplicar a" value={regla.solo} onChange={(e) => setRegla((r) => ({ ...r, solo: e.target.value }))}>
              <MenuItem value="todos">Ingresos y egresos</MenuItem>
              <MenuItem value="Ingresos">Solo ingresos</MenuItem>
              <MenuItem value="Egresos">Solo egresos</MenuItem>
            </TextField>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Previsualización (conceptual)</Typography>
              <Typography variant="body2" color="text.secondary">
                Aquí mostrarías una mini-grilla con las celdas impactadas antes de confirmar.
              </Typography>
            </Paper>
            <FormControlLabel control={<Switch checked={simulacion} onChange={(_, v) => setSimulacion(v)} />} label="Simular cambios (no impacta datos reales)" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgReglas(false)}>Cerrar</Button>
          <Button variant="contained" disabled={!simulacion} onClick={() => { setDlgReglas(false); window.alert('Simulación: regla aplicada (visual).'); }}>
            Aplicar (visual)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo varios meses */}
      <Dialog open={dlgVarios} onClose={() => setDlgVarios(false)} fullWidth maxWidth="sm">
        <DialogTitle>Aplicar a varios meses</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField select label="Acción" value={bulkCfg.accion} onChange={(e) => setBulkCfg((s) => ({ ...s, accion: e.target.value }))}>
              <MenuItem value="replicar">Replicar esta línea en un rango</MenuItem>
              <MenuItem value="eliminar">Eliminar esta categoría (mismo tipo) en un rango</MenuItem>
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField label="Desde (YYYY-MM)" value={bulkCfg.desde} onChange={(e) => setBulkCfg((s) => ({ ...s, desde: e.target.value }))} placeholder="2025-07" />
              <TextField label="Hasta (YYYY-MM)" value={bulkCfg.hasta} onChange={(e) => setBulkCfg((s) => ({ ...s, hasta: e.target.value }))} placeholder="2025-12" />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              • Replicar: crea una línea por cada mes con los mismos valores (no deduplica).<br />
              • Eliminar: busca por <b>categoría + tipo</b> en cada mes y borra coincidencias.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgVarios(false)}>Cancelar</Button>
          <Button variant="contained" onClick={ejecutarBulk}>Confirmar</Button>
        </DialogActions>
      </Dialog>      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
