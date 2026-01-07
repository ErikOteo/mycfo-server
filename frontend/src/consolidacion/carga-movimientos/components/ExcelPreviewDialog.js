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
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import EditableExcelCategory from "./EditableExcelCategory";

export default function ExcelPreviewDialog({
  open,
  onClose,
  previewData = [],
  loading = false,
  onImportSelected,
  fileName = "",
  tipoOrigen = "",
}) {
  const [selected, setSelected] = React.useState([]);
  const [importing, setImporting] = React.useState(false);
  const [editedCategories, setEditedCategories] = React.useState({});
  const [filterDuplicados, setFilterDuplicados] = React.useState("todos"); // "todos", "duplicados", "validos"

  // Reset selection when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setSelected([]);
      setEditedCategories({});
      setFilterDuplicados("todos");
    }
  }, [open]);

  // Filtrar registros según el filtro seleccionado
  const registrosFiltrados = React.useMemo(() => {
    switch (filterDuplicados) {
      case "duplicados":
        return previewData.filter((r) => r.esDuplicado);
      case "validos":
        return previewData.filter((r) => !r.esDuplicado);
      default:
        return previewData;
    }
  }, [previewData, filterDuplicados]);

  const handleImportSelected = async () => {
    if (selected.length === 0) {
      return;
    }

    setImporting(true);
    try {
      const selectedRegistros = previewData
        .filter((_, index) => selected.includes(index))
        .map((registro, originalIndex) => {
          const actualIndex = previewData.findIndex((r) => r === registro);
          const editedCategory = editedCategories[actualIndex];
          return {
            ...registro,
            categoriaSugerida: editedCategory || registro.categoriaSugerida,
          };
        });

      await onImportSelected?.(selectedRegistros);
      setSelected([]);
      setEditedCategories({});
      onClose?.();
    } catch (error) {
      console.error("Error importing selected registros:", error);
    } finally {
      setImporting(false);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === registrosFiltrados.length) {
      setSelected([]);
    } else {
      // Mapear índices filtrados a índices originales
      const indicesOriginales = registrosFiltrados.map((registro) =>
        previewData.findIndex((r) => r === registro)
      );
      setSelected(indicesOriginales);
    }
  };

  const toggleOne = (index) => {
    if (selected.includes(index)) {
      setSelected(selected.filter((s) => s !== index));
    } else {
      setSelected([...selected, index]);
    }
  };

  const handleCategoryChange = (index, newCategory) => {
    setEditedCategories((prev) => ({
      ...prev,
      [index]: newCategory,
    }));
  };

  const formatAmount = (amount, isEgreso = false) => {
    if (amount == null) return "—";
    const displayAmount = isEgreso && amount > 0 ? -amount : amount;
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(displayAmount);
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("es-AR");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, minHeight: "70vh" },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6">Vista Previa - {fileName}</Typography>
          <Chip
            label={tipoOrigen.toUpperCase()}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {loading && <LinearProgress />}

          {previewData.length > 0 && (
            <>
              {(() => {
                const duplicadosEnBD = previewData.filter(
                  (r) =>
                    r.esDuplicado &&
                    r.motivoDuplicado?.includes("base de datos")
                ).length;
                const duplicadosEnExcel = previewData.filter(
                  (r) =>
                    r.esDuplicado &&
                    !r.motivoDuplicado?.includes("base de datos")
                ).length;

                if (duplicadosEnBD > 0 || duplicadosEnExcel > 0) {
                  return (
                    <Alert severity="warning">
                      <Typography variant="body2">
                        <strong>Duplicados detectados:</strong>
                        {duplicadosEnBD > 0 &&
                          ` ${duplicadosEnBD} movimientos ya se han cargado anteriormente.`}
                        {duplicadosEnExcel > 0 &&
                          ` ${duplicadosEnExcel} movimientos duplicados dentro del Excel.`}
                        <br />
                      </Typography>
                    </Alert>
                  );
                }
                return null;
              })()}

              {/* Filtros de duplicados */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
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
                      Válidos (
                      {previewData.filter((r) => !r.esDuplicado).length})
                    </MenuItem>
                    <MenuItem value="duplicados">
                      Duplicados (
                      {previewData.filter((r) => r.esDuplicado).length})
                    </MenuItem>
                  </Select>
                </FormControl>

                <Typography variant="body2" color="text.secondary">
                  Mostrando {registrosFiltrados.length} de {previewData.length}{" "}
                  movimientos
                </Typography>
              </Box>

              <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                <TableContainer sx={{ borderRadius: 2 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={
                              selected.length === registrosFiltrados.length &&
                              registrosFiltrados.length > 0
                            }
                            indeterminate={
                              selected.length > 0 &&
                              selected.length < registrosFiltrados.length
                            }
                            onChange={handleSelectAll}
                            inputProps={{ "aria-label": "Seleccionar todos" }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Monto Total
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Descripción
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Categoría
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {registrosFiltrados.length === 0 && !loading && (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <Box
                              sx={{
                                p: 3,
                                textAlign: "center",
                                color: "text.secondary",
                              }}
                            >
                              No hay movimientos para mostrar.
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}

                      {registrosFiltrados.map((registro, indexOriginal) => {
                        const index = previewData.findIndex(
                          (r) => r === registro
                        );
                        const fecha = formatDate(registro.fechaEmision);
                        const currentCategory =
                          editedCategories[index] || registro.categoriaSugerida;

                        return (
                          <TableRow
                            key={index}
                            hover
                            selected={selected.includes(index)}
                            sx={{
                              "&.Mui-selected": {
                                backgroundColor: (t) =>
                                  t.palette.action.selected,
                              },
                              "&:hover": {
                                backgroundColor: (t) => t.palette.action.hover,
                              },
                            }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selected.includes(index)}
                                onChange={() => toggleOne(index)}
                                inputProps={{
                                  "aria-label": `Seleccionar ${index}`,
                                }}
                              />
                            </TableCell>

                            <TableCell>
                              <Chip
                                size="small"
                                label={registro.tipo || "Ingreso"}
                                sx={{
                                  backgroundColor:
                                    registro.tipo === "Egreso"
                                      ? "#ffebee"
                                      : "#e8f5e8",
                                  color:
                                    registro.tipo === "Egreso"
                                      ? "#d32f2f"
                                      : "#2e7d32",
                                  fontWeight: "bold",
                                  border:
                                    registro.tipo === "Egreso"
                                      ? "1px solid #d32f2f"
                                      : "1px solid #2e7d32",
                                }}
                                variant="outlined"
                              />
                            </TableCell>

                            <TableCell align="right">
                              <span
                                style={{
                                  color:
                                    registro.tipo === "Egreso"
                                      ? "#d32f2f"
                                      : "#2e7d32",
                                  fontWeight: "bold",
                                }}
                              >
                                {formatAmount(
                                  registro.montoTotal,
                                  registro.tipo === "Egreso"
                                )}
                              </span>
                            </TableCell>

                            <TableCell>{fecha}</TableCell>

                            <TableCell>{registro.descripcion || "—"}</TableCell>

                            <TableCell>
                              <EditableExcelCategory
                                value={currentCategory || "Sin categorizar"}
                                onChange={(newCategory) =>
                                  handleCategoryChange(index, newCategory)
                                }
                              />
                            </TableCell>

                            <TableCell>
                              {registro.esDuplicado ? (
                                <Chip
                                  size="small"
                                  label={
                                    registro.motivoDuplicado?.includes(
                                      "base de datos"
                                    )
                                      ? "Registrado"
                                      : "Duplicado en Excel"
                                  }
                                  sx={{
                                    backgroundColor:
                                      registro.motivoDuplicado?.includes(
                                        "base de datos"
                                      )
                                        ? "#ffebee"
                                        : "#fff3e0",
                                    color: registro.motivoDuplicado?.includes(
                                      "base de datos"
                                    )
                                      ? "#d32f2f"
                                      : "#f57c00",
                                    fontWeight: "bold",
                                    border: registro.motivoDuplicado?.includes(
                                      "base de datos"
                                    )
                                      ? "1px solid #d32f2f"
                                      : "1px solid #f57c00",
                                  }}
                                  variant="outlined"
                                />
                              ) : (
                                <Chip
                                  size="small"
                                  label="No registrado"
                                  color="success"
                                  variant="outlined"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {selected.length} de {registrosFiltrados.length} movimientos
                  seleccionados
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleSelectAll}
                  disabled={registrosFiltrados.length === 0}
                >
                  {selected.length === registrosFiltrados.length
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
            ? "Guardando..."
            : `Guardar ${selected.length} movimientos`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
