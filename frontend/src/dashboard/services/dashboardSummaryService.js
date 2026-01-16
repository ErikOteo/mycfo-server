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

export const fetchDashboardSummary = async ({
  period,
  months = 12,
  limitMovements = 6,
  limitInvoices = 6,
  currency,
} = {}) => {
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

  if (months) {
    params.set("meses", String(months));
  }

  if (limitMovements) {
    params.set("limiteMovimientos", String(limitMovements));
  }

  if (limitInvoices) {
    params.set("limiteFacturas", String(limitInvoices));
  }

  if (currency) {
    params.set("moneda", currency);
  }

  const url = `${API_CONFIG.REGISTRO}/movimientos/resumen/dashboard${
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
      `No pudimos obtener el resumen de dashboard (código ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload;
};
