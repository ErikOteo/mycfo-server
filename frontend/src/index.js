import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { AuthProvider } from "react-oidc-context";
import { brand } from './shared-theme/themePrimitives';

const cognitoAuthConfig = {
  authority: "https://cognito-idp.sa-east-1.amazonaws.com/sa-east-1_lTMNrWW7R",
  client_id: "3ksssqtg3r49rf6js1t1177hrd",
  redirect_uri: "https://d84l1y8p4kdic.cloudfront.net",
  response_type: "code",
  scope: "phone openid email",
};

const theme = createTheme({
  palette: {
    primary: {
      light: brand[300],
      main: brand[400],
      dark: brand[600],
      contrastText: '#ffffff',
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));

// wrap the application with AuthProvider
root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
