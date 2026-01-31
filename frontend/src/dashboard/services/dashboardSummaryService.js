import http from "../../api/http";
import API_CONFIG from "../../config/api-config";

export const fetchDashboardSummary = async ({
  period,
  months = 12,
  limitMovements = 6,
  limitInvoices = 6,
  currency,
} = {}) => {
  const params = new URLSearchParams();

  if (period) {
    const [year, month] = period.split("-");
    if (year && month) params.set("fecha", `${year}-${month}-01`);
  }
  if (months) params.set("meses", String(months));
  if (limitMovements) params.set("limiteMovimientos", String(limitMovements));
  if (limitInvoices) params.set("limiteFacturas", String(limitInvoices));
  if (currency) params.set("moneda", currency);

  const qs = params.toString();
  const url = `${API_CONFIG.REGISTRO}/movimientos/resumen/dashboard${qs ? `?${qs}` : ""}`;

  const { data } = await http.get(url);
  return data;
};
