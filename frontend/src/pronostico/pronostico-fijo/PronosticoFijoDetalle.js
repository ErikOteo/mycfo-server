import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Button,
  FormControl,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme
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
import CurrencyTabs, { usePreferredCurrency } from '../../shared-components/CurrencyTabs';
import { useChatbotScreenContext } from '../../shared-components/useChatbotScreenContext';

export default function PronosticoFijoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currency, setCurrency] = usePreferredCurrency("ARS");
  const [loading, setLoading] = React.useState(true);
  const [forecast, setForecast] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [viewMode, setViewMode] = React.useState('todos'); // 'todos', 'ingresos', 'egresos', 'balance'

  React.useEffect(() => {
    cargarForecast();
  }, [id]); // Removido currency de dependencias para evitar recargas innecesarias si es fijo

  const cargarForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargamos el forecast. El endpoint ignora el query param moneda si es fijo, pero lo dejamos por consistencia
      const response = await http.get(`${API_CONFIG.PRONOSTICO}/api/forecasts/${id}`);
      setForecast(response.data);

      // Si el forecast tiene moneda fija, forzamos esa moneda
      if (response.data.moneda) {
        setCurrency(response.data.moneda);
      }
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

  const chartSummary = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    const realCount = chartData.filter((item) => item.tipo === 'real').length;
    return {
      meses: chartData.length,
      rango: {
        desde: first.mes,
        hasta: last.mes,
      },
      reales: realCount,
      estimados: chartData.length - realCount,
      ultimo: {
        mes: last.mes,
        tipo: last.tipo,
        ingresos: last.ingresos,
        egresos: last.egresos,
        balance: last.balance,
      },
    };
  }, [chartData]);

  const chatbotContext = React.useMemo(
    () => ({
      screen: "pronostico-fijo-detalle",
      forecastId: id,
      currency,
      loading,
      error,
      viewMode,
      forecast: forecast
        ? {
            id: forecast.id,
            nombre: forecast.nombre,
            horizonteMeses: forecast.horizonteMeses,
            mesesFrecuencia: forecast.mesesFrecuencia,
            periodosAnalizados: forecast.periodosAnalizados,
            createdAt: forecast.createdAt,
            mesInicioPronostico: forecast.mesInicioPronostico,
            mesFinPronostico: forecast.mesFinPronostico,
            moneda: forecast.moneda,
          }
        : null,
      resumen: chartSummary,
    }),
    [id, currency, loading, error, viewMode, forecast, chartSummary]
  );

  useChatbotScreenContext(chatbotContext);

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

  const splitPointMes = getSplitPointMes();
  const firstMes = chartData && chartData.length > 0 ? chartData[0].mes : null;

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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <CurrencyTabs
              value={currency}
              onChange={setCurrency}
              sx={{ mb: 0 }}
              disabled={!!forecast?.moneda} // Determina si se deshabilita
            />
            <Typography variant="h6" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
              Visualización
            </Typography>

            {isMobile ? (
              <FormControl size="small" sx={{ minWidth: 100, flexGrow: 1 }}>
                <Select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="ingresos">Solo Ingresos</MenuItem>
                  <MenuItem value="egresos">Solo Egresos</MenuItem>
                  <MenuItem value="balance">Solo Balance</MenuItem>
                </Select>
              </FormControl>
            ) : (
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
            )}
          </Box>

          {/* Gráfico */}
          <ResponsiveContainer width="100%" height={400} minWidth={0}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis width={70} />
              <Tooltip formatter={(value) => `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
              <Legend />
              {splitPointMes && (
                <>
                  {firstMes && firstMes !== splitPointMes && (
                    <ReferenceArea
                      x1={firstMes}
                      x2={splitPointMes}
                      fillOpacity={0}
                      label={{ value: "Datos historicos", position: "insideBottom", fill: "#546e7a" }}
                    />
                  )}
                  <ReferenceLine
                    x={splitPointMes}
                    stroke="#9e9e9e"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    label={{ value: "Estimado", position: "top", fill: "#9e9e9e" }}
                  />
                  <ReferenceArea
                    x1={splitPointMes}
                    fill="#e3f2fd"
                    fillOpacity={0.3}
                    label={{ value: "Datos pronosticados", position: "insideBottom", fill: "#546e7a" }}
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
