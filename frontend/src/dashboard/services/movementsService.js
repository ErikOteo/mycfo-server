import API_CONFIG from "../../config/api-config";

const DEFAULT_LIMIT = 6;

const getSessionUserSub = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.sessionStorage.getItem("sub");
  } catch (err) {
    console.error("No se pudo acceder a sessionStorage:", err);
    return null;
  }
};

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const extractContent = (payload) => {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.content)) {
    return payload.content;
  }
  if (Array.isArray(payload.registros)) {
    return payload.registros;
  }
  return [];
};

const mapMovement = (item, index) => ({
  id: item.id ?? item.uuid ?? `movement-${index}`,
  tipo: item.tipo ?? item.tipoMovimiento ?? item.tipoOperacion ?? "Movimiento",
  montoTotal: toNumber(item.montoTotal ?? item.monto ?? item.importe ?? 0),
  moneda: item.moneda ?? item.monedaCodigo ?? "ARS",
  fechaEmision: item.fechaEmision ?? item.fecha ?? item.fechaRegistro ?? null,
  categoria:
    item.categoria ??
    item.categoriaNombre ??
    item.categoriaDescripcion ??
    item.area ??
    null,
});

export const fetchRecentMovements = async ({ limit = DEFAULT_LIMIT } = {}) => {
  const usuarioSub = getSessionUserSub();
  if (!usuarioSub) {
    throw new Error("No encontramos el usuario en la sesión.");
  }

  const safeLimit = Math.max(Number(limit) || DEFAULT_LIMIT, 1);
  const params = new URLSearchParams({
    page: "0",
    size: String(safeLimit),
    sortBy: "fechaEmision",
    sortDir: "desc",
  });

  const response = await fetch(`${API_CONFIG.REGISTRO}/movimientos?${params.toString()}`, {
    headers: {
      "X-Usuario-Sub": usuarioSub,
    },
    credentials: "include",
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    // Ignoramos errores de parseo; manejamos segun status.
  }

  if (!response.ok) {
    const message =
      (payload && (payload.mensaje || payload.error || payload.message)) ||
      `No pudimos obtener los movimientos (código ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const records = extractContent(payload);
  return records.slice(0, safeLimit).map(mapMovement);
};

const mapInvoice = (item, index) => ({
  id: item.id ?? item.idDocumento ?? `invoice-${index}`,
  tipoFactura: item.tipoFactura ?? "Factura",
  numeroDocumento: item.numeroDocumento ?? null,
  montoTotal: toNumber(item.montoTotal ?? 0),
  moneda: item.moneda ?? "ARS",
  fechaEmision: item.fechaEmision ?? null,
  compradorNombre: item.compradorNombre ?? null,
  vendedorNombre: item.vendedorNombre ?? null,
});

export const fetchRecentInvoices = async ({ limit = DEFAULT_LIMIT } = {}) => {
  const usuarioSub = getSessionUserSub();
  if (!usuarioSub) {
    throw new Error("No encontramos el usuario en la sesión.");
  }

  const safeLimit = Math.max(Number(limit) || DEFAULT_LIMIT, 1);
  const params = new URLSearchParams({
    page: "0",
    size: String(safeLimit),
    sortBy: "fechaEmision",
    sortDir: "desc",
  });

  const response = await fetch(
    `${API_CONFIG.REGISTRO}/facturas/buscar?${params.toString()}`,
    {
      headers: {
        "X-Usuario-Sub": usuarioSub,
      },
      credentials: "include",
    }
  );

  let payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    // Ignoramos errores de parseo; manejamos segun status.
  }

  if (!response.ok) {
    const message =
      (payload && (payload.mensaje || payload.error || payload.message)) ||
      `No pudimos obtener las facturas (código ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const records = extractContent(payload);
  return records.slice(0, safeLimit).map(mapInvoice);
};
