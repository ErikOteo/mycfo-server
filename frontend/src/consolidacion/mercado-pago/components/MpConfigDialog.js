import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Switch,
  Alert,
  Grid,
  Paper,
  Typography,
  Tooltip,
  Skeleton,
} from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { mpApi } from "../mpApi";

export default function MpConfigDialog({ open, onClose, onSaved, onUnlink }) {
  const [cfg, setCfg] = React.useState({
    autoBill: false,
    timezone: "America/Argentina/Buenos_Aires",
    currency: "ARS",
  });
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const load = React.useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setErr(null);
    try {
      const c = await mpApi.getConfig();
      setCfg({
        autoBill: !!c?.autoBill,
        timezone: c?.timezone || "America/Argentina/Buenos_Aires",
        currency: (c?.currency || "ARS").toUpperCase(),
      });
    } catch (e) {
      setErr(e?.message || "No se pudo cargar la configuración");
    } finally {
      setLoading(false);
    }
  }, [open]);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      await mpApi.updateConfig(cfg);
      onSaved?.();
    } catch (e) {
      setErr(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  // Helpers visuales para fila label-valor
  const Row = ({ label, hint, control }) => (
    <Grid container spacing={2} alignItems="center">
      <Grid item xs={12} sm={4}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          {hint && (
            <Tooltip title={hint}>
              <InfoOutlined fontSize="small" color="action" />
            </Tooltip>
          )}
        </Stack>
      </Grid>
      <Grid item xs={12} sm={8}>
        {control}
      </Grid>
    </Grid>
  );

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>CONFIGURAR</DialogTitle>

      <DialogContent dividers>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack spacing={2}>
            {err && <Alert severity="error">{err}</Alert>}

            {/* Punto de Venta (visual) -> usamos timezone como ejemplo de campo de texto */}
            {loading ? (
              <Skeleton variant="rounded" height={40} />
            ) : (
              <Row
                label="Punto de Venta"
                hint="Identificador de tu punto de venta."
                control={
                  <TextField
                    size="small"
                    placeholder="0001"
                    value={cfg.timezone}
                    onChange={(e) =>
                      setCfg({ ...cfg, timezone: e.target.value })
                    }
                    disabled={loading}
                    fullWidth
                  />
                }
              />
            )}

            {/* Depósito (visual) -> usamos currency como ejemplo (ISO) */}
            {loading ? (
              <Skeleton variant="rounded" height={40} />
            ) : (
              <Row
                label="Depósito"
                hint="Depósito por defecto."
                control={
                  <TextField
                    size="small"
                    placeholder="Depósito Universal"
                    value={cfg.currency}
                    onChange={(e) =>
                      setCfg({ ...cfg, currency: e.target.value.toUpperCase() })
                    }
                    inputProps={{ maxLength: 3 }}
                    disabled={loading}
                    fullWidth
                  />
                }
              />
            )}

            {/* Condición de Pago (editable como texto) */}
            <Row
              label="Condición de Pago"
              hint="Solo visual por ahora."
              control={
                <TextField
                  size="small"
                  placeholder="Cuenta Corriente"
                  value={cfg.condicionPago || ""}
                  onChange={(e) =>
                    setCfg({ ...cfg, condicionPago: e.target.value })
                  }
                  disabled={loading}
                  fullWidth
                />
              }
            />

            {/* Cuenta de cobro (editable como texto) */}
            <Row
              label="Cuenta de cobro"
              hint="Solo visual por ahora."
              control={
                <TextField
                  size="small"
                  placeholder="Banco Santander"
                  value={cfg.cuentaCobro || ""}
                  onChange={(e) =>
                    setCfg({ ...cfg, cuentaCobro: e.target.value })
                  }
                  disabled={loading}
                  fullWidth
                />
              }
            />

            {/* Enviar botón de pago -> mapeado a autoBill (switch) */}
            {/* <Row
              label="Enviar botón de pago"
              hint="Activa envíos automáticos de botón/factura cuando aplique."
              control={
                <FormControlLabel
                  control={
                    <Switch
                      checked={cfg.autoBill}
                      onChange={(e) =>
                        setCfg({ ...cfg, autoBill: e.target.checked })
                      }
                      disabled={loading}
                    />
                  }
                  label="Activado"
                />
              }
            /> */}
          </Stack>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        {onUnlink && (
          <Button
            color="inherit"
            onClick={onUnlink}
            disabled={saving || loading}
            sx={{ lineHeight: 1.2 }}
          >
            Desvincular
          </Button>
        )}
        <Button onClick={onClose} disabled={saving} sx={{ lineHeight: 1.2 }}>
          Cerrar
        </Button>
        <Button variant="contained" onClick={save} disabled={saving || loading} sx={{ lineHeight: 1.2 }}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
