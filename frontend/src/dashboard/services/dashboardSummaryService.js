import http from "../api/http"; // ajustá el path según tu estructura
import API_CONFIG from "../../config/api-config";

const getSessionUserSub = () => {
  if (typeof window === "undefined") return null;
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
} = {}) => {
  const usuarioSub = getSessionUserSub();
  if (!usuarioSub) {
    throw new Error("No encontramos el usuario en la sesión.");
  }

  const params = new URLSearchParams();

  if (period) {
    const [year, month] = String(period).split("-");
    if (year && month) params.set("fecha", `${year}-${month}-01`);
  }

  if (months) params.set("meses", String(months));
  if (limitMovements) params.set("limiteMovimientos", String(limitMovements));
  if (limitInvoices) params.set("limiteFacturas", String(limitInvoices));

  const url = `${API_CONFIG.REGISTRO}/movimientos/resumen/dashboard`;

  try {
    const { data } = await http.get(url, {
      params: Object.fromEntries(params.entries()),
      headers: {
        // por si tu interceptor no lo agrega siempre, lo forzamos acá también
        "X-Usuario-Sub": usuarioSub,
      },
    });

    return data;
  } catch (err) {
    const status = err?.response?.status;
    const payload = err?.response?.data;

    const message =
      (payload && (payload.mensaje || payload.error || payload.message)) ||
      `No pudimos obtener el resumen de dashboard (código ${status ?? "?"}).`;

    const error = new Error(message);
    error.status = status;
    throw error;
  }
};
