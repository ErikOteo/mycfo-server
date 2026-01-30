import React from "react";
import { Box, Typography, Grid, ButtonBase } from "@mui/material";
import {
  Receipt,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Wallet,
  Handshake,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useChatbotScreenContext } from "../../shared-components/useChatbotScreenContext";

export default function CargaSeleccionTipo() {
  const navigate = useNavigate();

  const tipos = [
    { key: "Ingreso", label: "Ingreso", icon: <TrendingUp fontSize="large" /> },
    { key: "Egreso", label: "Egreso", icon: <TrendingDown fontSize="large" /> },
    { key: "Deuda", label: "Deuda", icon: <AccountBalance fontSize="large" /> },
    { key: "Acreencia", label: "Acreencia", icon: <Wallet fontSize="large" /> },
    { key: "Factura", label: "Factura", icon: <Receipt fontSize="large" /> },
  ];

  const chatbotContext = React.useMemo(
    () => ({
      screen: "carga-seleccion-tipo",
      tipos: tipos.map((t) => ({ key: t.key, label: t.label })),
    }),
    [tipos]
  );

  useChatbotScreenContext(chatbotContext);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1000,
        mx: "auto",
        mt: 1,
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}
      >
        Registro de Documentos y Movimientos
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4 }}>
        Elegí qué tipo de registro querés cargar
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {tipos.map((t) => (
          <Grid item key={t.key}>
            <ButtonBase
              onClick={() => navigate(`/carga/${t.key.toLowerCase()}`)}
              sx={{
                flexDirection: "column",
                p: 3,
                borderRadius: 3,
                border: "2px solid",
                borderColor: "divider",
                width: 180,
                height: 180,
                justifyContent: "center",
                alignItems: "center",
                bgcolor: "background.paper",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              {t.icon}
              <Typography sx={{ mt: 1 }} variant="subtitle1">
                {t.label}
              </Typography>
            </ButtonBase>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
