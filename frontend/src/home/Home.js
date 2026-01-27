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

const Home = React.memo(function Home(props) {
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [desktopMenuExpanded, setDesktopMenuExpanded] = React.useState(false);

  React.useEffect(() => {
    setMobileMenuOpen(false);
    setDesktopMenuExpanded(false);
  }, [location.pathname]);

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
        </Box>
      </Box>
    </AppTheme>
  );
});

export default Home;
