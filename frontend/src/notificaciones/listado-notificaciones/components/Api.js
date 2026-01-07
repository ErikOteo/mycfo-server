// src/config/api.js
import axios from "axios";
import API_CONFIG from "../../../config/api-config";

// Usar gateway en lugar de URL directa del servicio de notificaciones
const BASE_URL = API_CONFIG.NOTIFICACION; // Ya apunta al gateway: BASE_URL/notificacion

const api = axios.create({
  baseURL: BASE_URL.endsWith("/api") ? BASE_URL : `${BASE_URL}/api`
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
