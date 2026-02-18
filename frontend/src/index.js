import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { AuthProvider } from "react-oidc-context";
import AppTheme from './shared-theme/AppTheme';

// --- DEBUG: Verificamos las variables ---
console.log("📢 [index.js] BASE URL:", process.env.REACT_APP_BASE_URL);
console.log("📢 [index.js] API URL:", process.env.REACT_APP_API_URL);
console.log("📢 [index.js] Entorno:", process.env.NODE_ENV);
console.log("📢 [index.js] Origen actual:", window.location.origin);
// ----------------------------------------

const cognitoAuthConfig = {
  authority: "https://cognito-idp.sa-east-1.amazonaws.com/sa-east-1_lTMNrWW7R",
  client_id: "3ksssqtg3r49rf6js1t1177hrd",
  // MAGIA: Usamos window.location.origin para que si estás en localhost vuelva a localhost,
  // y si estás en la web vuelva a la web.
  redirect_uri: window.location.origin,
  response_type: "code",
  scope: "phone openid email",
};

const root = ReactDOM.createRoot(document.getElementById("root"));

// wrap the application with AuthProvider
root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <AppTheme>
        <App />
      </AppTheme>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
