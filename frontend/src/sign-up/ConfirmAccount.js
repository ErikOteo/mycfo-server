// ConfirmAccount.js
import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CssBaseline,
  FormLabel,
  FormControl,
  TextField,
  Typography,
  Divider,
  Link,
  Stack,
  Alert,
} from "@mui/material";
import MuiCard from "@mui/material/Card";
import { styled } from "@mui/material/styles";

import AppTheme from "../shared-theme/AppTheme";
import ColorModeIconDropdown from "../shared-theme/ColorModeIconDropdown";
import axios from "axios";
import API_CONFIG from "../config/api-config";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  [theme.breakpoints.up("sm")]: {
    width: "450px",
  },
}));

const ConfirmContainer = styled(Stack)(({ theme }) => ({
  height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundColor: "#ffffff",
    backgroundImage:
      "radial-gradient(circle at 50% 50%, rgba(0, 132, 118, 0.9) 0%, rgba(0, 132, 118, 0.6) 20%, rgba(0, 132, 118, 0.3) 100%, rgba(0, 132, 118, 0) 500%)",
    backgroundRepeat: "no-repeat",
    ...theme.applyStyles("dark", {
      backgroundImage:
        "radial-gradient(at 50% 50%, #008476, hsl(220, 30%, 5%))",
    }),
  },
}));

export default function ConfirmAccount(props) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  // Obtener email temporal
  const email = sessionStorage.getItem("tempEmail") || "";

  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
  }, [email, navigate]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      // Confirmar código con el backend
      await axios.post(`${API_CONFIG.ADMINISTRACION}/api/auth/confirmar`, {
        email: email,
        codigo: code,
      });

      setSuccessMsg("¡Cuenta confirmada exitosamente!");
      
      // Limpiar datos temporales
      sessionStorage.removeItem("tempEmail");

      // Redirigir al login
      setTimeout(() => {
        navigate("/signin");
      }, 1500);
    } catch (err) {
      console.error("Error confirming code:", err);
      setError(err.response?.data?.error || "Código incorrecto o expirado");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await axios.post(`${API_CONFIG.ADMINISTRACION}/api/auth/reenviar-codigo`, {
        email: email,
      });

      setSuccessMsg("Código reenviado exitosamente. Revisa tu email.");
    } catch (err) {
      console.error("Error resending code:", err);
      setError(err.response?.data?.error || "Error al reenviar el código");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ColorModeIconDropdown sx={{ position: "fixed", top: "1rem", right: "1rem" }} />
      <ConfirmContainer direction="column" justifyContent="center">
        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
          >
            Confirma tu cuenta
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Hemos enviado un código de verificación a <strong>{email}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ingresa el código para completar tu registro.
          </Typography>

          <Box
            component="form"
            onSubmit={handleConfirm}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <FormControl>
              <FormLabel>Código de Verificación</FormLabel>
              <TextField
                required
                fullWidth
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                inputProps={{ maxLength: 6 }}
              />
            </FormControl>

            {error && <Alert severity="error">{error}</Alert>}
            {successMsg && <Alert severity="success">{successMsg}</Alert>}

            <Button type="submit" fullWidth variant="contained" disabled={loading}>
              {loading ? "Confirmando..." : "Confirmar cuenta"}
            </Button>

            <Button 
              fullWidth 
              variant="outlined" 
              onClick={handleResendCode}
              disabled={resendLoading || loading}
            >
              {resendLoading ? "Reenviando..." : "Reenviar código"}
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography sx={{ textAlign: "center" }}>
            ¿Ya tienes cuenta?{" "}
            <Link href="/#/signin" variant="body2">
              Iniciar sesión
            </Link>
          </Typography>
        </Card>
      </ConfirmContainer>
    </AppTheme>
  );
}
