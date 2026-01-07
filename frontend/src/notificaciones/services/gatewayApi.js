// API centralizada que siempre usa el gateway - IGNORA VARIABLES DE ENTORNO
import axios from "axios";
import API_CONFIG from "../../config/api-config";


// Forzar uso del gateway - ignorar cualquier variable de entorno
const GATEWAY_URL = API_CONFIG.NOTIFICACION

const api = axios.create({
  baseURL: GATEWAY_URL.endsWith("/api") ? GATEWAY_URL : `${GATEWAY_URL}/api`
});

api.interceptors.request.use((config) => {
  const updatedConfig = { ...config };
  updatedConfig.headers = updatedConfig.headers ?? {};

  const accessToken = sessionStorage.getItem("accessToken");
  if (accessToken) {
    updatedConfig.headers.Authorization = `Bearer ${accessToken}`;
  }

  const usuarioSub = sessionStorage.getItem("sub");
  if (usuarioSub) {
    updatedConfig.headers["X-Usuario-Sub"] = usuarioSub;
  }

  return updatedConfig;
});

export default api;
