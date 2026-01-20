import API_CONFIG from "../../config/api-config";

// Base: siempre pegamos contra el proxy público (host nginx)
const BASE = (API_CONFIG?.BASE || "").replace(/\/$/, "");
const MP_BASE = `${BASE}/api/mp`;

const getSub = () => {
  try {
    return sessionStorage.getItem("sub") || sessionStorage.getItem("usuarioSub") || "";
  } catch {
    return "";
  }
};

const buildHeaders = (extra = {}) => {
  const sub = getSub();
  return {
    "Content-Type": "application/json",
    ...(sub ? { "X-Usuario-Sub": sub } : {}),
    ...extra,
  };
};

const fetchJson = async (url, opts = {}) => {
  const resp = await fetch(url, opts);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`MP API ${resp.status} ${resp.statusText} - ${text}`);
  }
  if (resp.status === 204) return null;
  return resp.json();
};

export const mpApi = {
  // --- STATUS ---
  // Nombre "nuevo" recomendado
  getStatus: () => fetchJson(`${MP_BASE}/status`, { method: "GET", headers: buildHeaders() }),
  // Alias por si algún lugar llama status()
  status: () => fetchJson(`${MP_BASE}/status`, { method: "GET", headers: buildHeaders() }),

  // --- OAUTH ---
  // Backend: MpController expone /oauth/url (según tu log genera la URL de MercadoLibre)
  startOAuth: async () => {
    const data = await fetchJson(`${MP_BASE}/oauth/url`, { method: "GET", headers: buildHeaders() });
    // por si el backend devuelve {url: "..."} o directamente string
    return typeof data === "string" ? data : data?.url;
  },

  // --- UNLINK ---
  unlink: () => fetchJson(`${MP_BASE}/unlink`, { method: "POST", headers: buildHeaders() }),

  // --- PREVIEW ---
  // Por mes (lo que usa MainGrid)
  previewPaymentsByMonth: (payload) =>
    fetchJson(`${MP_BASE}/preview`, { method: "POST", headers: buildHeaders(), body: JSON.stringify(payload) }),

  // Por paymentId (si tu backend lo tiene así; si no, lo dejamos por compatibilidad)
  previewPaymentById: (paymentId) =>
    fetchJson(`${MP_BASE}/preview/${encodeURIComponent(paymentId)}`, { method: "GET", headers: buildHeaders() }),

  // Alias por si algún componente llama preview() genérico
  preview: (payload) =>
    fetchJson(`${MP_BASE}/preview`, { method: "POST", headers: buildHeaders(), body: JSON.stringify(payload) }),

  // --- IMPORT ---
  importPaymentsByMonth: (payload) =>
    fetchJson(`${MP_BASE}/import`, { method: "POST", headers: buildHeaders(), body: JSON.stringify(payload) }),

  importPaymentById: (paymentId) =>
    fetchJson(`${MP_BASE}/import/${encodeURIComponent(paymentId)}`, { method: "POST", headers: buildHeaders() }),

  importSelectedPayments: (paymentIds) =>
    fetchJson(`${MP_BASE}/import/selected`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ paymentIds }),
    }),

  // --- LISTADO (IMPORTADOS) ---
  listImportedPayments: (params) => {
    const qs = new URLSearchParams(params || {}).toString();
    return fetchJson(`${MP_BASE}/imported-payments${qs ? `?${qs}` : ""}`, {
      method: "GET",
      headers: buildHeaders(),
    });
  },

  // --- UPDATE CATEGORY ---
  updatePaymentCategory: (paymentId, categoria) =>
    fetchJson(`${MP_BASE}/payments/${encodeURIComponent(paymentId)}/category`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify({ categoria }),
    }),

  // --- FACTURAR ---
  billPayments: (paymentIds) =>
    fetchJson(`${MP_BASE}/bill`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ paymentIds }),
    }),

  // --- CONFIG (si tu backend todavía no lo tiene, devolvemos defaults para no romper UI) ---
  getConfig: async () => {
    // Si después implementás /config en backend, cambiás acá a `${MP_BASE}/config`
    return { autoBill: false, timezone: "America/Argentina/Buenos_Aires" };
  },
  updateConfig: async (cfg) => {
    // idem: si luego existe backend, mandalo ahí
    return cfg;
  },
};
