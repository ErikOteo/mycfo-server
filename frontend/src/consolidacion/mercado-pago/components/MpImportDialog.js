// /mercado-pago/components/MpImportDialog.js
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Alert,
  MenuItem,
  Divider,
  Box,
  Typography,
  Paper,
} from "@mui/material";
import logoMp from "./logoMPblanconegro.png";

const MONTHS = [
  { v: 1, label: "Enero" },
  { v: 2, label: "Febrero" },
  { v: 3, label: "Marzo" },
  { v: 4, label: "Abril" },
  { v: 5, label: "Mayo" },
  { v: 6, label: "Junio" },
  { v: 7, label: "Julio" },
  { v: 8, label: "Agosto" },
  { v: 9, label: "Septiembre" },
  { v: 10, label: "Octubre" },
  { v: 11, label: "Noviembre" },
  { v: 12, label: "Diciembre" },
];

export default function MpImportDialog({ open, onClose, onImport }) {
  const now = new Date();
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [paymentId, setPaymentId] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    if (open) {
      setErr(null);
      setBusy(false);
      // Reseteo suave: deja por defecto el mes/año actual
      setPaymentId("");
      setMonth(now.getMonth() + 1);
      setYear(now.getFullYear());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    setErr(null);

    // Validación solo para importación por mes (Payment ID comentado)
    if (!month || !year) {
      setErr("Seleccioná mes y año para importar por período.");
      return;
    }

    setBusy(true);
    try {
      await onImport?.({
        mode: "preview",
        month: Number(month),
        year: Number(year),
      });
    } catch (e) {
      setErr(e?.message || "Error al obtener vista previa");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Logo centrado */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Box
              sx={{
                p: 1.1,
                borderRadius: 2,
                bgcolor: "#0d1117",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "inline-flex",
              }}
            >
              <img
                src={logoMp}
                alt="Mercado Pago"
                style={{
                  height: 125,
                  opacity: 0.95,
                  filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.45))",
                }}
              />
            </Box>
          </Box>

          {/* Sección 1: Único pago - COMENTADO TEMPORALMENTE */}
          {/* <Divider textAlign="center">
            <Typography
              variant="subtitle1"
              sx={{
                opacity: 0.8,
                textTransform: "uppercase",
                fontWeight: 400,
                fontSize: "1.1rem",
              }}
            >
              IMPORTAR UN MOVIMIENTO
            </Typography>
          </Divider>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1}>
              <TextField
                size="small"
                label="Payment ID"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value.trim())}
                placeholder="Ej. 124899180987"
                inputMode="numeric"
                fullWidth
              />
            </Stack>
          </Paper> */}

          {/* Sección 2: Por meses */}
          <Divider textAlign="center">
            <Typography
              variant="subtitle1"
              sx={{
                opacity: 0.8,
                textTransform: "uppercase",
                fontWeight: 400,
                fontSize: "1.1rem",
              }}
            >
              IMPORTAR MOVIMIENTOS POR MES
            </Typography>
          </Divider>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  size="small"
                  select
                  fullWidth
                  label="Mes"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
                  {MONTHS.map((m) => (
                    <MenuItem key={m.v} value={m.v}>
                      {m.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  size="small"
                  label="Año"
                  type="number"
                  fullWidth
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  inputProps={{ min: 2000, max: 2100, step: 1 }}
                />
              </Stack>
            </Stack>
          </Paper>

          {err && <Alert severity="error">{err}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={submit} disabled={busy}>
          {busy ? "Buscando…" : "Vista Previa"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
