import http from "../api/http";
import API_CONFIG from "../config/api-config";
import {
  CATEGORIAS_EGRESO,
  CATEGORIAS_INGRESO,
  TODAS_LAS_CATEGORIAS,
} from "../shared-components/categorias";

const normalizeKey = (v) => (v || "").toString().trim().toLowerCase();

const basePorTipo = (tipo) => {
  if (!tipo) return [...TODAS_LAS_CATEGORIAS];
  const t = tipo.toString().toLowerCase();
  if (t === "ingreso") return [...CATEGORIAS_INGRESO];
  if (t === "egreso") return [...CATEGORIAS_EGRESO];
  return [...TODAS_LAS_CATEGORIAS];
};

const dedupPreservandoPrimero = (valores) => {
  const vistos = new Set();
  const res = [];
  valores.forEach((v) => {
    const key = normalizeKey(v);
    if (!key || vistos.has(key)) return;
    vistos.add(key);
    res.push(v.toString().trim());
  });
  return res;
};

const buildHeaders = () => {
  const headers = {};
  try {
    const usuarioSub = sessionStorage.getItem("sub");
    if (usuarioSub) headers["X-Usuario-Sub"] = usuarioSub;
  } catch {
    /* noop */
  }
  return headers;
};

export async function fetchCategorias({ tipo } = {}) {
  const base = basePorTipo(tipo);

  try {
    // ✅ sin "/api" extra
    const resp = await http.get(`${API_CONFIG.REGISTRO}/api/categorias`, {
      params: tipo ? { tipo } : undefined,
      headers: buildHeaders(),
    });

    const extras = Array.isArray(resp.data)
      ? resp.data
          .map((c) => {
            if (typeof c === "string") return c;
            if (c && typeof c === "object" && c.nombre) return c.nombre;
            return null;
          })
          .filter(Boolean)
      : [];

    return dedupPreservandoPrimero([...base, ...extras]);
  } catch (err) {
    console.warn("No se pudieron obtener categorías dinámicas, uso base fija", err?.message || err);
    return dedupPreservandoPrimero(base);
  }
}

export async function crearCategoria({ nombre, tipo }) {
  if (!nombre || !nombre.trim()) {
    throw new Error("El nombre de la categoría es obligatorio");
  }

  const payload = { nombre: nombre.trim(), tipo: tipo || null };

  // ✅ sin "/api" extra
  const resp = await http.post(`${API_CONFIG.REGISTRO}/api/categorias`, payload, {
    headers: buildHeaders(),
  });

  return resp.data?.nombre || payload.nombre;
}
