import * as React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import API_CONFIG from '../../config/api-config';
import http from '../../api/http';
import { useChatbotScreenContext } from '../../shared-components/useChatbotScreenContext';
import usePermisos from '../../hooks/usePermisos';

export default function CrearForecastConfig() {
  const { id } = useParams(); // Si existe, estamos editando
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [loadingData, setLoadingData] = React.useState(!!id);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);

  const [formData, setFormData] = React.useState({
    nombre: '',
    horizonteMeses: 6,
    mesesFrecuencia: 6
  });

  const { tienePermiso } = usePermisos();
  const canEdit = tienePermiso('pron', 'edit');

  React.useEffect(() => {
    if (!canEdit) {
      setError('No tenés permisos para editar configuraciones de pronóstico.');
      setTimeout(() => navigate('/pronostico-fijo'), 3000);
      return;
    }
    if (id) {
      cargarConfiguracion();
    }
  }, [id, canEdit, navigate]);

  const cargarConfiguracion = async () => {
    setLoadingData(true);
    try {
      const response = await http.get(`${API_CONFIG.PRONOSTICO}/api/forecast-config/${id}`);
      setFormData({
        nombre: response.data.nombre || '',
        horizonteMeses: response.data.horizonteMeses || 6,
        mesesFrecuencia: response.data.mesesFrecuencia || 6
      });
    } catch (err) {
      console.error('Error cargando configuración:', err);
      setError(err.response?.data?.message || 'Error al cargar la configuración.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validaciones
    if (!formData.nombre || formData.nombre.trim() === '') {
      setError('El nombre es requerido');
      setLoading(false);
      return;
    }

    if (formData.horizonteMeses <= 0 || formData.mesesFrecuencia <= 0) {
      setError('El horizonte y la frecuencia deben ser mayores a 0');
      setLoading(false);
      return;
    }

    try {
      if (id) {
        // Actualizar
        await http.put(`${API_CONFIG.PRONOSTICO}/api/forecast-config/${id}`, formData);
        setSuccess('Configuración actualizada exitosamente');
        setTimeout(() => {
          navigate('/pronostico-fijo');
        }, 1500);
      } else {
        // Crear
        await http.post(`${API_CONFIG.PRONOSTICO}/api/forecast-config`, formData);
        setSuccess('Configuración creada exitosamente');
        setTimeout(() => {
          navigate('/pronostico-fijo');
        }, 1500);
      }
    } catch (err) {
      console.error('Error guardando configuración:', err);
      setError(err.response?.data?.message || 'Error al guardar la configuración. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/pronostico-fijo');
  };

  const chatbotContext = React.useMemo(
    () => ({
      screen: "configuracion-pronostico",
      mode: id ? "editar" : "nuevo",
      loading,
      loadingData,
      error,
      success,
      formData: {
        nombre: formData.nombre,
        horizonteMeses: formData.horizonteMeses,
        mesesFrecuencia: formData.mesesFrecuencia,
      },
    }),
    [id, loading, loadingData, error, success, formData]
  );

  useChatbotScreenContext(chatbotContext);

  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const mesesOptions = Array.from({ length: 24 }, (_, i) => i + 1);

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        {id ? 'Editar Configuración' : 'Nueva Configuración de Pronóstico'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nombre de la Configuración"
            value={formData.nombre}
            onChange={handleChange('nombre')}
            margin="normal"
            required
            helperText="Ej: Pronóstico Semestral"
          />

          <TextField
            fullWidth
            select
            label="Frecuencia de Generación"
            value={formData.mesesFrecuencia}
            onChange={handleChange('mesesFrecuencia')}
            margin="normal"
            required
            helperText="Cada cuántos meses se generará el pronóstico automáticamente"
          >
            {mesesOptions.map((mes) => (
              <MenuItem key={mes} value={mes}>
                Cada {mes} {mes === 1 ? 'mes' : 'meses'}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            label="Horizonte de Pronóstico"
            value={formData.horizonteMeses}
            onChange={handleChange('horizonteMeses')}
            margin="normal"
            required
            helperText="Cantidad de meses a pronosticar hacia adelante"
          >
            {mesesOptions.map((mes) => (
              <MenuItem key={mes} value={mes}>
                {mes} {mes === 1 ? 'mes' : 'meses'}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : id ? 'Actualizar' : 'Crear'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
