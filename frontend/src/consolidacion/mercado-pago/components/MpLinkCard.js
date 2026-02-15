// /mercado-pago/components/MpLinkCard.js
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  Stack,
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Divider,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { mpApi } from "../mpApi";
import logo from "./logoMPblanconegro.png";

export default function MpLinkCard({ onLinked }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const [helpOpen, setHelpOpen] = React.useState(false);

  const startLink = async () => {
    setBusy(true);
    setErr(null);
    try {
      const url = await mpApi.startOAuth();
      if (!url) throw new Error("URL de autorización vacía");
      window.location.href = url;
    } catch (e) {
      setErr(e?.message || "No se pudo iniciar la vinculación");
      setBusy(false);
    }
  };

  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if ((p.get("mp") === "linked" || p.get("linked") === "1") && onLinked) {
      onLinked();
    }
  }, [onLinked]);

  const pasos = [
    {
      titulo: "1. Vinculación Segura",
      desc: "Al hacer clic en 'Vincular cuenta', serás redirigido al sitio oficial de Mercado Pago para autorizar la conexión. MyCFO solo solicita permisos de lectura para sincronizar tus movimientos.",
    },
    {
      titulo: "2. Vista Previa e Importación",
      desc: "Una vez vinculado, podrás elegir qué meses o pagos específicos quieres traer. Siempre verás una vista previa antes de que cualquier dato se guarde en tu cuenta.",
    },
    {
      titulo: "3. Categorización Inteligente",
      desc: "El sistema mapeará tus cobros automáticamente. Podrás ajustar las categorías de cada pago para que tus reportes de resultados sean 100% precisos.",
    },
    {
      titulo: "4. Gestión Centralizada",
      desc: "Con tus datos en MyCFO, podrás generar facturas masivas, exportar reportes a Excel y conciliar tus ventas con tus movimientos bancarios en un solo lugar.",
    },
  ];

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          maxWidth: 860,
          mx: "auto",
          mt: 6,
          borderRadius: 2,
          overflow: "visible", // Permitir que el botón sobresalga si es necesario
          position: "relative",
        }}
      >
        <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}>
          <Tooltip title="¿Cómo funciona la vinculación?">
            <IconButton
              onClick={() => setHelpOpen(true)}
              color="primary"
              size="small"
              sx={{
                bgcolor: "action.hover",
                "&:hover": { bgcolor: "action.selected" },
              }}
            >
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <CardHeader
          title="Vincular tu cuenta de Mercado Pago"
          subheader="Conecta tu cuenta para importar pagos y movimientos."
          subheaderTypographyProps={{ color: "text.primary" }}
          sx={{ pb: 0 }}
        />

        {/* Espacio entre el header y el logo */}
        <Stack alignItems="center" justifyContent="center" sx={{ mt: 3, mb: 1 }}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: "#0d1117",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 80,
            }}
          >
            <img
              src={logo}
              alt="Mercado Pago"
              style={{
                height: 125,
                opacity: 0.95,
                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.45))",
              }}
            />
          </Box>
        </Stack>

        <Stack spacing={3}>
          <CardContent>
            <Typography variant="body2" color="text.primary" align="center" sx={{ opacity: 0.8 }}>
              Al vincular tu cuenta, MyCFO podrá sincronizar tus ventas de forma
              automática y segura.
            </Typography>
          </CardContent>

          <CardActions sx={{ px: 2, pb: 2 }}>
            <Box
              sx={{ width: "100%", display: "flex", justifyContent: "center" }}
            >
              <Button
                variant="contained"
                onClick={startLink}
                disabled={busy}
                sx={{ lineHeight: 1.2, px: 4 }}
              >
                {busy ? "Redirigiendo..." : "Vincular cuenta ahora"}
              </Button>
            </Box>
          </CardActions>
        </Stack>
      </Card>

      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          ¿Cómo funciona la vinculación?
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {pasos.map((paso, index) => (
              <Box key={index}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "primary.main", mb: 0.5 }}
                >
                  {paso.titulo}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.primary", opacity: 0.8 }}>
                  {paso.desc}
                </Typography>
                {index < pasos.length - 1 && (
                  <Divider sx={{ mt: 2, opacity: 0.5 }} />
                )}
              </Box>
            ))}
          </Stack>

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => setHelpOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              Entendido
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
