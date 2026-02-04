import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Stack,
  TextField,
  InputAdornment,
  Avatar,
  Chip
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import { useChatbotScreenContext } from "../../shared-components/useChatbotScreenContext";
import dayjs from 'dayjs';

const MOCK_HISTORIAL = [
  { id: 1, usuario: 'Juan Pérez', accion: 'Creó Movimiento', entidad: 'Ingreso', detalles: 'Venta de servicio #1234', fecha: '2024-03-20T10:30:00Z', color: 'success' },
  { id: 2, usuario: 'María García', accion: 'Editó Factura', entidad: 'Factura A', detalles: 'Corrección de IVA en Factura #88', fecha: '2024-03-20T11:15:00Z', color: 'info' },
  { id: 3, usuario: 'Admin', accion: 'Eliminó Usuario', entidad: 'Colaborador', detalles: 'Baja de usuario temporal', fecha: '2024-03-19T15:00:00Z', color: 'error' },
  { id: 4, usuario: 'Juan Pérez', accion: 'Actualizó Presupuesto', entidad: 'Presupuesto Marzo', detalles: 'Ajuste de gastos operativos', fecha: '2024-03-19T09:45:00Z', color: 'warning' },
  { id: 5, usuario: 'María García', accion: 'Vinculó Cuenta', entidad: 'Mercado Pago', detalles: 'Sincronización de cuenta personal', fecha: '2024-03-18T18:20:00Z', color: 'info' },
];

export default function HistorialCambios(props) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const chatbotContext = React.useMemo(
    () => ({
      screen: "historial-cambios",
      logsCount: MOCK_HISTORIAL.length,
      estado: "maquetacion",
    }),
    []
  );

  useChatbotScreenContext(chatbotContext);

  const columns = [
    {
      field: 'usuario',
      headerName: 'Usuario',
      flex: 1,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>{params.value.charAt(0)}</Avatar>
          <Typography variant="body2">{params.value}</Typography>
        </Stack>
      )
    },
    {
      field: 'accion',
      headerName: 'Acción',
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.row.color}
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      )
    },
    { field: 'entidad', headerName: 'Entidad', flex: 1 },
    { field: 'detalles', headerName: 'Detalles', flex: 1.5 },
    {
      field: 'fecha',
      headerName: 'Fecha y Hora',
      flex: 1,
      renderCell: (params) => dayjs(params.value).format('DD/MM/YYYY HH:mm')
    },
  ];

  const filteredRows = MOCK_HISTORIAL.filter(row =>
    row.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.detalles.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Historial de Actividad
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Rastrea todos los cambios realizados por los colaboradores en la organización.
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 2, borderRadius: 3, height: 600 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <TextField
            size="small"
            placeholder="Buscar actividad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon color="disabled" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
        </Box>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          disableColumnMenu
          components={{ Toolbar: GridToolbar }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'action.hover',
              fontWeight: 700
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none'
            }
          }}
        />
      </Paper>
    </Container>
  );
}
