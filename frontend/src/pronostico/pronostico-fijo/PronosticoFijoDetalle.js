import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import LoadingSpinner from '../../shared-components/LoadingSpinner';
import API_CONFIG from '../../config/api-config';
import http from '../../api/http';

export default function PronosticoFijoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [forecast, setForecast] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [viewMode, setViewMode] = React.useState('todos'); // 'todos', 'ingresos', 'egresos', 'balance'

  React.useEffect(() => {
    cargarForecast();
  }, [id]);

  const cargarForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await http.get(`${API_CONFIG.PRONOSTICO}/api/forecasts/${id}`);
      setForecast(response.data);
    } catch (err) {
      console.error('Error cargando forecast:', err);
      setError(err.response?.data?.message || 'Error al cargar el pronóstico. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!forecast || !forecast.lineas) return [];

    return forecast.lineas
      .sort((a, b) => {
        // Ordenar por año y luego por mes
        if (a.año !== b.año) return a.año - b.año;
        return a.mes - b.mes;
      })
      .map(linea => ({
        mes: `${linea.mes}/${linea.año}`,
        año: linea.año,
        mesNum: linea.mes,
        tipo: linea.tipo || 'estimado', // 'real' o 'estimado'
        ingresos: parseFloat(linea.ingresosEsperados || 0),
        egresos: parseFloat(linea.egresosEsperados || 0),
        balance: parseFloat(linea.balanceNetoEsperado || 0)
      }));
  };

  const chartData = prepareChartData();

  // Determinar el punto de cambio entre real y estimado
  const getSplitPoint = () => {
    if (!chartData || chartData.length === 0) return -1;
    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i].tipo === 'estimado') {
        return i;
      }
    }
    return -1;
  };

  const getLinesToDisplay = () => {
    const splitPoint = getSplitPoint();
    const hasRealAndEstimated = splitPoint > 0;

    switch (viewMode) {
      case 'ingresos':
        if (hasRealAndEstimated) {
          return (
            <>
              <Line
                dataKey="ingresos"
                stroke="#2e7d32"
                strokeWidth={2}
                name="Ingresos"
                dot={false}
              />
            </>
          );
        }
        return <Line type="monotone" dataKey="ingresos" stroke="#4caf50" strokeWidth={2} name="Ingresos" />;
      case 'egresos':
        if (hasRealAndEstimated) {
          return (
            <>
              <Line
                dataKey="egresos"
                stroke="#c62828"
                strokeWidth={2}
                name="Egresos"
                dot={false}
              />
            </>
          );
        }
        return <Line type="monotone" dataKey="egresos" stroke="#f44336" strokeWidth={2} name="Egresos" />;
      case 'balance':
        if (hasRealAndEstimated) {
          return (
            <>
              <Line
                dataKey="balance"
                stroke="#1565c0"
                strokeWidth={2}
                name="Balance"
                dot={false}
              />
            </>
          );
        }
        return <Line type="monotone" dataKey="balance" stroke="#2196f3" strokeWidth={2} name="Balance" />;
      case 'todos':
      default:
        if (hasRealAndEstimated) {
          return (
            <>
              <Line dataKey="ingresos" stroke="#2e7d32" strokeWidth={2} name="Ingresos" dot={false} />
              <Line dataKey="egresos" stroke="#c62828" strokeWidth={2} name="Egresos" dot={false} />
              <Line dataKey="balance" stroke="#1565c0" strokeWidth={2} name="Balance" dot={false} />
            </>
          );
        }
        return (
          <>
            <Line type="monotone" dataKey="ingresos" stroke="#4caf50" strokeWidth={2} name="Ingresos" />
            <Line type="monotone" dataKey="egresos" stroke="#f44336" strokeWidth={2} name="Egresos" />
            <Line type="monotone" dataKey="balance" stroke="#2196f3" strokeWidth={2} name="Balance" />
          </>
        );
    }
  };

  const getSplitPointMes = () => {
    const splitPoint = getSplitPoint();
    if (splitPoint <= 0) return null;
    return chartData[splitPoint]?.mes;
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/pronostico-fijo')}>
          Volver
        </Button>
      </Box>
    );
  }

  if (!forecast) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">No se encontró el pronóstico solicitado.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/pronostico-fijo')} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/pronostico-fijo')}
          sx={{ mr: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4">
          {forecast.nombre || 'Pronóstico'}
        </Typography>
      </Box>

      {/* Información del pronóstico */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Información del Pronóstico
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mt: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Horizonte
            </Typography>
            <Typography variant="body1">
              {forecast.horizonteMeses} meses
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Frecuencia
            </Typography>
            <Typography variant="body1">
              Cada {forecast.mesesFrecuencia} meses
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Períodos Analizados
            </Typography>
            <Typography variant="body1">
              {forecast.periodosAnalizados} períodos
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Fecha de Generación
            </Typography>
            <Typography variant="body1">
              {formatearFecha(forecast.createdAt)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Período del Pronóstico
            </Typography>
            <Typography variant="body1">
              {forecast.mesInicioPronostico} - {forecast.mesFinPronostico}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Controles de visualización del gráfico */}
      {chartData.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ mr: 3 }}>
              Visualización
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="todos">
                Todos
              </ToggleButton>
              <ToggleButton value="ingresos">
                Solo Ingresos
              </ToggleButton>
              <ToggleButton value="egresos">
                Solo Egresos
              </ToggleButton>
              <ToggleButton value="balance">
                Solo Balance
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Gráfico */}
          <ResponsiveContainer width="100%" height={400} minWidth={0}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              <Legend />
              {getSplitPointMes() && (
                <>
                  <ReferenceLine
                    x={getSplitPointMes()}
                    stroke="#9e9e9e"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    label={{ value: "Estimado", position: "top", fill: "#9e9e9e" }}
                  />
                  <ReferenceArea
                    x1={getSplitPointMes()}
                    fill="#e3f2fd"
                    fillOpacity={0.3}
                  />
                </>
              )}
              {getLinesToDisplay()}
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {chartData.length === 0 && (
        <Alert severity="warning">
          Este pronóstico no tiene datos disponibles.
        </Alert>
      )}
    </Box>
  );
}
