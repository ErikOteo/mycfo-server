import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";

const TablaErrores = ({ errores }) => (
  <>
    <Typography variant="subtitle1" sx={{ mt: 3 }}>
      Detalles de errores
    </Typography>
    <TableContainer component={Paper} sx={{ mt: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Fila</TableCell>
            <TableCell>Error</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {errores.map((err, index) => (
            <TableRow key={index}>
              <TableCell>{err.fila}</TableCell>
              <TableCell>{err.motivo}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </>
);

export default TablaErrores;
