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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
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
  const [filterDuplicados, setFilterDuplicados] = React.useState("todos"); // "todos" | "duplicados" | "validos"
  const [filterTipo, setFilterTipo] = React.useState("todos"); // "todos" | "ingreso" | "egreso"

  React.useEffect(() => {
    if (open) {
      setSelected([]);
      setFilterDuplicados("todos");
      setFilterTipo("todos");
    }
  }, [open]);

  const filteredData = React.useMemo(() => {
    const byDup = (() => {
      switch (filterDuplicados) {
        case "duplicados":
          return previewData.filter((p) => p.esDuplicado);
        case "validos":
          return previewData.filter((p) => !p.esDuplicado);
        default:
          return previewData;
      }
    })();

    if (filterTipo === "todos") return byDup;
    const esIngreso = filterTipo === "ingreso";
    return byDup.filter(
      (p) =>
        (p.tipo || "Ingreso").toLowerCase() ===
        (esIngreso ? "ingreso" : "egreso")
    );
  }, [previewData, filterDuplicados, filterTipo]);

  const handleImportSelected = async () => {
    if (selected.length === 0) return;

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
    if (selected.length === filteredData.length) {
      setSelected([]);
    } else {
      setSelected(
        filteredData.map((p, idx) => p.id || p.mpPaymentId || `row-${idx}`)
      );
    }
  };

  const duplicadosCount = previewData.filter((p) => p.esDuplicado).length;

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

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Filtrar movimientos</InputLabel>
                    <Select
                      value={filterDuplicados}
                      label="Filtrar movimientos"
                      onChange={(e) => setFilterDuplicados(e.target.value)}
                    >
                      <MenuItem value="todos">
                        Todos ({previewData.length})
                      </MenuItem>
                      <MenuItem value="validos">
                        Validos (
                        {previewData.filter((r) => !r.esDuplicado).length})
                      </MenuItem>
                      <MenuItem value="duplicados">
                        Duplicados (
                        {previewData.filter((r) => r.esDuplicado).length})
                      </MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 170 }}>
                    <InputLabel sx={{ whiteSpace: "normal" }}>Tipo</InputLabel>
                    <Select
                      value={filterTipo}
                      label="Tipo"
                      onChange={(e) => setFilterTipo(e.target.value)}
                    >
                      <MenuItem value="todos">Todos</MenuItem>
                      <MenuItem value="ingreso">Ingresos</MenuItem>
                      <MenuItem value="egreso">Egresos</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  Mostrando {filteredData.length} de {previewData.length} pagos
                </Typography>
              </Box>

              <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                <MpPaymentsTable
                  rows={filteredData}
                  loading={false}
                  page={0}
                  pageSize={filteredData.length}
                  total={filteredData.length}
                  selected={selected}
                  onSelectChange={setSelected}
                  onPageChange={() => { }}
                  onPageSizeChange={() => { }}
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
                  {selected.length} de {filteredData.length} pagos seleccionados
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleSelectAll}
                  disabled={filteredData.length === 0}
                  sx={{ lineHeight: 1.2 }}
                >
                  {selected.length === filteredData.length
                    ? "Deseleccionar todos"
                    : "Seleccionar todos"}
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={importing} sx={{ lineHeight: 1.2 }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleImportSelected}
          disabled={selected.length === 0 || importing}
          sx={{ lineHeight: 1.2 }}
        >
          {importing
            ? "Importando..."
            : `Importar ${selected.length} seleccionados`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
