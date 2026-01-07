import API_CONFIG from "../../config/api-config";

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

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (err) {
    return null;
  }
};

const ensurePeriodDate = (period) => {
  if (!period) {
    return null;
  }
  const [year, month] = period.split("-");
  if (!year || !month) {
    return null;
  }
  return `${year}-${month}-01`;
};

const fetchMontosMensuales = async ({ period, months = 12 } = {}, endpoint) => {
  const usuarioSub = getSessionUserSub();
  if (!usuarioSub) {
    throw new Error("No encontramos el usuario en la sesion.");
  }

  const params = new URLSearchParams();
  const fecha = ensurePeriodDate(period);
  if (fecha) {
    params.set("fecha", fecha);
  }
  if (months) {
    params.set("meses", String(months));
  }

  const response = await fetch(
    `${API_CONFIG.REGISTRO}/movimientos/resumen/${endpoint}${
      params.toString() ? `?${params.toString()}` : ""
    }`,
    {
      headers: {
        "X-Usuario-Sub": usuarioSub,
      },
      credentials: "include",
    }
  );

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const message =
      (payload && (payload.mensaje || payload.error || payload.message)) ||
      `No pudimos obtener los montos (${endpoint}) (codigo ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload ?? {};
};

const fetchMontosPorCategoria = async ({ period } = {}, endpoint) => {
  const usuarioSub = getSessionUserSub();
  if (!usuarioSub) {
    throw new Error("No encontramos el usuario en la sesion.");
  }

  const params = new URLSearchParams();
  const fecha = ensurePeriodDate(period);
  if (fecha) {
    params.set("fecha", fecha);
  }

  const response = await fetch(
    `${API_CONFIG.REGISTRO}/movimientos/resumen/${endpoint}${
      params.toString() ? `?${params.toString()}` : ""
    }`,
    {
      headers: {
        "X-Usuario-Sub": usuarioSub,
      },
      credentials: "include",
    }
  );

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const message =
      (payload && (payload.mensaje || payload.error || payload.message)) ||
      `No pudimos obtener los montos por categoria (${endpoint}) (codigo ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload ?? {};
};

const fetchConciliacionResumen = async ({ period } = {}) => {
  const usuarioSub = getSessionUserSub();
  if (!usuarioSub) {
    throw new Error("No encontramos el usuario en la sesion.");
  }

  const params = new URLSearchParams();
  const fecha = ensurePeriodDate(period);
  if (fecha) {
    params.set("fecha", fecha);
  }

  const response = await fetch(
    `${API_CONFIG.REGISTRO}/movimientos/resumen/conciliacion${
      params.toString() ? `?${params.toString()}` : ""
    }`,
    {
      headers: {
        "X-Usuario-Sub": usuarioSub,
      },
      credentials: "include",
    }
  );

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const message =
      (payload && (payload.mensaje || payload.error || payload.message)) ||
      `No pudimos obtener el resumen de conciliacion (codigo ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload ?? {};
};

export const fetchMonthlyIncomes = (options = {}) =>
  fetchMontosMensuales(options, "ingresos-mensuales");

export const fetchMonthlyExpenses = (options = {}) =>
  fetchMontosMensuales(options, "egresos-mensuales");

export const fetchIncomeByCategory = (options = {}) =>
  fetchMontosPorCategoria(options, "ingresos-categorias");

export const fetchExpensesByCategory = (options = {}) =>
  fetchMontosPorCategoria(options, "egresos-categorias");

export const fetchReconciliationSummary = (options = {}) =>
  fetchConciliacionResumen(options);



