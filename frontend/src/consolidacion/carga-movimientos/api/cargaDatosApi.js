import http from "../../api/http";
import API_CONFIG from "../../config/api-config";

const API_BASE_URL = API_CONFIG.REGISTRO;

/**
 * API unificada para la carga de datos
 * Maneja facturas, recibos, pagarés y movimientos
 * Soporta múltiples métodos: formulario, excel, voz, audio
 */

// Obtener headers comunes (sin pisar lo que mete el interceptor)
const getHeaders = () => {
  const headers = {};

  // SUB: priorizar sessionStorage (como el resto del front)
  try {
    const usuarioSub =
      sessionStorage.getItem("sub") ||
      localStorage.getItem("usuario_sub") ||
      localStorage.getItem("sub");

    if (usuarioSub) headers["X-Usuario-Sub"] = usuarioSub;
  } catch {
    /* noop */
  }

  // Organización (si existe)
  try {
    const organizacionId =
      localStorage.getItem("organizacion_id") ||
      sessionStorage.getItem("organizacionId");

    if (organizacionId) headers["X-Organizacion-Id"] = organizacionId;
  } catch {
    /* noop */
  }

  return headers;
};

/**
 * Cargar datos mediante formulario, voz o transcripción
 * @param {string} tipo - "factura", "recibo", "pagare", "movimiento"
 * @param {string} metodo - "formulario", "voz", "audio"
 * @param {object} datos - Datos del documento/movimiento
 * @param {string} tipoMovimiento - Opcional: "Ingreso", "Egreso", "Deuda", "Acreencia"
 */
export const cargarDatos = async (tipo, metodo, datos, tipoMovimiento = null) => {
  const payload = {
    tipo,
    metodo,
    datos,
    ...(tipoMovimiento && { tipoMovimiento }),
  };

  // ✅ IMPORTANTE: sin "/api" extra
  const response = await http.post(`${API_BASE_URL}/api/carga-datos`, payload, {
    headers: getHeaders(),
  });

  return response.data;
};

/**
 * Obtener preview de archivo Excel
 * @param {File} file - Archivo Excel
 * @param {string} tipo - "factura" o "movimiento"
 * @param {string} tipoOrigen - "mycfo", "mercado-pago", "santander", "galicia", "uala", "nacion"
 */
export const previewExcel = async (file, tipo = "movimiento", tipoOrigen = "mycfo") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tipo", tipo);
  formData.append("tipoOrigen", tipoOrigen);

  // ✅ IMPORTANTE: sin "/api" extra
  const response = await http.post(`${API_BASE_URL}/api/carga-datos/excel/preview`, formData, {
    headers: {
      ...getHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

/**
 * Importar archivo Excel directamente
 * @param {File} file - Archivo Excel
 * @param {string} tipo - "factura" o "movimiento"
 * @param {string} tipoOrigen - "mycfo", "mercado-pago", "santander", "galicia", "uala", "nacion"
 */
export const importarExcel = async (file, tipo = "movimiento", tipoOrigen = "mycfo") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tipo", tipo);
  formData.append("tipoOrigen", tipoOrigen);

  // ✅ IMPORTANTE: sin "/api" extra
  const response = await http.post(`${API_BASE_URL}/api/carga-datos/excel`, formData, {
    headers: {
      ...getHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

/**
 * Procesar datos de voz (transcripción ya procesada)
 * @param {string} tipo - "factura", "recibo", "pagare", "movimiento"
 * @param {object} datos - Datos extraídos de la transcripción
 * @param {string} tipoMovimiento - Opcional: "Ingreso", "Egreso", "Deuda", "Acreencia"
 */
export const procesarVoz = async (tipo, datos, tipoMovimiento = null) => {
  const payload = {
    tipo,
    metodo: "voz",
    datos,
    ...(tipoMovimiento && { tipoMovimiento }),
  };

  // ✅ IMPORTANTE: sin "/api" extra
  const response = await http.post(`${API_BASE_URL}/api/carga-datos/voz`, payload, {
    headers: getHeaders(),
  });

  return response.data;
};

/**
 * Procesar archivo de audio
 * @param {File} audioFile - Archivo de audio
 * @param {string} tipo - "factura", "recibo", "pagare", "movimiento"
 */
export const procesarAudio = async (audioFile, tipo) => {
  const formData = new FormData();
  formData.append("file", audioFile);
  formData.append("tipo", tipo);

  // ✅ IMPORTANTE: sin "/api" extra
  const response = await http.post(`${API_BASE_URL}/api/carga-datos/audio`, formData, {
    headers: {
      ...getHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export default {
  cargarDatos,
  previewExcel,
  importarExcel,
  procesarVoz,
  procesarAudio,
};
