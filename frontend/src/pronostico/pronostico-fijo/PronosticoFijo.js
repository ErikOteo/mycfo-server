import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TextField,
  MenuItem,
  Select,
  FormControl,
  CircularProgress,
  Tooltip,
  Button
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../shared-components/LoadingSpinner';
import API_CONFIG from '../../config/api-config';
import http from '../../api/http';
import CurrencyTabs, { usePreferredCurrency } from '../../shared-components/CurrencyTabs';

// Opciones de frecuencia
const FRECUENCIAS = [
  { label: 'Mensual', value: 1 },
  { label: 'Bimestral', value: 2 },
  { label: 'Semestral', value: 6 },
  { label: 'Anual', value: 12 }
];

// Opciones de horizonte (en años)
const HORIZONTES = [
  { label: '1 año', value: 12 },
  { label: '2 años', value: 24 },
  { label: '3 años', value: 36 },
  { label: '4 años', value: 48 },
  { label: '5 años', value: 60 }
];

export default function PronosticoFijo() {
  const [forecasts, setForecasts] = React.useState([]);
  const [configs, setConfigs] = React.useState([]);
  const [currency, setCurrency] = usePreferredCurrency("ARS");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteConfigDialogOpen, setDeleteConfigDialogOpen] = React.useState(false);
  const [forecastToDelete, setForecastToDelete] = React.useState(null);
  const [configToDelete, setConfigToDelete] = React.useState(null);
  const [editingConfigId, setEditingConfigId] = React.useState(null);
  const [newConfigMode, setNewConfigMode] = React.useState(false);
  const [editingConfig, setEditingConfig] = React.useState(null);
  const [newConfig, setNewConfig] = React.useState({
    nombre: '',
    mesesFrecuencia: 1,
    horizonteMeses: 12
  });
  const [saving, setSaving] = React.useState(false);
  const [generatingForecastId, setGeneratingForecastId] = React.useState(null);
  const [usuarioRol, setUsuarioRol] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    cargarDatos();
    cargarRolUsuario();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [forecastsRes, configsRes] = await Promise.all([
        http.get(`${API_CONFIG.PRONOSTICO}/api/forecasts`),
        http.get(`${API_CONFIG.PRONOSTICO}/api/forecast-config`)
      ]);
      setForecasts(forecastsRes.data);
      setConfigs(configsRes.data);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const cargarRolUsuario = async () => {
    try {
      const sub = sessionStorage.getItem('sub');
      if (!sub) return;
      const res = await fetch(`${API_CONFIG.ADMINISTRACION}/api/usuarios/perfil`, {
        headers: { 'X-Usuario-Sub': sub },
      });
      if (!res.ok) return;
      const data = await res.json();
      setUsuarioRol(data.rol || null);
    } catch (e) {
      console.error('Error cargando rol de usuario:', e);
    }
  };

  const handleVerForecast = (forecastId) => {
    navigate(`/pronostico-fijo/${forecastId}`);
  };

  const handleDeleteForecastClick = (forecast) => {
    setForecastToDelete(forecast);
    setDeleteDialogOpen(true);
  };

  const handleDeleteForecastConfirm = async () => {
    if (!forecastToDelete) return;

    try {
      await http.delete(`${API_CONFIG.PRONOSTICO}/api/forecasts/${forecastToDelete.id}`);
      setDeleteDialogOpen(false);
      setForecastToDelete(null);
      cargarDatos();
      setSuccess('Pronóstico eliminado exitosamente');
    } catch (err) {
      console.error('Error eliminando forecast:', err);
      setError(err.response?.data?.message || 'Error al eliminar el pronóstico.');
    }
  };

  const handleDeleteConfigClick = (config) => {
    setConfigToDelete(config);
    setDeleteConfigDialogOpen(true);
  };

  const handleDeleteConfigConfirm = async () => {
    if (!configToDelete) return;

    try {
      await http.delete(`${API_CONFIG.PRONOSTICO}/api/forecast-config/${configToDelete.id}`);
      setDeleteConfigDialogOpen(false);
      setConfigToDelete(null);
      cargarDatos();
      setSuccess('Configuración eliminada exitosamente');
    } catch (err) {
      console.error('Error eliminando configuración:', err);
      setError(err.response?.data?.message || 'Error al eliminar la configuración.');
    }
  };

  const handleEditConfig = (config) => {
    setEditingConfigId(config.id);
    setEditingConfig({
      nombre: config.nombre || '',
      mesesFrecuencia: config.mesesFrecuencia || 1,
      horizonteMeses: config.horizonteMeses || 12
    });
  };

  const handleCancelEditConfig = () => {
    setEditingConfigId(null);
    setEditingConfig(null);
  };

  const handleSaveConfig = async () => {
    if (!editingConfigId || !editingConfig) return;
    if (!editingConfig.nombre || editingConfig.nombre.trim() === '') {
      setError('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      await http.put(`${API_CONFIG.PRONOSTICO}/api/forecast-config/${editingConfigId}`, editingConfig);
      setEditingConfigId(null);
      setEditingConfig(null);
      cargarDatos();
      setSuccess('Configuración actualizada exitosamente');
    } catch (err) {
      console.error('Error guardando configuración:', err);
      setError(err.response?.data?.message || 'Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNewConfig = () => {
    setNewConfigMode(true);
    setNewConfig({
      nombre: '',
      mesesFrecuencia: 1,
      horizonteMeses: 12
    });
  };

  const handleCancelNewConfig = () => {
    setNewConfigMode(false);
    setNewConfig({
      nombre: '',
      mesesFrecuencia: 1,
      horizonteMeses: 12
    });
  };

  const handleSaveNewConfig = async () => {
    if (!newConfig.nombre || newConfig.nombre.trim() === '') {
      setError('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      await http.post(`${API_CONFIG.PRONOSTICO}/api/forecast-config`, newConfig);
      setNewConfigMode(false);
      setNewConfig({
        nombre: '',
        mesesFrecuencia: 1,
        horizonteMeses: 12
      });
      cargarDatos();
      setSuccess('Configuración creada exitosamente');
    } catch (err) {
      console.error('Error creando configuración:', err);
      setError(err.response?.data?.message || 'Error al crear la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerarForecast = async (configId) => {
    setGeneratingForecastId(configId);
    setError(null);
    try {
      // Pasamos la moneda como query param
      await http.post(`${API_CONFIG.PRONOSTICO}/api/forecasts/generar/${configId}`, null, {
        params: { moneda: currency }
      });
      setSuccess('Pronóstico generado exitosamente');
      cargarDatos(); // Recargar para mostrar el nuevo pronóstico
    } catch (err) {
      console.error('Error generando forecast:', err);
      setError(err.response?.data?.message || 'Error al generar el pronóstico. Por favor intenta nuevamente.');
    } finally {
      setGeneratingForecastId(null);
    }
  };

  const getFrecuenciaLabel = (mesesFrecuencia) => {
    const freq = FRECUENCIAS.find(f => f.value === mesesFrecuencia);
    return freq ? freq.label : `Cada ${mesesFrecuencia} meses`;
  };

  const getHorizonteLabel = (horizonteMeses) => {
    const hor = HORIZONTES.find(h => h.value === horizonteMeses);
    return hor ? hor.label : `${horizonteMeses} meses`;
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '-';
    try {
      const fecha = new Date(fechaISO);
      return fecha.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return fechaISO;
    }
  };

  const formatearNombre = (nombre, createdAt, moneda) => {
    let nombreBase = nombre;
    if (!nombreBase || nombreBase.trim() === '') {
      if (createdAt) {
        try {
          const fecha = new Date(createdAt);
          const fechaFormateada = fecha.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
          });
          nombreBase = `Pronóstico de ${fechaFormateada}`;
        } catch (e) {
          nombreBase = 'Pronóstico sin nombre';
        }
      } else {
        nombreBase = 'Pronóstico sin nombre';
      }
    }
    // Agregar indicador de moneda si existe
    if (moneda) {
      return `${nombreBase} (${moneda})`;
    }
    return nombreBase;
  };

  const esAdmin = (usuarioRol || '').toUpperCase().includes('ADMIN');

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: { sm: "100%", md: "1700px" },
        mx: "auto",
        p: 3,
      }}
    >
      <CurrencyTabs value={currency} onChange={setCurrency} sx={{ justifyContent: 'center', mb: 1.5 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Pronósticos Fijos
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabla de Configuraciones */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            Configuraciones
          </Typography>
          <Tooltip title="Agregar nueva configuración">
            <IconButton
              color="primary"
              onClick={handleAddNewConfig}
              disabled={newConfigMode}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center"><strong>Nombre</strong></TableCell>
                <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Frecuencia</strong></TableCell>
                <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Horizonte</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Fila para nueva configuración */}
              {newConfigMode && (
                <TableRow>
                  <TableCell align="center">
                    <TextField
                      size="small"
                      value={newConfig.nombre}
                      onChange={(e) => setNewConfig({ ...newConfig, nombre: e.target.value })}
                      placeholder="Nombre de la configuración"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={newConfig.mesesFrecuencia}
                        onChange={(e) => setNewConfig({ ...newConfig, mesesFrecuencia: e.target.value })}
                      >
                        {FRECUENCIAS.map((freq) => (
                          <MenuItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={newConfig.horizonteMeses}
                        onChange={(e) => setNewConfig({ ...newConfig, horizonteMeses: e.target.value })}
                      >
                        {HORIZONTES.map((hor) => (
                          <MenuItem key={hor.value} value={hor.value}>
                            {hor.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="success"
                      onClick={handleSaveNewConfig}
                      disabled={saving}
                      size="small"
                    >
                      {saving ? <CircularProgress size={20} /> : <CheckIcon />}
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={handleCancelNewConfig}
                      disabled={saving}
                      size="small"
                    >
                      <CloseIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )}

              {/* Filas de configuraciones existentes */}
              {configs.length === 0 && !newConfigMode ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No hay configuraciones. Haz clic en + para agregar una.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                configs.map((config) => (
                  <TableRow key={config.id} hover>
                    {editingConfigId === config.id ? (
                      <>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            value={editingConfig.nombre}
                            onChange={(e) => setEditingConfig({ ...editingConfig, nombre: e.target.value })}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={editingConfig.mesesFrecuencia}
                              onChange={(e) => setEditingConfig({ ...editingConfig, mesesFrecuencia: e.target.value })}
                            >
                              {FRECUENCIAS.map((freq) => (
                                <MenuItem key={freq.value} value={freq.value}>
                                  {freq.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={editingConfig.horizonteMeses}
                              onChange={(e) => setEditingConfig({ ...editingConfig, horizonteMeses: e.target.value })}
                            >
                              {HORIZONTES.map((hor) => (
                                <MenuItem key={hor.value} value={hor.value}>
                                  {hor.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="success"
                            onClick={handleSaveConfig}
                            disabled={saving}
                            size="small"
                          >
                            {saving ? <CircularProgress size={20} /> : <CheckIcon />}
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={handleCancelEditConfig}
                            disabled={saving}
                            size="small"
                          >
                            <CloseIcon />
                          </IconButton>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell align="center">{config.nombre}</TableCell>
                        <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>{getFrecuenciaLabel(config.mesesFrecuencia)}</TableCell>
                        <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>{getHorizonteLabel(config.horizonteMeses)}</TableCell>
                        <TableCell align="center">
                          <Tooltip title={`Calcular ahora en ${currency}`}>
                            <IconButton
                              color="success"
                              onClick={() => handleGenerarForecast(config.id)}
                              disabled={generatingForecastId === config.id}
                              size="small"
                            >
                              {generatingForecastId === config.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <PlayArrowIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              color="primary"
                              onClick={() => handleEditConfig(config)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteConfigClick(config)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Tabla de Pronósticos */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            Pronósticos Generados
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center"><strong>Nombre</strong></TableCell>
                <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Horizonte</strong></TableCell>
                <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Frecuencia</strong></TableCell>
                <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Fecha Generación</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {forecasts
                .filter(forecast => (forecast.moneda || 'ARS') === currency)
                .length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No hay pronósticos generados en {currency === 'ARS' ? 'Pesos' : 'Dólares'}.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                forecasts
                  .filter(forecast => (forecast.moneda || 'ARS') === currency)
                  .map((forecast) => (
                    <TableRow key={forecast.id} hover>
                      <TableCell align="center">{formatearNombre(forecast.nombre, forecast.createdAt, forecast.moneda)}</TableCell>
                      <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>{getHorizonteLabel(forecast.horizonteMeses)}</TableCell>
                      <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>{getFrecuenciaLabel(forecast.mesesFrecuencia)}</TableCell>
                      <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>{formatearFecha(forecast.createdAt)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver pronóstico">
                          <IconButton
                            color="primary"
                            onClick={() => handleVerForecast(forecast.id)}
                            size="small"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        {esAdmin && (
                          <Tooltip title="Eliminar">
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteForecastClick(forecast)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog de confirmación de eliminación de pronóstico */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el pronóstico "{formatearNombre(forecastToDelete?.nombre, forecastToDelete?.createdAt, forecastToDelete?.moneda)}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteForecastConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación de eliminación de configuración */}
      <Dialog open={deleteConfigDialogOpen} onClose={() => setDeleteConfigDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar la configuración "{configToDelete?.nombre}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfigDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteConfigConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
