// src/carga-excel/components/CamposRequeridos.js
import React from "react";
import Box from "@mui/material/Box";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

function createData(id, fecha, descripcion, monto, medioPago) {
  return { id, fecha, descripcion, monto, medioPago };
}

const rows = [
  createData(10001, "2024-05-01", "Pago proveedor", -15000, "Transferencia"),
  createData(10002, "2024-05-02", "Venta producto", 22000, "Mercado Pago"),
  createData(10003, "2024-05-03", "Pago alquiler", -35000, "Débito automático"),
  createData(10004, "2024-05-04", "Interés bancario", 1500, "Depósito"),
];

const tableRowStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.02)",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
};

const tableCellStyle = {
  border: "1px solid rgba(255, 255, 255, 0.1)",
};

const CamposRequeridos = (props) => (
  <Box sx={props.sx}>
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ mb: 1 }}
    >
      <Typography variant="h6">Ejemplo de archivo esperado:</Typography>
      <Button
        variant="outlined"
        startIcon={<FileDownloadIcon />}
        href="/plantilla-mycfo.xlsx"
        download
      >
        Descargar plantilla MyCFO
      </Button>
    </Stack>
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="tabla de ejemplo de carga">
        <TableHead>
          <TableRow sx={tableRowStyle}>
            <TableCell sx={tableCellStyle}>IdReferencia</TableCell>
            <TableCell sx={tableCellStyle}>Fecha</TableCell>
            <TableCell sx={tableCellStyle}>Descripción</TableCell>
            <TableCell sx={tableCellStyle}>Monto</TableCell>
            <TableCell sx={tableCellStyle}>Medio de pago</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell sx={tableCellStyle}>{row.id}</TableCell>
              <TableCell sx={tableCellStyle}>{row.fecha}</TableCell>
              <TableCell sx={tableCellStyle}>{row.descripcion}</TableCell>
              <TableCell sx={tableCellStyle}>{row.monto}</TableCell>
              <TableCell sx={tableCellStyle}>{row.medioPago}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

export default CamposRequeridos;
