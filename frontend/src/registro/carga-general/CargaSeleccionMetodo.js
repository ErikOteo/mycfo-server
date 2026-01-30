import React from "react";
import { Box, Typography, Grid, ButtonBase } from "@mui/material";
import { Edit, Description, CameraAlt, Mic } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useChatbotScreenContext } from "../../shared-components/useChatbotScreenContext";

export default function CargaSeleccionMetodo() {
  const navigate = useNavigate();
  const { tipo } = useParams();

  const modos = [
    { key: "formulario", label: "Formulario", icon: <Edit fontSize="large" /> },
    {
      key: "documento",
      label: "Documento",
      icon: <Description fontSize="large" />,
    },
    { key: "foto", label: "Foto", icon: <CameraAlt fontSize="large" /> },
    { key: "audio", label: "Audio", icon: <Mic fontSize="large" /> },
  ];

  const chatbotContext = React.useMemo(
    () => ({
      screen: "carga-seleccion-metodo",
      tipo,
      modos: modos.map((m) => ({ key: m.key, label: m.label })),
    }),
    [tipo, modos]
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
      <Typography variant="h5" sx={{ mb: 2 }}>
        Selección de método
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4 }}>
        Elegí cómo querés cargar tu {tipo}
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {modos.map((m) => (
          <Grid item key={m.key}>
            <ButtonBase
              onClick={() => navigate(`/carga/${tipo}/${m.key}`)}
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
              {m.icon}
              <Typography sx={{ mt: 1 }} variant="subtitle1">
                {m.label}
              </Typography>
            </ButtonBase>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
