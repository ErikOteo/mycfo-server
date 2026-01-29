import * as React from 'react';
import { Box, Typography, Grid, Paper, useTheme } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

// Utilidad de moneda con separador de miles y símbolo "$"
const formatCurrency = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '-';
  return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
};

export default function TablaDetalle({ year, ingresos, egresos }) {
  const theme = useTheme();

  const totalIngresos = ingresos.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const totalEgresos = egresos.reduce((sum, item) => sum + Math.abs(Number(item.total) || 0), 0);
  const balance = totalIngresos - totalEgresos;

  // Columns definition
  const columns = [
    { field: 'id', headerName: 'Nº', width: 70, align: 'center', headerAlign: 'center' },
    { field: 'categoria', headerName: 'Categoría', flex: 1, align: 'center', headerAlign: 'center' },
    {
      field: 'total',
      headerName: 'Monto',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (value) => formatCurrency(value),
    },
  ];

  // Styles copied EXACTLY from TablaRegistrosV2.js to ensure 100% parity
  const dataGridStyles = {
    backgroundColor: "background.paper",
    borderRadius: 2,
    border: (theme) => `1px solid ${theme.palette.divider}`,
    "& .MuiDataGrid-cell": {
      borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      display: "flex",
      alignItems: "center",
      fontSize: "0.875rem",
    },
    "& .MuiDataGrid-columnHeaders": {
      backgroundColor: (theme) =>
        theme.palette.mode === "dark"
          ? "rgba(255, 255, 255, 0.05)"
          : "#f5f5f5",
      color: "text.primary",
      borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
    },
    "& .MuiDataGrid-columnHeader": {
      "&:focus": { outline: "none" },
    },
    "& .MuiDataGrid-sortIcon": {
      display: "none",
    },
    "& .MuiDataGrid-menuIcon": {
      display: "none",
    },
    "& .MuiDataGrid-iconButtonContainer": {
      display: "none",
    },
    "& .MuiDataGrid-row:hover": {
      backgroundColor: (theme) => theme.palette.action.hover,
    },
    "& .MuiDataGrid-footerContainer": {
      borderTop: (theme) => `1px solid ${theme.palette.divider}`,
    }
  };

  // Prepare rows
  const rowsIngresos = ingresos.map((row, index) => ({
    id: index + 1,
    ...row,
    categoria: row.categoria && String(row.categoria).trim().length ? row.categoria : "Sin categoría",
    total: Number(row.total) || 0
  }));

  const rowsEgresos = egresos.map((row, index) => ({
    id: index + 1,
    ...row,
    categoria: row.categoria && String(row.categoria).trim().length ? row.categoria : "Sin categoría",
    total: Math.abs(Number(row.total) || 0)
  }));


  return (
    <Box sx={{ width: '100%' }}>
      {/* Totales (igual al reporte mensual) */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, boxShadow: 'none' }}>
            <Typography variant="subtitle1">Ingresos</Typography>
            <Typography variant="h6" color="green">{formatCurrency(totalIngresos)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, boxShadow: 'none' }}>
            <Typography variant="subtitle1">Egresos</Typography>
            <Typography variant="h6" color="red">{formatCurrency(totalEgresos)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, boxShadow: 'none' }}>
            <Typography variant="subtitle1">Resultado</Typography>
            <Typography variant="h6" color={balance >= 0 ? 'green' : 'red'}>{formatCurrency(balance)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Tabla de Ingresos */}
        <Box sx={{ flex: '1 1 450px', minWidth: 0 }}>
          <Typography variant="h6" gutterBottom>
            Detalle de Ingresos ({year})
          </Typography>
          <Box sx={{ width: '100%', mb: 4 }}>
            <DataGrid
              rows={rowsIngresos}
              columns={columns}
              density="standard"
              autoHeight
              hideFooter
              disableColumnMenu
              disableColumnResize
              disableRowSelectionOnClick
              sx={dataGridStyles}
            />
          </Box>
        </Box>

        {/* Tabla de Egresos */}
        <Box sx={{ flex: '1 1 450px', minWidth: 0 }}>
          <Typography variant="h6" gutterBottom>
            Detalle de Egresos ({year})
          </Typography>
          <Box sx={{ width: '100%' }}>
            <DataGrid
              rows={rowsEgresos}
              columns={columns}
              density="standard"
              autoHeight
              hideFooter
              disableColumnMenu
              disableColumnResize
              disableRowSelectionOnClick
              sx={dataGridStyles}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
