import axios from 'axios';
import dayjs from 'dayjs';
import API_CONFIG from '../config/api-config';

const URL_REPORTE = API_CONFIG.REPORTE;
const URL_REGISTRO = API_CONFIG.REGISTRO;
const DEFAULT_PAGE_SIZE = 1000;

const normalizeCategoria = (value) => {
  if (value == null) return 'sin-categoria';
  const str = String(value);
  if (!str) return 'sin-categoria';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
};

const resolveFecha = (input, endOfDay = false) => {
  if (!input) return undefined;
  const parsed = dayjs(input);
  if (!parsed.isValid()) return undefined;
  const target = endOfDay ? parsed.endOf('day') : parsed.startOf('day');
  return target.format('YYYY-MM-DD');
};

const resolveFechaMonthEnd = (input) => {
  if (!input) return undefined;
  const parsed = dayjs(input);
  if (!parsed.isValid()) return undefined;
  return parsed.endOf('month').format('YYYY-MM-DD');
};

const resolveFechaMonthStart = (input) => {
  if (!input) return undefined;
  const parsed = dayjs(input);
  if (!parsed.isValid()) return undefined;
  return parsed.startOf('month').format('YYYY-MM-DD');
};

const resolveFechaYM = (input) => {
  if (!input) return null;
  const parsed = dayjs(input);
  if (!parsed.isValid()) return null;
  return parsed.format('YYYY-MM');
};

const getUsuarioHeaders = () => {
  const sub = sessionStorage.getItem('sub');
  return sub ? { 'X-Usuario-Sub': sub } : {};
};

export const getResumenMensual = async (anio, mes, categorias = []) => {
  try {
    const params = new URLSearchParams();
    params.set('anio', anio);
    params.set('mes', mes);

    if (Array.isArray(categorias) && categorias.length > 0) {
      categorias.forEach((cat) => {
        if (cat != null && cat !== '') params.append('categoria', cat);
      });
    }

    const headers = getUsuarioHeaders();
    const response = await axios.get(`${URL_REPORTE}/resumen`, { params, headers });
    return response.data;
  } catch (error) {
    console.error('Error al obtener resumen mensual:', error);
    throw error;
  }
};

export const getMovimientosPorRango = async ({
  fechaDesde,
  fechaHasta,
  tipos = ['INGRESO', 'EGRESO'],
  pageSize = DEFAULT_PAGE_SIZE,
} = {}) => {
  const headers = getUsuarioHeaders();
  const movimientos = [];

  const fechaDesdeStr = resolveFecha(fechaDesde);
  const fechaHastaStr = resolveFecha(fechaHasta, true);

  const buildQueryString = (page) => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', page);
    searchParams.set('size', pageSize);
    searchParams.set('sortBy', 'fechaEmision');
    searchParams.set('sortDir', 'asc');
    if (fechaDesdeStr) searchParams.set('fechaDesde', fechaDesdeStr);
    if (fechaHastaStr) searchParams.set('fechaHasta', fechaHastaStr);
    if (Array.isArray(tipos) && tipos.length > 0) {
      tipos.forEach((tipo) => {
        if (tipo) searchParams.append('tipos', String(tipo));
      });
    }
    return searchParams.toString();
  };

  try {
    let page = 0;
    let last = false;

    while (!last) {
      const queryString = buildQueryString(page);
      const response = await axios.get(
        `${URL_REGISTRO}/movimientos?${queryString}`,
        { headers }
      );
      const data = response?.data;
      const content = Array.isArray(data?.content) ? data.content : [];
      movimientos.push(...content);
      last = Boolean(data?.last ?? true);
      if (!last) page += 1;
    }

    return movimientos;
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    throw error;
  }
};

export const aggregateMovimientosPorMes = (movimientos = []) => {
  return movimientos.reduce((acc, movimiento) => {
    const fecha =
      movimiento?.fechaEmision ||
      movimiento?.fecha ||
      movimiento?.fechaOperacion ||
      movimiento?.fechaOperacionReal;
    const ym = resolveFechaYM(fecha);
    if (!ym) return acc;

    const tipo = String(movimiento?.tipo || '').toUpperCase();
    const monto = Number(movimiento?.montoTotal ?? movimiento?.monto ?? 0);
    if (!Number.isFinite(monto)) return acc;

    if (!acc[ym]) {
      acc[ym] = { ingresos: 0, egresos: 0 };
    }

    if (tipo === 'INGRESO') {
      acc[ym].ingresos += monto;
    } else if (tipo === 'EGRESO') {
      acc[ym].egresos += monto;
    }

    return acc;
  }, {});
};

export const aggregateMovimientosPorCategoria = (movimientos = []) => {
  return movimientos.reduce((acc, movimiento) => {
    const categoriaOriginal = movimiento?.categoria || 'Sin categoria';
    const key = normalizeCategoria(categoriaOriginal);
    const tipo = String(movimiento?.tipo || '').toUpperCase();
    const monto = Number(movimiento?.montoTotal ?? movimiento?.monto ?? 0);
    if (!Number.isFinite(monto)) return acc;

    if (!acc[key]) {
      acc[key] = {
        categoria: categoriaOriginal,
        ingresos: 0,
        egresos: 0,
      };
    } else if (!acc[key].categoria && categoriaOriginal) {
      acc[key].categoria = categoriaOriginal;
    }

    if (tipo === 'INGRESO') {
      acc[key].ingresos += monto;
    } else if (tipo === 'EGRESO') {
      acc[key].egresos += monto;
    }

    return acc;
  }, {});
};

export const buildCategoriaKey = (categoria) => normalizeCategoria(categoria);

export const obtenerRangoPresupuesto = (detalleMensual = []) => {
  const mesesOrdenados = detalleMensual
    .map((item) => resolveFechaYM(`${item?.mes || ''}-01`))
    .filter(Boolean)
    .sort();

  if (mesesOrdenados.length === 0) {
    return { desde: null, hasta: null };
  }

  const desde = resolveFechaMonthStart(`${mesesOrdenados[0]}-01`);
  const hasta = resolveFechaMonthEnd(`${mesesOrdenados[mesesOrdenados.length - 1]}-01`);

  return { desde, hasta };
};
