import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  LinearProgress,
  Chip,
  Box,
  Paper,
  Typography,
} from "@mui/material";

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleDateString("es-AR");
};

const formatDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleString("es-AR");
};

export default function ExcelHistoryTable({
  rows = [],
  loading = false,
  page = 0,
  pageSize = 20,
  total = 0,
  onPageChange,
  onPageSizeChange,
}) {
  const getStatusChip = (estado) => {
    switch (estado) {
      case "COMPLETADO":
        return (
          <Chip
            size="small"
            label="Completado"
            sx={{
              backgroundColor: "#e8f5e8",
              color: "#2e7d32",
              fontWeight: "bold",
              border: "1px solid #2e7d32",
            }}
            variant="outlined"
          />
        );
      case "PARCIAL":
        return (
          <Chip
            size="small"
            label="Parcial"
            sx={{
              backgroundColor: "#fff3e0",
              color: "#f57c00",
              fontWeight: "bold",
              border: "1px solid #f57c00",
            }}
            variant="outlined"
          />
        );
      case "ERROR":
        return (
          <Chip
            size="small"
            label="Error"
            sx={{
              backgroundColor: "#ffebee",
              color: "#d32f2f",
              fontWeight: "bold",
              border: "1px solid #d32f2f",
            }}
            variant="outlined"
          />
        );
      default:
        return (
          <Chip
            size="small"
            label="Desconocido"
            sx={{
              backgroundColor: "#f5f5f5",
              color: "#666666",
              fontWeight: "bold",
              border: "1px solid #e0e0e0",
            }}
            variant="outlined"
          />
        );
    }
  };

  const getTipoOrigenChip = (tipoOrigen) => {
    const colors = {
      mycfo: { bg: "#e3f2fd", color: "#1976d2", border: "#1976d2" },
      "mercado-pago": { bg: "#f3e5f5", color: "#7b1fa2", border: "#7b1fa2" },
      santander: { bg: "#e8f5e8", color: "#388e3c", border: "#388e3c" },
      galicia: { bg: "#e0f7fa", color: "#00838f", border: "#00838f" },
      uala: { bg: "#fff3e0", color: "#f57c00", border: "#f57c00" },
    };

    const color = colors[tipoOrigen] || {
      bg: "#f5f5f5",
      color: "#666666",
      border: "#e0e0e0",
    };

    return (
      <Chip
        size="small"
        label={tipoOrigen.toUpperCase()}
        sx={{
          backgroundColor: color.bg,
          color: color.color,
          fontWeight: "bold",
          border: `1px solid ${color.border}`,
        }}
        variant="outlined"
      />
    );
  };

  return (
    <TableContainer sx={{ borderRadius: 2 }}>
      {loading && <LinearProgress />}
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Archivo</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Fecha Importación</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Total Registros</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Guardados</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
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
                  No hay historial de cargas para mostrar.
                </Box>
              </TableCell>
            </TableRow>
          )}

          {rows.map((historial, index) => (
            <TableRow
              key={historial.id || index}
              hover
              sx={{
                "&:hover": {
                  backgroundColor: (t) => t.palette.action.hover,
                },
              }}
            >
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {historial.fileName || "—"}
                </Typography>
              </TableCell>

              <TableCell>
                {getTipoOrigenChip(historial.tipoOrigen || "desconocido")}
              </TableCell>

              <TableCell>
                <Typography variant="body2">
                  {formatDateTime(historial.fechaImportacion)}
                </Typography>
              </TableCell>

              <TableCell align="center">
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {historial.totalRegistros || 0}
                </Typography>
              </TableCell>

              <TableCell align="center">
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {historial.registrosGuardados || 0}
                </Typography>
              </TableCell>

              <TableCell>{getStatusChip(historial.estado)}</TableCell>
            </TableRow>
          ))}
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
        rowsPerPageOptions={[10, 20, 50, 100]}
      />
    </TableContainer>
  );
}
