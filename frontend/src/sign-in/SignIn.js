// SignIn.js
import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CssBaseline from "@mui/material/CssBaseline";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { styled } from "@mui/material/styles";
import ForgotPassword from "./components/ForgotPassword";
import AppTheme from "../shared-theme/AppTheme";
import ColorModeIconDropdown from "../shared-theme/ColorModeIconDropdown";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_CONFIG from "../config/api-config";
import Logo from "../shared-components/Logo";

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";

const mapCognitoErrorToMessage = (err) => {
  const code = err?.code || "";
  const message = err?.message || "";

  switch (code) {
    case "NotAuthorizedException":
      // Usuario o contraseña incorrectos
      return "Correo o contraseña incorrectos. Verificá tus datos e intentá nuevamente.";
    case "UserNotFoundException":
      return "No encontramos un usuario con ese correo. Verificá el correo o registrate.";
    case "UserNotConfirmedException":
      return "Tu cuenta todavía no está confirmada. Revisá tu correo para completar la confirmación.";
    case "PasswordResetRequiredException":
      return "Necesitás restablecer tu contraseña antes de poder iniciar sesión.";
    case "TooManyFailedAttemptsException":
    case "TooManyRequestsException":
      return "Demasiados intentos fallidos. Esperá unos minutos y volvé a intentar.";
    case "InvalidPasswordException":
      return "La contraseña no cumple con los requisitos de seguridad. Usá al menos 8 caracteres y combiná mayúsculas, minúsculas, números y un símbolo.";
    default:
      if (message && typeof message === "string") {
        // Para otros errores menos comunes, evitar mostrar texto crudo de Cognito
        return "No pudimos iniciar sesión. Intentá nuevamente en unos segundos.";
      }
      return "No pudimos iniciar sesión. Intentá nuevamente en unos segundos.";
  }
};

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  [theme.breakpoints.up("sm")]: {
    maxWidth: "450px",
  },
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
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

export default function SignIn(props) {
  const navigate = useNavigate();
  const [formValues, setFormValues] = React.useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [globalMsg, setGlobalMsg] = React.useState("");
  const [globalType, setGlobalType] = React.useState(null); // 'success' | 'error' | null
  const [open, setOpen] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: "", severity: "info" });

  const [showPassword, setShowPassword] = React.useState(false);

  const URL_ADMINISTRACION = API_CONFIG.ADMINISTRACION;

  const poolData = {
    UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
    ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
  };
  const userPool = new CognitoUserPool(poolData);

  const validateInputs = () => {
    let errs = {};
    if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      errs.email = "Ingresa un correo electrónico válido.";
    }
    if (!formValues.password || formValues.password.length < 6) {
      errs.password = "La contraseña debe tener al menos 6 caracteres.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    setGlobalMsg("");
    setGlobalType(null);

    const authenticationDetails = new AuthenticationDetails({
      Username: formValues.email,
      Password: formValues.password,
    });

    const cognitoUser = new CognitoUser({
      Username: formValues.email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: async (result) => {
        console.log("Login success", result);

        const accessToken = result.getAccessToken().getJwtToken();
        const idToken = result.getIdToken().getJwtToken();
        const refreshToken = result.getRefreshToken().getToken();
        const sub = result.getIdToken().payload.sub;

        // Guardar tokens
        sessionStorage.setItem("accessToken", accessToken);
        sessionStorage.setItem("idToken", idToken);
        sessionStorage.setItem("refreshToken", refreshToken);

        try {
          const perfilResponse = await axios.get(`${URL_ADMINISTRACION}/api/usuarios/perfil`, {
            headers: {
              "X-Usuario-Sub": sub
            }
          });


          // Guardar datos del usuario desde la BD
          const userData = perfilResponse.data;
          sessionStorage.setItem("sub", sub);
          sessionStorage.setItem("email", userData.email);
          sessionStorage.setItem("nombre", userData.nombre);
          sessionStorage.setItem("telefono", userData.telefono || "");

          // Guardar el rol bruto (fundamental para que usePermisos detecte ADMINISTRADOR)
          sessionStorage.setItem("rol", userData.rol || 'COLABORADOR');

          // --- Lógica de Permisos Granulares ---
          let permisos = null;
          if (userData.rol && userData.rol.includes('|PERM:')) {
            try {
              const parts = userData.rol.split('|PERM:');
              permisos = JSON.parse(parts[1]);
            } catch (e) {
              console.error("Error parseando permisos del rol:", e);
            }
          }

          // Si es un administrador de legado (sin JSON) o no tiene permisos definidos,
          // le damos acceso total si el rol empieza con ADMINISTRADOR
          if (!permisos && userData.rol && userData.rol.startsWith("ADMINISTRADOR")) {
            permisos = {
              carga: { view: true, edit: true },
              movs: { view: true, edit: true },
              banco: { view: true, edit: true },
              facts: { view: true, edit: true },
              concil: { view: true, edit: true },
              reps: { view: true, edit: true },
              pron: { view: true, edit: true },
              pres: { view: true, edit: true },
              admin: { view: true, edit: true },
            };
          }

          if (permisos) {
            sessionStorage.setItem("permisos", JSON.stringify(permisos));
          } else {
            sessionStorage.removeItem("permisos");
          }
          // ------------------------------------

          // Guardar datos de la empresa (sin IDs)
          if (userData.empresaId) {
            sessionStorage.setItem("empresaNombre", userData.empresaNombre || "");
            sessionStorage.setItem("empresaCuit", userData.empresaCuit || "");
            sessionStorage.setItem("empresaCondicionIVA", userData.empresaCondicionIVA || "");
            sessionStorage.setItem("empresaDomicilio", userData.empresaDomicilio || "");
          }

          window.dispatchEvent(new Event("userDataUpdated"));

          setGlobalType("success");
          setGlobalMsg("Inicio de sesión correcto.");
          setLoading(false);

          // Redirigir al home usando navigate
          navigate("/");
        } catch (err) {
          setLoading(false);
          console.error("Error loading user profile:", err);
          setGlobalMsg("Error al cargar el perfil. Por favor, contacta a soporte.");
        }
      },
      onFailure: (err) => {
        setLoading(false);
        console.error("Login error", err);
        const friendly = mapCognitoErrorToMessage(err);
        setGlobalType("error");
        setGlobalMsg(friendly);
      },
    });
  };

  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        <ColorModeIconDropdown sx={{ position: "fixed", top: "1rem", right: "1rem" }} />
        <Card variant="outlined">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1.25}
            sx={{ mb: 1 }}
          >
            <Logo size={80} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              MyCFO
            </Typography>
          </Stack>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="email">Correo electrónico</FormLabel>
              <TextField
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
                fullWidth
                value={formValues.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="password">Contraseña</FormLabel>
              <TextField
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="******"
                required
                fullWidth
                value={formValues.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
              />
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  color="primary"
                />
              }
              label="Ver contraseña"
            />

            {globalMsg && (
              <Box
                sx={{
                  mt: 1,
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: "#FFDE70",
                  border: "1px solid #F5C16C",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ textAlign: "center", color: "#000" }}
                >
                  {globalMsg}
                </Typography>
              </Box>
            )}

            <ForgotPassword open={open} handleClose={handleClose} />

            <Button type="submit" fullWidth variant="contained" disabled={loading}>
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </Button>

            <Link
              component="button"
              type="button"
              onClick={handleClickOpen}
              variant="body2"
              sx={{ alignSelf: "center" }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/*
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setSnackbar({ open: true, message: "Iniciar sesión con Google próximamente 🚀", severity: "info" })}
                // startIcon={<GoogleIcon />}
              >
                Iniciar sesión con Google
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setSnackbar({ open: true, message: "Iniciar sesión con Facebook próximamente 🚀", severity: "info" })}
                // startIcon={<FacebookIcon />}
              >
                Iniciar sesión con Facebook
              </Button>
            */}
            <Typography sx={{ textAlign: "center" }}>
              ¿No tienes una cuenta?{" "}
              <Link component={RouterLink} to="/signup" variant="body2" sx={{ alignSelf: "center" }}>
                Regístrate
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignInContainer>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AppTheme>
  );
}
