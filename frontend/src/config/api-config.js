// Configuración de URLs de los microservicios para AZURE
const BASE_URL = 'http://4.206.176.204'; 

const API_CONFIG = {
  // URLs apuntando al Proxy Nginx (Puerto 80)
  ADMINISTRACION: `${BASE_URL}/api/administracion`,
  CONSOLIDACION:  `${BASE_URL}/api/consolidacion`,
  IA:             `${BASE_URL}/api/ia`,
  NOTIFICACION:   `${BASE_URL}/api/notificacion`,
  PRONOSTICO:     `${BASE_URL}/api/pronostico`,
  REGISTRO:       `${BASE_URL}/api/registro`,
  REPORTE:        `${BASE_URL}/api/reporte`,
  
  // El servicio de Python (Forecast)
  FORECAST:       `${BASE_URL}/api/forecast`,
  
  // WebSocket (Nginx maneja la conexión WS también)
  WEBSOCKET:      `${BASE_URL.replace(/^http/, 'ws')}/api/notificacion/ws`,
  
  // URL base
  BASE: BASE_URL
};

export default API_CONFIG;
