// /mercado-pago/mpApi.js
import API_CONFIG from "../../config/api-config";

const BASE_URL = API_CONFIG.REGISTRO;

const USER_HEADER = "X-Usuario-Sub";

async function request(path, { method = "GET", body, headers } = {}) {
  const url = `${BASE_URL}${path}`;
  const opts = {
    method,
    headers: {
      ...(headers || {}),
    },
  };

  const usuarioSub = sessionStorage.getItem("sub");
  if (usuarioSub) {
    opts.headers[USER_HEADER] = usuarioSub;
  }

  // ✅ MINIMO CAMBIO: enviar Authorization Bearer si existe
  const accessToken = sessionStorage.getItem("accessToken");
  if (accessToken) {
    opts.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // Solo seteamos JSON si hay body
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  // Si NO usás cookies/sesión en el back, podés quitar esta línea:
  // opts.credentials = "include";

  const res = await fetch(url, opts);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      data?.message || data?.error || text || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export const mpApi = {
  getStatus: () => request("/api/mp/status"),

  startOAuth: async () => {
    const res = await request("/api/mp/oauth/url");
    console.log("Respuesta /oauth/url:", res);
    const authUrl = res?.url || res?.authUrl;
    if (!authUrl)
      throw new Error("El backend no devolvió la URL de autorización");
    return authUrl;
  },

  unlink: () => request("/api/mp/unlink", { method: "POST" }),

  listPayments: (params = {}) => {
    const { from, to, q, page = 0, pageSize = 20 } = params;
    const sp = new URLSearchParams();
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    if (q) sp.set("q", q);
    sp.set("page", page);
    sp.set("size", pageSize);
    sp.set("sort", "fecha,DESC");
    return request(`/api/mp/payments?${sp.toString()}`);
  },

  // Nuevo endpoint para obtener solo los pagos importados
  listImportedPayments: (params = {}) => {
    const { from, to, q, page = 0, pageSize = 20 } = params;
    const sp = new URLSearchParams();
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    if (q) sp.set("q", q);
    sp.set("page", page);
    sp.set("size", pageSize);
    sp.set("sort", "fecha,DESC");
    return request(`/api/mp/imported-payments?${sp.toString()}`);
  },

  // Métodos de preview (sin guardar)
  previewPaymentsByMonth: ({ month, year }) =>
    request("/api/mp/preview", { method: "POST", body: { month, year } }),

  previewPaymentById: (paymentId) =>
    request("/api/mp/preview", { method: "POST", body: { paymentId } }),

  previewByExternalReference: (externalReference) =>
    request("/api/mp/preview", { method: "POST", body: { externalReference } }),

  // Importar pagos seleccionados
  importSelectedPayments: (paymentIds) =>
    request("/api/mp/import/selected", { method: "POST", body: paymentIds }),

  // Métodos de importación directa (legacy)
  importPaymentsByMonth: ({ month, year }) =>
    request("/api/mp/import", { method: "POST", body: { month, year } }),

  importPaymentById: (paymentId) =>
    request("/api/mp/import", { method: "POST", body: { paymentId } }),

  getConfig: () => request("/api/mp/config"),
  updateConfig: (cfg) =>
    request("/api/mp/config", { method: "PUT", body: cfg }),

  billPayments: (ids) =>
    request("/api/mp/facturar", { method: "POST", body: { paymentIds: ids } }),

  // Actualizar categoría de un pago
  updatePaymentCategory: (registroId, newCategory) =>
    request(`/api/mp/payments/${registroId}/category`, {
      method: "PUT",
      body: { categoria: newCategory },
    }),
};
