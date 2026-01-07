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
} from "@mui/material";
import { mpApi } from "../mpApi";
import logo from "./logoMPblanconegro.png";

export default function MpLinkCard({ onLinked }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);

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

  return (
    <Card
      variant="outlined"
      sx={{
        maxWidth: 860,
        mx: "auto",
        mt: 6,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <CardHeader
        title="Vincular tu cuenta de Mercado Pago"
        subheader="Conecta tu cuenta para importar pagos y movimientos."
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
          {/* Aquí puedes agregar más contenido si lo necesitas */}
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2 }}>
          <Box
            sx={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            <Button variant="contained" onClick={startLink} disabled={busy}>
              {busy ? "Redirigiendo..." : "Vincular cuenta"}
            </Button>
          </Box>
        </CardActions>
      </Stack>
    </Card>
  );
}
