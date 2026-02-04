import * as React from "react";

import { alpha, useTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import SideMenu, { collapsedWidth as sideMenuCollapsedWidth } from "./components/SideMenu";
import SideMenuMobile from "./components/SideMenuMobile";
import AppTheme from "../shared-theme/AppTheme";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./components/Header";
import useMediaQuery from "@mui/material/useMediaQuery";
import ChatbotIaWidget from "../shared-components/ChatbotIAWidget"; // Corregido: ChatbotIAWidget con IA en mayúsculas
import { ChatbotContextProvider } from "../shared-components/ChatbotContext";
import axios from "axios";
import API_CONFIG from "../config/api-config";

const Home = React.memo(function Home(props) {
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [desktopMenuExpanded, setDesktopMenuExpanded] = React.useState(false);

  // Determinar el módulo actual basado en la ruta
  const currentModule = React.useMemo(() => {
    const segment = location.pathname.split("/")[1] || "dashboard";

    const registroSegments = new Set([
      "carga",
      "ver-movimientos",
      "ver-facturas",
      "conciliacion",
      "carga-movimientos",
      "mercado-pago",
    ]);

    const reporteSegments = new Set([
      "dashboard",
      "reporte-mensual",
      "flujo-de-caja",
      "estado-de-resultado",
    ]);

    const pronosticoSegments = new Set([
      "presupuestos",
      "pronostico-continuo",
      "pronostico-fijo",
    ]);

    const administracionSegments = new Set([
      "perfil",
      "organizacion",
      "historial-cambios",
      "roles",
      "invitaciones",
    ]);

    const notificacionSegments = new Set([
      "listado-notificaciones",
      "recordatorios",
      "configuracion-notificaciones",
      "configuracion-email",
    ]);

    if (registroSegments.has(segment)) return "registro";
    if (reporteSegments.has(segment)) return "reporte";
    if (pronosticoSegments.has(segment)) return "pronostico";
    if (administracionSegments.has(segment)) return "administracion";
    if (notificacionSegments.has(segment)) return "notificacion";

    return "general";
  }, [location.pathname]);

  React.useEffect(() => {
    setMobileMenuOpen(false);
    setDesktopMenuExpanded(false);
  }, [location.pathname]);

  // Sincronizar permisos del servidor al cargar (F5) para reflejar cambios del admin inmediatamente
  React.useEffect(() => {
    const syncPermissions = async () => {
      const sub = sessionStorage.getItem("sub");
      const accessToken = sessionStorage.getItem("accessToken");
      if (!sub || !accessToken) return;

      try {
        const URL_ADMINISTRACION = API_CONFIG.ADMINISTRACION;
        const response = await axios.get(`${URL_ADMINISTRACION}/api/usuarios/perfil`, {
          headers: { "X-Usuario-Sub": sub }
        });

        const userData = response.data;
        if (userData && userData.rol) {
          // Actualizar Rol, Propietario e ID de Organización
          sessionStorage.setItem("rol", userData.rol);
          sessionStorage.setItem("esPropietario", userData.esPropietario ? "true" : "false");

          if (userData.empresaId) {
            sessionStorage.setItem("organizacionId", userData.empresaId);
          } else {
            sessionStorage.removeItem("organizacionId");
          }

          if (userData.nombre) sessionStorage.setItem("nombre", userData.nombre);
          let permisos = null;
          let color = null;

          if (userData.rol.includes("|PERM:")) {
            try {
              const parts = userData.rol.split("|PERM:");
              // El JSON de permisos puede estar seguido por |COLOR:
              const permsAndColor = parts[1].split("|COLOR:");
              permisos = JSON.parse(permsAndColor[0]);
              if (permsAndColor[1]) color = permsAndColor[1];
            } catch (e) {
              console.error("Error parseando permisos sincronizados:", e);
            }
          }

          // Fallback para administradores sin JSON
          if (!permisos && userData.rol.startsWith("ADMINISTRADOR")) {
            permisos = {
              carga: { view: true, edit: true },
              movs: { view: true, edit: true },
              banco: { view: true, edit: true },
              facts: { view: true, edit: true },
              concil: { view: true, edit: true },
              reps: { view: true, edit: true },
              pron: { view: true, edit: true },
              pres: { view: true, edit: true },
              admin: { view: true, edit: true }
            };
          }

          if (permisos) {
            sessionStorage.setItem("permisos", JSON.stringify(permisos));
          } else {
            sessionStorage.removeItem("permisos");
          }

          if (color) {
            sessionStorage.setItem("avatarColor", color);
            window.dispatchEvent(new Event("avatarUpdated"));
          }

          // Avisar al resto de la app
          window.dispatchEvent(new Event("userDataUpdated"));
        }
      } catch (err) {
        console.error("No se pudo sincronizar el perfil al cargar:", err);
      }
    };

    syncPermissions();
  }, []);

  React.useEffect(() => {
    if (!isDesktop) {
      setDesktopMenuExpanded(false);
    }
  }, [isDesktop]);

  const handleToggleMobileMenu = React.useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const handleCloseMobileMenu = React.useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleToggleDesktopMenu = React.useCallback(() => {
    setDesktopMenuExpanded((prev) => !prev);
  }, []);

  const handleExpandDesktopMenu = React.useCallback(() => {
    setDesktopMenuExpanded(true);
  }, []);

  const handleCollapseDesktopMenu = React.useCallback(() => {
    setDesktopMenuExpanded(false);
  }, []);

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: "flex" }}>
        {/* Menú lateral desktop fijo y colapsable */}
        {isDesktop && (
          <SideMenu
            expanded={desktopMenuExpanded}
            onToggleExpand={handleToggleDesktopMenu}
            onNavigate={handleCollapseDesktopMenu}
          />
        )}

        {/* Menú móvil que baja desde arriba (controlado por el Header en pantallas chicas) */}
        <SideMenuMobile
          open={mobileMenuOpen}
          toggleDrawer={(newOpen) => () => setMobileMenuOpen(newOpen)}
        />

        <Box
          component="main"
          onClick={desktopMenuExpanded ? handleCollapseDesktopMenu : undefined}
          sx={(theme) => ({
            position: "relative",
            zIndex: 0,
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: "auto",
            ml: { xs: 0, lg: `${sideMenuCollapsedWidth}px` },
            "&::before": {
              content: '""',
              position: "fixed",
              top: 0,
              left: { xs: 0, lg: sideMenuCollapsedWidth },
              right: 0,
              height: 460,
              background:
                "linear-gradient(180deg, rgba(0, 131, 117, 0.95) 0%, rgba(0, 131, 117, 0.6) 45%, rgba(0, 131, 117, 0) 100%)",
              pointerEvents: "none",
              zIndex: 0,
            },
          })}
        >
          <ChatbotContextProvider>
            <Stack
              spacing={2}
              sx={{
                position: "relative",
                zIndex: 1,
                mx: 3,
                pb: 5,
                minHeight: "100vh",
                alignItems: "center",
              }}
            >
              <Header onToggleSidebar={handleToggleMobileMenu} />
              <Box
                sx={{
                  flexGrow: 1,
                  width: "100%",
                  maxWidth: { sm: "100%", md: "1700px" },
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                }}
              >
                <Outlet />
              </Box>
            </Stack>

            {/* Chatbot Widget integrado globalmente en el layout autenticado */}
            <ChatbotIaWidget currentModule={currentModule} />
          </ChatbotContextProvider>
        </Box>
      </Box>
    </AppTheme>
  );
});

export default Home;
