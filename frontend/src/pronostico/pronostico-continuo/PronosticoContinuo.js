import * as React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
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

// Opciones de horizonte (en años)
const HORIZONTES = [
  { label: '1 año', value: 12 },
  { label: '2 años', value: 24 },
  { label: '3 años', value: 36 },
  { label: '4 años', value: 48 },
  { label: '5 años', value: 60 }
];

export default function PronosticoContinuo() {
  const [horizonteMeses, setHorizonteMeses] = React.useState(12);
  const [currency, setCurrency] = usePreferredCurrency("ARS");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = React.useState(false);
  const [forecastData, setForecastData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [viewMode, setViewMode] = React.useState('todos'); // 'todos', 'ingresos', 'egresos', 'balance'
  const [hasGenerated, setHasGenerated] = React.useState(false);

  // Limpiar el forecast al cambiar la moneda
  React.useEffect(() => {
    setForecastData(null);
    setHasGenerated(false);
  }, [currency]);

  const handleGenerarForecast = async () => {
    setLoading(true);
    setError(null);
    setHasGenerated(false);

    try {
      const response = await http.post(
        `${API_CONFIG.PRONOSTICO}/api/forecasts/rolling?horizonteMeses=${horizonteMeses}&moneda=${currency}`
      );

      setForecastData(response.data);
      setHasGenerated(true);
    } catch (err) {
      console.error('Error generando forecast:', err);
      setError(err.response?.data?.message || 'Error al generar el forecast. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    // Usar datos_combinados si existe, sino forecast_mensual (retrocompatibilidad)
    const datos = forecastData?.datos_combinados || forecastData?.forecast_mensual;
    if (!datos) return [];

    // Si usamos datos_combinados, ya tienen la estructura correcta
    if (forecastData?.datos_combinados) {
      return datos.map(item => ({
        mes: `${item.mes}/${item.año}`,
        año: item.año,
        mesNum: item.mes,
        ingresos: item.ingresos,
        egresos: item.egresos,
        balance: item.balance,
        tipo: item.tipo // 'real' o 'estimado'
      }));
    }

    // Retrocompatibilidad con forecast_mensual
    return datos.map(item => ({
      mes: `${item.Mes}/${item.Año}`,
      año: item.Año,
      mesNum: item.Mes,
      ingresos: item.Ingresos_Esperados,
      egresos: item.Egresos_Esperados,
      balance: item.Balance_Neto_Esperado
    }));
  };

  const chartData = prepareChartData();

  // Determinar el punto de cambio entre real y estimado
  const getSplitPoint = () => {
    if (!chartData) return -1;
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

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', p: 3 }}>
      <CurrencyTabs value={currency} onChange={setCurrency} sx={{ justifyContent: 'center', mb: 1.5 }} />
      <Typography variant="h4" gutterBottom>
        Pronóstico Continuo (Rolling Forecast)
      </Typography>

      <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
        Generá proyecciones financieras en tiempo real basadas en tu historial
      </Typography>

      {/* Selector de horizonte y botón generar */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>

          <FormControl sx={{ minWidth: 100, flex: { xs: '1 1 100%', sm: '0 1 auto' } }}>
            <InputLabel>Horizonte</InputLabel>
            <Select
              value={horizonteMeses}
              onChange={(e) => setHorizonteMeses(e.target.value)}
              label="Horizonte"
              size="medium"
            >
              {HORIZONTES.map((hor) => (
                <MenuItem key={hor.value} value={hor.value}>
                  {hor.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerarForecast}
            disabled={loading}
            size="large"
            sx={{ height: 56, flex: { xs: '1 1 100%', sm: '0 1 auto' } }}
          >
            {loading ? 'Generando...' : 'Generar Forecast'}
          </Button>
        </Box>
      </Paper>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading spinner */}
      {loading && <LoadingSpinner message="Generando pronóstico... Esto puede tomar unos momentos." />}

      {/* Contenido del forecast - solo mostrar si ya se generó */}
      {hasGenerated && !loading && forecastData && (
        <>
          {/* Controles de visualización del gráfico */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ mr: 3, display: { xs: 'none', sm: 'block' } }}>
                Visualización
              </Typography>

              {isMobile ? (
                <FormControl size="small" sx={{ minWidth: 100, flexGrow: 1, flex: '1 1 100%' }}>
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
                  sx={{ flexWrap: 'wrap' }}
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
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis width={70} />
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
        </>
      )}
    </Box>
  );
}

