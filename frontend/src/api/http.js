import axios from "axios";
import {
  CognitoUserPool,
  CognitoUser,
  CognitoRefreshToken,
} from "amazon-cognito-identity-js";
import { sessionService } from "../shared-services/sessionService";
import URL_CONFIG from "../config/api-config";

const http = axios.create();
const PRONOSTICO_BASE_URL = URL_CONFIG.PRONOSTICO;
const cognitoPoolConfig = {
  UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
  ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
};

let refreshPromise = null;
let hasForcedLogout = false;

const isPronosticoRequest = (url) =>
  Boolean(
    url &&
      PRONOSTICO_BASE_URL &&
      String(url).startsWith(String(PRONOSTICO_BASE_URL)),
  );

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
  if (hasForcedLogout) {
    return;
  }
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

http.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem("accessToken");
  if (isPronosticoRequest(config.url)) {
    config.headers = config.headers ?? {};
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    const usuarioSub = sessionStorage.getItem("sub");
    if (usuarioSub) {
      config.headers["X-Usuario-Sub"] = usuarioSub;
    }
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (
      !config ||
      !response ||
      response.status !== 401 ||
      !isPronosticoRequest(config.url)
    ) {
      return Promise.reject(error);
    }

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
      return http(config);
    } catch (refreshError) {
      clearSessionAndRedirect();
      return Promise.reject(refreshError);
    }
  },
);

export default http;
