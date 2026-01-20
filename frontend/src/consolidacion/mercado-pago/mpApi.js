import API_CONFIG from "../../config/api-config";

const BASE_URL = API_CONFIG.BASE; // https://mycfo.com.ar
const USER_HEADER = "X-Usuario-Sub";

async function request(path, { method = "GET", body, headers } = {}) {
  const url = `${BASE_URL}${path}`;
  const opts = { method, headers: { ...(headers || {}) } };

  const usuarioSub = sessionStorage.getItem("sub");
  if (usuarioSub) opts.headers[USER_HEADER] = usuarioSub;

  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

export const mpApi = {
  status: () => request("/api/mp/status"),
  unlink: () => request("/api/mp/unlink", { method: "POST" }),
  preview: (payload) => request("/api/mp/preview", { method: "POST", body: payload }),
};
