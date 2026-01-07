// SignUp.js
import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import { styled } from "@mui/material/styles";
import AppTheme from "../shared-theme/AppTheme";
import ColorModeIconDropdown from "../shared-theme/ColorModeIconDropdown";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GoogleIcon, FacebookIcon } from "./components/CustomIcons";
import API_CONFIG from "../config/api-config";
import axios from "axios";

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
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
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

export default function SignUp(props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Verificar si viene de una invitación
  const empresaInvitacion = searchParams.get('empresa');
  const esInvitacion = !!empresaInvitacion;

  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    nombre: "",
    apellido: "",
    nombreEmpresa: empresaInvitacion || "",
  });
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState("");
  // No hay validación de token, solo pre-llenar empresa

  const validateInputs = () => {
    let errs = {};
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = "Ingresa un correo electrónico válido.";
    }
    if (!formData.password || formData.password.length < 6) {
      errs.password = "La contraseña debe tener al menos 6 caracteres.";
    }
    if (!formData.nombre || formData.nombre.trim() === "") {
      errs.nombre = "El nombre es obligatorio.";
    }
    if (!formData.apellido || formData.apellido.trim() === "") {
      errs.apellido = "El apellido es obligatorio.";
    }
    if (!formData.nombreEmpresa || formData.nombreEmpresa.trim() === "") {
      errs.nombreEmpresa = "El nombre de la empresa es obligatorio.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    setSuccessMsg("");

    try {
      // Registrar usuario completo en backend
      const response = await axios.post(`${API_CONFIG.ADMINISTRACION}/api/auth/registro`, { 
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        apellido: formData.apellido,
        nombreEmpresa: formData.nombreEmpresa,
        esInvitacion: esInvitacion
      });

      console.log("Usuario registrado:", response.data);
      
      // Guardar email temporalmente para la confirmación
      sessionStorage.setItem("tempEmail", formData.email);
      
      setSuccessMsg(response.data.mensaje || "Cuenta creada correctamente.");
      setTimeout(() => navigate("/confirm-account"), 1500);
    } catch (err) {
      console.error("SignUp Error", err);
      setErrors({ global: err.response?.data?.error || "Error al crear la cuenta." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ColorModeIconDropdown sx={{ position: "fixed", top: "1rem", right: "1rem" }} />
      <SignUpContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
          >
            {esInvitacion ? "Unirse a la empresa" : "Crear cuenta"}
          </Typography>
          
          {esInvitacion && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Has sido invitado a unirte a <strong>{formData.nombreEmpresa}</strong>
            </Typography>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl sx={{ flex: 1 }}>
                <FormLabel>Nombre</FormLabel>
                <TextField
                  required
                  fullWidth
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  error={!!errors.nombre}
                  helperText={errors.nombre}
                />
              </FormControl>

              <FormControl sx={{ flex: 1 }}>
                <FormLabel>Apellido</FormLabel>
                <TextField
                  required
                  fullWidth
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  error={!!errors.apellido}
                  helperText={errors.apellido}
                />
              </FormControl>
            </Box>

            <FormControl>
              <FormLabel>Nombre de la empresa</FormLabel>
              <TextField
                required
                fullWidth
                value={formData.nombreEmpresa}
                onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })}
                error={!!errors.nombreEmpresa}
                helperText={errors.nombreEmpresa}
                disabled={esInvitacion}
                InputProps={{
                  readOnly: esInvitacion,
                }}
              />
              {esInvitacion && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  Empresa predefinida por invitación.
                </Typography>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Correo electrónico</FormLabel>
              <TextField
                required
                fullWidth
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!errors.email}
                helperText={errors.email}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Contraseña</FormLabel>
              <TextField
                required
                fullWidth
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={!!errors.password}
                helperText={errors.password}
              />
            </FormControl>

            {(errors.global || successMsg) && (
              <Box
                sx={{
                  mt: 1,
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: "#FFF8E1",
                  border: "1px solid #FFE082",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ textAlign: "center", color: "text.primary" }}
                >
                  {errors.global || successMsg}
                </Typography>
              </Box>
            )}

            <Button type="submit" fullWidth variant="contained" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/*
            <Button
              fullWidth
              variant="outlined"
              onClick={() =>
                alert("Registrar con Google (configurar Cognito Hosted UI)")
              }
              startIcon={<GoogleIcon />}
            >
              Registrarse con Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() =>
                alert("Registrar con Facebook (configurar Cognito Hosted UI)")
              }
              startIcon={<FacebookIcon />}
            >
              Registrarse con Facebook
            </Button>
            */}
            <Typography sx={{ textAlign: "center" }}>
              ¿Ya tienes una cuenta?{" "}
              <Link component={RouterLink} to="/signin" variant="body2" sx={{ alignSelf: "center" }}>
                Inicia sesión
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignUpContainer>
    </AppTheme>
  );
}
