import axios from "axios";
import {
  CognitoUserPool,
  CognitoUser,
  CognitoRefreshToken,
} from "amazon-cognito-identity-js";
import { sessionService } from "../shared-services/sessionService";
import URL_CONFIG from "../config/api-config";

const http = axios.create();

const API_BASE_URLS = [
  URL_CONFIG.ADMINISTRACION,
  URL_CONFIG.REGISTRO,
  URL_CONFIG.REPORTE,
  URL_CONFIG.IA,
  URL_CONFIG.PRONOSTICO,
  URL_CONFIG.FORECAST,
].filter(Boolean);

const cognitoPoolConfig = {
  UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
  ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
};

let refreshPromise = null;
let hasForcedLogout = false;

const safeSessionGet = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch (err) {
    console.warn("No se pudo leer sessionStorage:", err);
    return null;
  }
};

const safeSessionSet = (key, value) => {
  try {
    if (value !== undefined && value !== null) {
      sessionStorage.setItem(key, value);
    }
  } catch (err) {
    console.warn("No se pudo escribir en sessionStorage:", err);
  }
};

const clearSessionAndRedirect = () => {
  if (hasForcedLogout) return;
  hasForcedLogout = true;

  try {
    sessionStorage.clear();
  } catch {
    /* noop */
  }

  if (sessionService?.limpiarSesion) {
    sessionService.limpiarSesion();
  }

  if (typeof window !== "undefined") {
    window.location.href = "/#/signin";
  }
};

const buildCognitoUser = () => {
  const username = safeSessionGet("email") || safeSessionGet("username");
  if (!username || !cognitoPoolConfig.UserPoolId || !cognitoPoolConfig.ClientId) {
    return null;
  }
  const pool = new CognitoUserPool(cognitoPoolConfig);
  return new CognitoUser({ Username: username, Pool: pool });
};

const refreshTokens = () => {
  const refreshTokenValue = safeSessionGet("refreshToken");
  const cognitoUser = buildCognitoUser();

  if (!refreshTokenValue || !cognitoUser) {
    return Promise.reject(new Error("No hay datos para renovar la sesión."));
  }

  const refreshToken = new CognitoRefreshToken({ RefreshToken: refreshTokenValue });

  return new Promise((resolve, reject) => {
    cognitoUser.refreshSession(refreshToken, (err, session) => {
      if (err) return reject(err);

      const nextAccessToken = session.getAccessToken().getJwtToken();
      const nextIdToken = session.getIdToken().getJwtToken();
      const nextRefreshToken = session.getRefreshToken().getToken();

      safeSessionSet("accessToken", nextAccessToken);
      safeSessionSet("idToken", nextIdToken);
      if (nextRefreshToken) safeSessionSet("refreshToken", nextRefreshToken);

      resolve(nextAccessToken);
    });
  });
};

const getRefreshPromise = () => {
  if (!refreshPromise) {
    refreshPromise = refreshTokens()
      .then((token) => {
        refreshPromise = null;
        return token;
      })
      .catch((error) => {
        refreshPromise = null;
        throw error;
      });
  }
  return refreshPromise;
};

// Detecta si la request va a tu backend (absoluta o relativa)
const isInternalApiRequest = (config) => {
  const url = config?.url ? String(config.url) : "";
  if (!url) return false;

  // Caso relativo típico del frontend
  if (url.startsWith("/api/")) return true;

  // Caso absoluto
  return API_BASE_URLS.some((base) => base && url.startsWith(String(base)));
};

// REQUEST: meter Authorization + X-Usuario-Sub a TODA request interna
http.interceptors.request.use((config) => {
  if (!config) return config;
  if (!isInternalApiRequest(config)) return config;

  const accessToken = safeSessionGet("accessToken");
  const usuarioSub = safeSessionGet("sub");

  config.headers = config.headers ?? {};

  // No pisar si ya viene seteado
  if (accessToken && !config.headers.Authorization && !config.headers.authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (usuarioSub && !config.headers["X-Usuario-Sub"]) {
    config.headers["X-Usuario-Sub"] = usuarioSub;
  }

  return config;
});

// RESPONSE: si 401 en API interna, refrescar y reintentar 1 vez
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error || {};
    if (!config || !response) return Promise.reject(error);

    const is401 = response.status === 401;
    if (!is401 || !isInternalApiRequest(config)) return Promise.reject(error);

    if (config.__isRetryRequest) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    try {
      const newAccessToken = await getRefreshPromise();
      if (!newAccessToken) throw new Error("No se obtuvo un token renovado.");

      config.__isRetryRequest = true;
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${newAccessToken}`;

      const usuarioSub = safeSessionGet("sub");
      if (usuarioSub) config.headers["X-Usuario-Sub"] = usuarioSub;

      return http(config);
    } catch (refreshError) {
      clearSessionAndRedirect();
      return Promise.reject(refreshError);
    }
  }
);

export default http;
