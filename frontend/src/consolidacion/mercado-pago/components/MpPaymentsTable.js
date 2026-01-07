import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  TableContainer,
  TablePagination,
  LinearProgress,
  Chip,
  Box,
  Stack,
  IconButton,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  PAGE_SIZE_OPTIONS,
  statusChipProps,
  currencyFormatter,
} from "../catalogs";
import EditableCategory from "./EditableCategory";

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  // Solo mostrar la fecha (sin hora)
  return d.toLocaleDateString("es-AR");
  // Si algún día quieres mostrar la hora cuando corresponda, descomenta esto:
  // const hasTime = d.getHours() + d.getMinutes() + d.getSeconds() !== 0;
  // return hasTime ? d.toLocaleString("es-AR") : d.toLocaleDateString("es-AR");
};

const formatAmount = (amount, currency, isEgreso) => {
  if (amount == null) return "—";

  // Para egresos, mostrar con signo menos
  const displayAmount = isEgreso && amount > 0 ? -amount : amount;

  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
    }).format(displayAmount);
  } catch {
    return `${displayAmount} ${currency || "ARS"}`;
  }
};

export default function MpPaymentsTable({
  rows = [],
  loading = false,
  page = 0,
  pageSize = 20,
  total = 0,
  selected = [],
  onSelectChange,
  onPageChange,
  onPageSizeChange,
  onCategoryChange,
}) {
  const allSelected = rows.length > 0 && selected.length === rows.length;
  const someSelected = selected.length > 0 && selected.length < rows.length;

  const toggleAll = (e) => {
    if (e.target.checked) {
      onSelectChange(
        rows.map((r, index) => r.id || r.mpPaymentId || `row-${index}`)
      );
    } else {
      onSelectChange([]);
    }
  };

  const toggleOne = (id) => {
    if (selected.includes(id)) onSelectChange(selected.filter((s) => s !== id));
    else onSelectChange([...selected, id]);
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(String(text));
  };

  return (
    <TableContainer sx={{ borderRadius: 2 }}>
      {loading && <LinearProgress />}
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={toggleAll}
                inputProps={{ "aria-label": "Seleccionar todos" }}
              />
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Monto Total</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Origen</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Categoría</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={7}>
                <Box
                  sx={{
                    p: 3,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  No hay pagos para mostrar.
                </Box>
              </TableCell>
            </TableRow>
          )}

          {rows.map((r, index) => {
            // Usar el ID del registro, mpPaymentId, o índice como fallback
            const id = r.id || r.mpPaymentId || `row-${index}`;
            const fecha = formatDate(r.fecha || r.date);

            return (
              <TableRow
                key={id}
                hover
                selected={selected.includes(id)}
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: (t) => t.palette.action.selected,
                  },
                  "&:hover": {
                    backgroundColor: (t) => t.palette.action.hover,
                  },
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(id)}
                    onChange={() => toggleOne(id)}
                    inputProps={{ "aria-label": `Seleccionar ${id}` }}
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={r.tipo || r.estado || r.status || "—"}
                    sx={{
                      backgroundColor:
                        r.tipo === "Egreso"
                          ? "#ffebee"
                          : r.tipo === "Ingreso"
                          ? "#e8f5e8"
                          : "#f5f5f5",
                      color:
                        r.tipo === "Egreso"
                          ? "#d32f2f"
                          : r.tipo === "Ingreso"
                          ? "#2e7d32"
                          : "#666666",
                      fontWeight: "bold",
                      border:
                        r.tipo === "Egreso"
                          ? "1px solid #d32f2f"
                          : r.tipo === "Ingreso"
                          ? "1px solid #2e7d32"
                          : "1px solid #e0e0e0",
                    }}
                    variant="outlined"
                  />
                </TableCell>

                <TableCell align="right">
                  {(() => {
                    const amount = r.montoTotal ?? r.total ?? r.amount;
                    const currency = r.moneda || r.currency || "ARS";
                    const isEgreso = r.tipo === "Egreso";

                    return (
                      <span
                        style={{
                          color: isEgreso ? "#d32f2f" : "#2e7d32",
                          fontWeight: "bold",
                        }}
                      >
                        {formatAmount(amount, currency, isEgreso)}
                      </span>
                    );
                  })()}
                </TableCell>

                <TableCell>{fecha}</TableCell>

                <TableCell>
                  {r.descripcion || r.detalle || r.description || "—"}
                </TableCell>

                <TableCell>
                  {r.origen || r.comprador || r.buyer || "—"}
                </TableCell>

                <TableCell>
                  <EditableCategory
                    value={r.categoria || "MercadoPago"}
                    onChange={(newCategory) =>
                      onCategoryChange?.(r, newCategory)
                    }
                    disabled={!onCategoryChange} // Solo editable si hay callback
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, p) => onPageChange(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) =>
          onPageSizeChange(parseInt(e.target.value, 10))
        }
        rowsPerPageOptions={PAGE_SIZE_OPTIONS}
      />
    </TableContainer>
  );
}
