import React from 'react';
import {
  Box, Typography, Grid, Paper,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';

const TablaDetalle = ({ ingresos, egresos, topRightActions }) => {
  const totalIngresos = ingresos.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  const totalEgresos = egresos.reduce((acc, curr) => acc + Math.abs(Number(curr.total) || 0), 0);
  const balance = totalIngresos - totalEgresos;

  return (
    <Box sx={{ width: '100%', px: 0, py: 2 }}>
      {/* Totales arriba */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Ingresos</Typography>
            <Typography variant="h6" color="green">
              ${totalIngresos.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Egresos</Typography>
            <Typography variant="h6" color="red">
              ${totalEgresos.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Balance</Typography>
            <Typography variant="h6" color={balance >= 0 ? 'green' : 'red'}>
              ${balance.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Acciones arriba de la tabla */}
      <Typography variant="h6" gutterBottom>
        Detalle de Ingresos
      </Typography>

      {topRightActions && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          {topRightActions}
        </Box>
      )}

      {/* Tabla de ingresos */}
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
              <TableCell>N°</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell align="right">Monto</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ingresos.map((row, index) => (
              <TableRow
                key={index}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                  },
                }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{(row.categoria && String(row.categoria).trim().length) ? row.categoria : 'Sin categoría'}</TableCell>
                <TableCell align="right">${(Number(row.total) || 0).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Tabla de egresos */}
      <Typography variant="h6" gutterBottom>
        Detalle de Egresos
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
              <TableCell>N°</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell align="right">Monto</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {egresos.map((row, index) => (
              <TableRow
                key={index}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                  },
                }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{(row.categoria && String(row.categoria).trim().length) ? row.categoria : 'Sin categoría'}</TableCell>
                <TableCell align="right">${Math.abs(Number(row.total) || 0).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TablaDetalle;
