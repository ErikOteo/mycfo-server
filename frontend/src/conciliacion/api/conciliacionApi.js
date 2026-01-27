import http from "../../api/http";
import API_CONFIG from "../../config/api-config";

const API_BASE_URL = `${API_CONFIG.REGISTRO}/api/conciliacion`;

/**
 * API client para el módulo de conciliación
 */
export const conciliacionApi = {
  /**
   * Obtiene movimientos sin conciliar con paginación
   */
  obtenerMovimientosSinConciliar: async (
    page = 0,
    size = 10,
    sortBy = "fechaEmision",
    sortDir = "desc",
    moneda
  ) => {
    const response = await http.get(`${API_BASE_URL}/api/movimientos/sin-conciliar`, {
      params: { page, size, sortBy, sortDir, moneda },
    });
    return response.data;
  },

  /**
   * Obtiene todos los movimientos (conciliados y sin conciliar) con paginación
   */
  obtenerTodosLosMovimientos: async (
    page = 0,
    size = 10,
    sortBy = "fechaEmision",
    sortDir = "desc",
    moneda
  ) => {
    const response = await http.get(`${API_BASE_URL}/api/movimientos`, {
      params: { page, size, sortBy, sortDir, moneda },
    });
    return response.data;
  },

  /**
   * Obtiene sugerencias de documentos para un movimiento
   */
  obtenerSugerencias: async (movimientoId, moneda) => {
    const response = await http.get(`${API_BASE_URL}/api/movimientos/${movimientoId}/sugerencias`, {
      params: { moneda },
    });
    return response.data;
  },

  /**
   * Vincula un movimiento con un documento
   */
  vincularMovimiento: async (movimientoId, documentoId) => {
    const response = await http.post(`${API_BASE_URL}/api/vincular`, {
      movimientoId,
      documentoId,
    });
    return response.data;
  },

  /**
   * Desvincula un movimiento de su documento
   */
  desvincularMovimiento: async (movimientoId) => {
    const response = await http.post(`${API_BASE_URL}/api/desvincular/${movimientoId}`);
    return response.data;
  },

  /**
   * Obtiene estadísticas de conciliación
   */
  obtenerEstadisticas: async (moneda) => {
    const response = await http.get(`${API_BASE_URL}/api/estadisticas`, {
      params: { moneda },
    });
    return response.data;
  },
};

export default conciliacionApi;
