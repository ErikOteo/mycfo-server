import * as React from 'react';
import {
  Box, Typography, Grid, Paper,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';

// Utilidad de moneda con separador de miles y símbolo "$"
const formatCurrency = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '-';
  return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
};

export default function TablaDetalle({ year, ingresos, egresos }) {
  const totalIngresos = ingresos.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const totalEgresos = egresos.reduce((sum, item) => sum + Math.abs(Number(item.total) || 0), 0);
  const balance = totalIngresos - totalEgresos;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Totales (igual al reporte mensual) */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Ingresos</Typography>
            <Typography variant="h6" color="green">{formatCurrency(totalIngresos)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Egresos</Typography>
            <Typography variant="h6" color="red">{formatCurrency(totalEgresos)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Resultado</Typography>
            <Typography variant="h6" color={balance >= 0 ? 'green' : 'red'}>{formatCurrency(balance)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabla de Ingresos */}
      <Typography variant="h6" gutterBottom>
        Detalle de Ingresos ({year})
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4, maxHeight: 360, overflowY: 'auto', overflowX: 'auto' }}>
        <Table
          stickyHeader
          sx={{
            '& .MuiTableCell-root': {
              border: '1px solid rgba(224, 224, 224, 1)',
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              fontWeight: 700,
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell scope="col">Nº</TableCell>
              <TableCell scope="col">Categoría</TableCell>
              <TableCell scope="col" align="right">Monto</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ingresos.map((row, index) => (
              <TableRow
                key={index}
                sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)', cursor: 'pointer' } }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{(row.categoria && String(row.categoria).trim().length) ? row.categoria : 'Sin categoría'}</TableCell>
                <TableCell align="right">{formatCurrency(Number(row.total) || 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Tabla de Egresos */}
      <Typography variant="h6" gutterBottom>
        Detalle de Egresos ({year})
      </Typography>
      <TableContainer component={Paper} sx={{ maxHeight: 360, overflowY: 'auto', overflowX: 'auto' }}>
        <Table
          stickyHeader
          sx={{
            '& .MuiTableCell-root': {
              border: '1px solid rgba(224, 224, 224, 1)',
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              fontWeight: 700,
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell scope="col">Nº</TableCell>
              <TableCell scope="col">Categoría</TableCell>
              <TableCell scope="col" align="right">Monto</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {egresos.map((row, index) => (
              <TableRow
                key={index}
                sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)', cursor: 'pointer' } }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{(row.categoria && String(row.categoria).trim().length) ? row.categoria : 'Sin categoría'}</TableCell>
                <TableCell align="right">{formatCurrency(Math.abs(Number(row.total) || 0))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

