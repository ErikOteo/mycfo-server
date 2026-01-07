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
  createData(10003, "2024-05-03", "Pago alquiler", -35000, "Debito automatico"),
  createData(10004, "2024-05-04", "Interes bancario", 1500, "Deposito"),
];

const tableWrapperStyle = {
  borderRadius: 0,
  border: "1px solid rgba(255, 255, 255, 0.4)",
  overflow: "hidden",
};

const headCellStyle = {
  fontWeight: 600,
  border: "1px solid #000",
};

const bodyCellStyle = {
  border: "1px solid #000",
};

const bodyRowStyle = {};

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
    <TableContainer component={Paper} sx={tableWrapperStyle}>
      <Table
        sx={{
          minWidth: 650,
          borderCollapse: "collapse",
        }}
        aria-label="tabla de ejemplo de carga"
        size="small"
      >
        <TableHead>
          <TableRow>
            <TableCell sx={headCellStyle}>IdReferencia</TableCell>
            <TableCell sx={headCellStyle}>Fecha</TableCell>
            <TableCell sx={headCellStyle}>Descripcion</TableCell>
            <TableCell sx={headCellStyle}>Monto</TableCell>
            <TableCell sx={headCellStyle}>Medio de pago</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index} sx={bodyRowStyle}>
              <TableCell sx={bodyCellStyle}>{row.id}</TableCell>
              <TableCell sx={bodyCellStyle}>{row.fecha}</TableCell>
              <TableCell sx={bodyCellStyle}>{row.descripcion}</TableCell>
              <TableCell sx={bodyCellStyle}>{row.monto}</TableCell>
              <TableCell sx={bodyCellStyle}>{row.medioPago}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

export default CamposRequeridos;
