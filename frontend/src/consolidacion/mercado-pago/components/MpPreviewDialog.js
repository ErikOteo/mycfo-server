// /mercado-pago/components/MpPreviewDialog.js
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Alert,
  Box,
  Typography,
  Paper,
  LinearProgress,
  Divider,
} from "@mui/material";
import { mpApi } from "../mpApi";
import MpPaymentsTable from "./MpPaymentsTable";

export default function MpPreviewDialog({
  open,
  onClose,
  previewData = [],
  loading = false,
  onImportSelected,
}) {
  const [selected, setSelected] = React.useState([]);
  const [importing, setImporting] = React.useState(false);

  // Reset selection when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setSelected([]);
    }
  }, [open]);

  const handleImportSelected = async () => {
    if (selected.length === 0) {
      return;
    }

    setImporting(true);
    try {
      await onImportSelected?.(selected);
      setSelected([]);
      onClose?.();
    } catch (error) {
      console.error("Error importing selected payments:", error);
    } finally {
      setImporting(false);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === previewData.length) {
      setSelected([]);
    } else {
      setSelected(previewData.map((p) => p.mpPaymentId).filter(Boolean));
    }
  };

  // Contar duplicados y válidos
  const duplicadosCount = previewData.filter((p) => p.esDuplicado).length;
  const validosCount = previewData.length - duplicadosCount;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { minHeight: "80vh" },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6">Vista Previa de Pagos</Typography>
          {previewData.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              ({previewData.length} pagos encontrados)
            </Typography>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {loading && <LinearProgress />}

          {previewData.length === 0 && !loading && (
            <Alert severity="info">No se encontraron pagos para mostrar.</Alert>
          )}

          {previewData.length > 0 && (
            <>
              {duplicadosCount > 0 && (
                <Alert severity="warning">
                  Se encontraron <strong>{duplicadosCount}</strong> pago(s)
                  duplicado(s). Estos pagos ya fueron importados anteriormente.
                </Alert>
              )}

              <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                <MpPaymentsTable
                  rows={previewData}
                  loading={false}
                  page={0}
                  pageSize={previewData.length}
                  total={previewData.length}
                  selected={selected}
                  onSelectChange={setSelected}
                  onPageChange={() => {}}
                  onPageSizeChange={() => {}}
                />
              </Paper>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {selected.length} de {previewData.length} pagos seleccionados
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleSelectAll}
                  disabled={previewData.length === 0}
                >
                  {selected.length === previewData.length
                    ? "Deseleccionar todos"
                    : "Seleccionar todos"}
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={importing}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleImportSelected}
          disabled={selected.length === 0 || importing}
        >
          {importing
            ? "Importando..."
            : `Importar ${selected.length} seleccionados`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
