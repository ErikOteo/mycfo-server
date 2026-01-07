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

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatPeriodLabel = (period) => {
  if (!period || typeof period !== "string") {
    return "";
  }
  const [year, month] = period.split("-");
  if (!year || !month) {
    return period;
  }
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(date);
};

export const fetchMonthlySummary = async ({ period } = {}) => {
  const usuarioSub = getSessionUserSub();
  if (!usuarioSub) {
    throw new Error("No encontramos el usuario en la sesión.");
  }

  const params = new URLSearchParams();
  if (period) {
    const [year, month] = period.split("-");
    if (year && month) {
      params.set("fecha", `${year}-${month}-01`);
    }
  }

  const url = `${API_CONFIG.REGISTRO}/movimientos/resumen/mensual${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const response = await fetch(url, {
    headers: {
      "X-Usuario-Sub": usuarioSub,
    },
    credentials: "include",
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    // ignoramos errores de parseo si la respuesta no es JSON
  }

  if (!response.ok) {
    const message =
      (payload && (payload.mensaje || payload.error || payload.message)) ||
      `No pudimos obtener el resumen mensual (código ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return {
    organizationId: payload?.organizacionId ?? null,
    period: payload?.periodo ?? null,
    periodLabel: formatPeriodLabel(payload?.periodo),
    periodStart: payload?.periodoInicio ?? null,
    periodEnd: payload?.periodoFin ?? null,
    totalIncomes: toNumber(payload?.ingresosTotales),
    totalExpenses: toNumber(payload?.egresosTotales),
    netResult: toNumber(payload?.resultadoNeto),
    movementsCount: Number(payload?.totalMovimientos ?? 0) || 0,
  };
};

export const fetchTotalBalance = async () => {
  const usuarioSub = getSessionUserSub();
  if (!usuarioSub) {
    throw new Error("No encontramos el usuario en la sesión.");
  }

  const url = `${API_CONFIG.REGISTRO}/movimientos/resumen/saldo-total`;

  const response = await fetch(url, {
    headers: {
      "X-Usuario-Sub": usuarioSub,
    },
    credentials: "include",
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    // ignoramos errores de parseo si la respuesta no es JSON
  }

  if (!response.ok) {
    const message =
      (payload && (payload.mensaje || payload.error || payload.message)) ||
      `No pudimos obtener el saldo total (código ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return {
    organizationId: payload?.organizacionId ?? null,
    totalBalance: toNumber(payload?.saldoTotal),
  };
};
