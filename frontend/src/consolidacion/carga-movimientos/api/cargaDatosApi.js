import axios from 'axios';
import { API_CONFIG } from '../../config/apiConfig';

const API_BASE_URL = API_CONFIG.REGISTRO;

/**
 * API unificada para la carga de datos
 * Maneja facturas, recibos, pagarés y movimientos
 * Soporta múltiples métodos: formulario, excel, voz, audio
 */

// Obtener headers comunes
const getHeaders = () => {
  const usuarioSub = localStorage.getItem('usuario_sub');
  const organizacionId = localStorage.getItem('organizacion_id');
  
  return {
    'X-Usuario-Sub': usuarioSub,
    'X-Organizacion-Id': organizacionId,
  };
};

/**
 * Cargar datos mediante formulario, voz o transcripción
 * @param {string} tipo - "factura", "recibo", "pagare", "movimiento"
 * @param {string} metodo - "formulario", "voz", "audio"
 * @param {object} datos - Datos del documento/movimiento
 * @param {string} tipoMovimiento - Opcional: "Ingreso", "Egreso", "Deuda", "Acreencia"
 */
export const cargarDatos = async (tipo, metodo, datos, tipoMovimiento = null) => {
  try {
    const payload = {
      tipo,
      metodo,
      datos,
      ...(tipoMovimiento && { tipoMovimiento })
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/carga-datos`,
      payload,
      { headers: getHeaders() }
    );

    return response.data;
  } catch (error) {
    console.error('Error al cargar datos:', error);
    throw error;
  }
};

/**
 * Obtener preview de archivo Excel
 * @param {File} file - Archivo Excel
 * @param {string} tipo - "factura" o "movimiento"
 * @param {string} tipoOrigen - "mycfo", "mercado-pago", "santander"
 */
export const previewExcel = async (file, tipo = 'movimiento', tipoOrigen = 'mycfo') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);
    formData.append('tipoOrigen', tipoOrigen);

    const response = await axios.post(
      `${API_BASE_URL}/api/carga-datos/excel/preview`,
      formData,
      {
        headers: {
          ...getHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error al obtener preview de Excel:', error);
    throw error;
  }
};

/**
 * Importar archivo Excel directamente
 * @param {File} file - Archivo Excel
 * @param {string} tipo - "factura" o "movimiento"
 * @param {string} tipoOrigen - "mycfo", "mercado-pago", "santander"
 */
export const importarExcel = async (file, tipo = 'movimiento', tipoOrigen = 'mycfo') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);
    formData.append('tipoOrigen', tipoOrigen);

    const response = await axios.post(
      `${API_BASE_URL}/api/carga-datos/excel`,
      formData,
      {
        headers: {
          ...getHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error al importar Excel:', error);
    throw error;
  }
};

/**
 * Procesar datos de voz (transcripción ya procesada)
 * @param {string} tipo - "factura", "recibo", "pagare", "movimiento"
 * @param {object} datos - Datos extraídos de la transcripción
 * @param {string} tipoMovimiento - Opcional: "Ingreso", "Egreso", "Deuda", "Acreencia"
 */
export const procesarVoz = async (tipo, datos, tipoMovimiento = null) => {
  try {
    const payload = {
      tipo,
      metodo: 'voz',
      datos,
      ...(tipoMovimiento && { tipoMovimiento })
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/carga-datos/voz`,
      payload,
      { headers: getHeaders() }
    );

    return response.data;
  } catch (error) {
    console.error('Error al procesar voz:', error);
    throw error;
  }
};

/**
 * Procesar archivo de audio
 * @param {File} audioFile - Archivo de audio
 * @param {string} tipo - "factura", "recibo", "pagare", "movimiento"
 */
export const procesarAudio = async (audioFile, tipo) => {
  try {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('tipo', tipo);

    const response = await axios.post(
      `${API_BASE_URL}/api/carga-datos/audio`,
      formData,
      {
        headers: {
          ...getHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error al procesar audio:', error);
    throw error;
  }
};

export default {
  cargarDatos,
  previewExcel,
  importarExcel,
  procesarVoz,
  procesarAudio,
};

