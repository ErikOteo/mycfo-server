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
    sortDir = "desc"
  ) => {
    const response = await http.get(`${API_BASE_URL}/movimientos/sin-conciliar`, {
      params: { page, size, sortBy, sortDir },
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
    sortDir = "desc"
  ) => {
    const response = await http.get(`${API_BASE_URL}/movimientos`, {
      params: { page, size, sortBy, sortDir },
    });
    return response.data;
  },

  /**
   * Obtiene sugerencias de documentos para un movimiento
   */
  obtenerSugerencias: async (movimientoId) => {
    const response = await http.get(
      `${API_BASE_URL}/movimientos/${movimientoId}/sugerencias`
    );
    return response.data;
  },

  /**
   * Vincula un movimiento con un documento
   */
  vincularMovimiento: async (movimientoId, documentoId) => {
    const response = await http.post(`${API_BASE_URL}/vincular`, {
      movimientoId,
      documentoId,
    });
    return response.data;
  },

  /**
   * Desvincula un movimiento de su documento
   */
  desvincularMovimiento: async (movimientoId) => {
    const response = await http.post(`${API_BASE_URL}/desvincular/${movimientoId}`);
    return response.data;
  },

  /**
   * Obtiene estadísticas de conciliación
   */
  obtenerEstadisticas: async () => {
    const response = await http.get(`${API_BASE_URL}/estadisticas`);
    return response.data;
  },
};

export default conciliacionApi;
