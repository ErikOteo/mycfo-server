import axios from "axios";
import {
  CognitoUserPool,
  CognitoUser,
  CognitoRefreshToken,
} from "amazon-cognito-identity-js";
import { sessionService } from "../shared-services/sessionService";
import URL_CONFIG from "../config/api-config";

const http = axios.create();

const cognitoPoolConfig = {
  UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
  ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
};

let refreshPromise = null;
let hasForcedLogout = false;

/**
 * Devuelve true si la request apunta a cualquiera de los backends conocidos
 * o si es una URL relativa del estilo "/api/...".
 * Esto evita que solo Pronostico reciba Authorization y Registro quede sin token (401).
 */
const isBackendRequest = (url) => {
  if (!url) return false;

  const u = String(url);

  // URLs relativas (muy comunes si armás paths tipo "/api/registro/...")
  if (u.startsWith("/api/")) return true;

  // URLs absolutas a cualquiera de los servicios configurados
  const bases = Object.values(URL_CONFIG || {})
    .filter(Boolean)
    .map((v) => String(v));

  return bases.some((base) => u.startsWith(base));
};

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

  if (
    !username ||
    !cognitoPoolConfig.UserPoolId ||
    !cognitoPoolConfig.ClientId
  ) {
    return null;
  }

  const pool = new CognitoUserPool(cognitoPoolConfig);

  return new CognitoUser({
    Username: username,
    Pool: pool,
  });
};

const refreshTokens = () => {
  const refreshTokenValue = safeSessionGet("refreshToken");
  const cognitoUser = buildCognitoUser();

  if (!refreshTokenValue || !cognitoUser) {
    return Promise.reject(new Error("No hay datos para renovar la sesión."));
  }

  const refreshToken = new CognitoRefreshToken({
    RefreshToken: refreshTokenValue,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.refreshSession(refreshToken, (err, session) => {
      if (err) {
        reject(err);
        return;
      }

      const nextAccessToken = session.getAccessToken().getJwtToken();
      const nextIdToken = session.getIdToken().getJwtToken();
      const nextRefreshToken = session.getRefreshToken().getToken();

      safeSessionSet("accessToken", nextAccessToken);
      safeSessionSet("idToken", nextIdToken);

      if (nextRefreshToken) {
        safeSessionSet("refreshToken", nextRefreshToken);
      }

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

// REQUEST: agrega Authorization + X-Usuario-Sub para cualquier backend del sistema
http.interceptors.request.use((config) => {
  if (!isBackendRequest(config.url)) return config;

  const accessToken = safeSessionGet("accessToken") || sessionStorage.getItem("accessToken");
  const usuarioSub = safeSessionGet("sub") || sessionStorage.getItem("sub");

  config.headers = config.headers ?? {};

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (usuarioSub) {
    config.headers["X-Usuario-Sub"] = usuarioSub;
  }

  return config;
});

// RESPONSE: si hay 401 en backend → intenta refresh una vez y reintenta
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // Si no es 401 o no es llamada a backend, lo dejamos pasar tal cual
    if (!config || !response || response.status !== 401 || !isBackendRequest(config.url)) {
      return Promise.reject(error);
    }

    // Evitar loops infinitos
    if (config.__isRetryRequest) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    try {
      const newAccessToken = await getRefreshPromise();
      if (!newAccessToken) {
        throw new Error("No se obtuvo un token renovado.");
      }

      config.__isRetryRequest = true;
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${newAccessToken}`;

      // Reintenta la request original ya con token renovado
      return http(config);
    } catch (refreshError) {
      clearSessionAndRedirect();
      return Promise.reject(refreshError);
    }
  },
);

export default http;
