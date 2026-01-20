import API_CONFIG from "../../config/api-config";

const BASE = API_CONFIG.BASE || "";
const MP_BASE = `${BASE}/api/mp`;
const CONFIG_KEY = "mp_config_v1";

const getUsuarioSub = () => {
  try {
    return sessionStorage.getItem("sub") || sessionStorage.getItem("usuarioSub") || "";
  } catch (e) {
    return "";
  }
};

const headers = () => {
  const sub = getUsuarioSub();
  return sub ? { "X-Usuario-Sub": sub } : {};
};

const safeJson = async (resp) => {
  const txt = await resp.text();
  if (!txt) return null;
  try { return JSON.parse(txt); } catch { return txt; }
};

const get = async (url, params) => {
  const u = new URL(url);
  if (params) Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, v);
  });

  const resp = await fetch(u.toString(), { headers: headers() });
  if (!resp.ok) throw new Error(await resp.text());
  return safeJson(resp);
};

const post = async (url, body) => {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return safeJson(resp);
};

const put = async (url, body) => {
  const resp = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...headers() },
    body: JSON.stringify(body ?? {}),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return safeJson(resp);
};

export const mpApi = {
  // --- compat + fix inmediato ---
  async status() {
    return get(`${MP_BASE}/status`);
  },
  async getStatus() {               // 👈 esto arregla tu error actual
    return this.status();
  },

  async unlink() {
    // backend devuelve 204 normalmente
    await post(`${MP_BASE}/unlink`);
    return true;
  },

  // --- OAuth ---
  async startOAuth(force = true) {
    const data = await get(`${MP_BASE}/oauth/url`, { force: force ? "true" : "false" });
    return data?.url;
  },

  // --- Config (en tu backend NO existe /config; lo guardo local para que no rompa la UI) ---
  async getConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      return raw ? JSON.parse(raw) : { mode: "month", month: null, paymentId: "" };
    } catch {
      return { mode: "month", month: null, paymentId: "" };
    }
  },
  async updateConfig(cfg) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg ?? {}));
    return cfg;
  },

  // --- Preview / Import (estos endpoints EXISTEN en registro) ---
  async previewPaymentById(paymentId) {
    return post(`${MP_BASE}/preview`, { paymentId });
  },
  async previewPaymentsByMonth({ month, year }) {
    return post(`${MP_BASE}/preview`, { month, year });
  },

  async importPaymentById(paymentId) {
    return post(`${MP_BASE}/import`, { paymentId });
  },
  async importPaymentsByMonth({ month, year }) {
    return post(`${MP_BASE}/import`, { month, year });
  },
  async importSelectedPayments(paymentIds) {
    return post(`${MP_BASE}/import/selected`, Array.isArray(paymentIds) ? paymentIds : []);
  },

  // --- Listado de importados (endpoint EXISTE) ---
  async listImportedPayments(params) {
    return get(`${MP_BASE}/imported-payments`, params);
  },

  // --- Categoría (backend espera registroId) ---
  async updatePaymentCategory(registroId, categoria) {
    return put(`${MP_BASE}/payments/${registroId}/category`, { categoria });
  },

  // --- Facturar (backend espera {paymentIds:[...]} ) ---
  async billPayments(paymentIds) {
    return post(`${MP_BASE}/facturar`, { paymentIds: Array.isArray(paymentIds) ? paymentIds : [] });
  },
};
