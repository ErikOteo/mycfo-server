import React from 'react';
import { Box, Typography, Grid, Paper, useTheme } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const TablaDetalle = ({ ingresos, egresos, topRightActions }) => {
  const theme = useTheme();

  const totalIngresos = ingresos.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  const totalEgresos = egresos.reduce((acc, curr) => acc + Math.abs(Number(curr.total) || 0), 0);
  const balance = totalIngresos - totalEgresos;

  const currencyFormatter = (value) => {
    return `$${Number(value).toLocaleString()}`;
  };

  const columnsIngresos = [
    { field: 'id', headerName: 'N°', width: 70, align: 'center', headerAlign: 'center' },
    { field: 'categoria', headerName: 'Categoría', flex: 1, align: 'center', headerAlign: 'center' },
    {
      field: 'total',
      headerName: 'Monto',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (value) => currencyFormatter(value),
    },
  ];

  const columnsEgresos = [
    { field: 'id', headerName: 'N°', width: 70, align: 'center', headerAlign: 'center' },
    { field: 'categoria', headerName: 'Categoría', flex: 1, align: 'center', headerAlign: 'center' },
    {
      field: 'total',
      headerName: 'Monto',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (value) => currencyFormatter(Math.abs(value)),
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
      fontSize: "0.875rem", // Match default size
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

  // Add IDs for DataGrid
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
    total: Number(row.total) || 0
  }));

  return (
    <Box sx={{ width: '100%', px: 0, py: 2 }}>
      {/* Totales arriba */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, boxShadow: 'none' }}>
            <Typography variant="subtitle1">Ingresos</Typography>
            <Typography variant="h6" color="green">
              {currencyFormatter(totalIngresos)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, boxShadow: 'none' }}>
            <Typography variant="subtitle1">Egresos</Typography>
            <Typography variant="h6" color="red">
              {currencyFormatter(totalEgresos)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, boxShadow: 'none' }}>
            <Typography variant="subtitle1">Balance</Typography>
            <Typography variant="h6" color={balance >= 0 ? 'green' : 'red'}>
              {currencyFormatter(balance)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Columna Ingresos */}
        <Box sx={{ flex: '1 1 450px', minWidth: 0 }}>
          <Typography variant="h6" gutterBottom>
            Detalle de Ingresos
          </Typography>

          {topRightActions && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              {topRightActions}
            </Box>
          )}

          <Box sx={{ width: '100%', mb: 4 }}>
            <DataGrid
              rows={rowsIngresos}
              columns={columnsIngresos}
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

        {/* Columna Egresos */}
        <Box sx={{ flex: '1 1 450px', minWidth: 0 }}>
          <Typography variant="h6" gutterBottom>
            Detalle de Egresos
          </Typography>
          <Box sx={{ width: '100%' }}>
            <DataGrid
              rows={rowsEgresos}
              columns={columnsEgresos}
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
};

export default TablaDetalle;
