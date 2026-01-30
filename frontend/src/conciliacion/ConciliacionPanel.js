import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  LinearProgress,
  Pagination,
  useMediaQuery,
  Skeleton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import MovimientoCard from "./components/MovimientoCard";
import DocumentoCard from "./components/DocumentoCard";
import conciliacionApi from "./api/conciliacionApi";
import CurrencyTabs, {
  usePreferredCurrency,
} from "../shared-components/CurrencyTabs";

export default function ConciliacionPanel() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [movimientos, setMovimientos] = useState([]);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSugerencias, setLoadingSugerencias] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);
  const [error, setError] = useState(null);

  // Paginación real del backend
  const [paginaActual, setPaginaActual] = useState(0); // Backend usa 0-based
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalElementos, setTotalElementos] = useState(0);
  const [tamanioPagina, setTamanioPagina] = useState(isMobile ? 1 : 10);
  const [currency, setCurrency] = usePreferredCurrency("ARS");

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("sin-conciliar"); // 'todos', 'sin-conciliar', 'conciliados'
  const [filtroTipo, setFiltroTipo] = useState("todos"); // 'todos', 'Ingreso', 'Egreso'
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [paginaSugerencias, setPaginaSugerencias] = useState(1);
  const documentosPorPagina = 3;

  useEffect(() => {
    setPaginaActual(0);
  }, [filtroEstado, filtroTipo, filtroBusqueda, currency]);

  useEffect(() => {
    const nuevoTamanio = isMobile ? 1 : 10;
    setTamanioPagina(nuevoTamanio);
    setPaginaActual(0);
  }, [isMobile]);

  const cargarMovimientos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (filtroEstado === "sin-conciliar") {
        response = await conciliacionApi.obtenerMovimientosSinConciliar(
          paginaActual,
          tamanioPagina,
          'fechaEmision',
          'desc',
          currency
        );
      } else {
        response = await conciliacionApi.obtenerTodosLosMovimientos(
          paginaActual,
          tamanioPagina,
          'fechaEmision',
          'desc',
          currency
        );
      }

      // El backend devuelve un objeto Page con content, totalPages, totalElements, etc.
      setMovimientos(response.content || []);
      setTotalPaginas(response.totalPages || 0);
      setTotalElementos(response.totalElements || 0);
    } catch (err) {
      console.error("Error cargando movimientos:", err);
      setError("Error al cargar los movimientos");
    } finally {
      setLoading(false);
    }
  }, [currency, filtroEstado, paginaActual, tamanioPagina]);

  const cargarEstadisticas = useCallback(async () => {
    setLoadingEstadisticas(true);
    try {
      const stats = await conciliacionApi.obtenerEstadisticas(currency);
      setEstadisticas(stats);
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
    } finally {
      setLoadingEstadisticas(false);
    }
  }, [currency]);

  const cargarDatos = useCallback(async () => {
    await Promise.all([cargarMovimientos(), cargarEstadisticas()]);
  }, [cargarMovimientos, cargarEstadisticas]);

  // Cargar movimientos y estadísticas al montar el componente
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Recargar cuando cambia el filtro de estado
  useEffect(() => {
    cargarMovimientos();
  }, [cargarMovimientos]);

  const cargarSugerencias = async (movimientoId) => {
    setLoadingSugerencias(true);
    try {
      const response = await conciliacionApi.obtenerSugerencias(movimientoId, currency);
      setSugerencias(response.sugerencias || []);
      setPaginaSugerencias(1);
    } catch (err) {
      console.error("Error cargando sugerencias:", err);
      setSugerencias([]);
      setPaginaSugerencias(1);
    } finally {
      setLoadingSugerencias(false);
    }
  };

  const handleSeleccionarMovimiento = (movimiento) => {
    setMovimientoSeleccionado(movimiento);
    setPaginaSugerencias(1);
    if (!movimiento.conciliado) {
      cargarSugerencias(movimiento.id);
    } else {
      setSugerencias([]);
      setPaginaSugerencias(1);
    }
  };

  const handleVincular = async (documentoId) => {
    if (!movimientoSeleccionado) return;

    try {
      await conciliacionApi.vincularMovimiento(
        movimientoSeleccionado.id,
        documentoId
      );

      // Recargar datos
      await cargarDatos();

      // Actualizar el movimiento seleccionado
      const movimientoActualizado = movimientos.find(
        (m) => m.id === movimientoSeleccionado.id
      );
      if (movimientoActualizado) {
        setMovimientoSeleccionado({
          ...movimientoActualizado,
          conciliado: true,
        });
      }

      // Limpiar sugerencias
      setSugerencias([]);

      // Deseleccionar movimiento
      setMovimientoSeleccionado(null);
    } catch (err) {
      console.error("Error vinculando movimiento:", err);
      alert("Error al vincular el movimiento");
    }
  };

  const handleDesvincular = async (movimientoId) => {
    try {
      await conciliacionApi.desvincularMovimiento(movimientoId);

      // Recargar datos
      await cargarDatos();

      // Si es el movimiento seleccionado, actualizarlo
      if (movimientoSeleccionado?.id === movimientoId) {
        setMovimientoSeleccionado(null);
        setSugerencias([]);
        setPaginaSugerencias(1);
      }
    } catch (err) {
      console.error("Error desvinculando movimiento:", err);
      alert("Error al desvincular el movimiento");
    }
  };

  // Paginación de sugerencias (solo local, ya que son pocas)
  const totalPaginasSugerencias = Math.max(
    1,
    Math.ceil(sugerencias.length / documentosPorPagina)
  );

  useEffect(() => {
    if (paginaSugerencias > totalPaginasSugerencias) {
      setPaginaSugerencias(totalPaginasSugerencias || 1);
    }
  }, [paginaSugerencias, totalPaginasSugerencias]);

  useEffect(() => {
    setPaginaSugerencias(1);
  }, [documentosPorPagina]);

  const paginaSugerenciasActiva = Math.min(
    paginaSugerencias,
    totalPaginasSugerencias
  );

  const sugerenciasPaginadas = sugerencias.slice(
    (paginaSugerenciasActiva - 1) * documentosPorPagina,
    paginaSugerenciasActiva * documentosPorPagina
  );

  // Handler para cambio de página
  const handleCambioPagina = (event, nuevaPagina) => {
    setPaginaActual(nuevaPagina - 1); // Convertir a 0-based para el backend
  };

  const handleCurrencyChange = (next) => {
    if (!next) return;
    setCurrency(next);
    setMovimientoSeleccionado(null);
    setSugerencias([]);
    setPaginaActual(0);
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: { sm: "100%", md: "1700px" },
        mx: "auto",
        px: { xs: 2, md: 3 },
        pt: { xs: 1.5, md: 2 },
        pb: 3,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <CurrencyTabs value={currency} onChange={handleCurrencyChange} sx={{ justifyContent: "center", mb: 1.5 }} />
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 600, color: 'text.primary' }}
        >
          Conciliación de Movimientos
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          Vincula tus movimientos bancarios con documentos comerciales
        </Typography>
      </Box>

      {/* Estadísticas */}
      {(estadisticas || loadingEstadisticas) && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: (theme) =>
              (theme.vars || theme).palette.background.level1 ??
              (theme.vars || theme).palette.background.paper,
            border: (theme) =>
              `1px solid ${(theme.vars || theme).palette.divider}`,
            minHeight: isMobile ? 120 : 80, // Mantener altura mínima para evitar saltos
          }}
        >
          {loadingEstadisticas ? (
            isMobile ? (
              <Grid container spacing={2}>
                {[1, 2, 3, 4].map((i) => (
                  <Grid key={i} size={6}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                      <Skeleton width={40} height={15} />
                      <Skeleton width={60} height={30} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Stack direction="row" spacing={3} alignItems="center">
                {[1, 2, 3, 4].map((i) => (
                  <React.Fragment key={i}>
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="60%" height={15} sx={{ mb: 0.5 }} />
                      <Skeleton width="40%" height={30} />
                    </Box>
                    {i < 4 && <Divider orientation="vertical" flexItem />}
                  </React.Fragment>
                ))}
              </Stack>
            )
          ) : isMobile ? (
            <Grid container spacing={2}>
              <Grid size={6}>
                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  <Typography variant="caption" color="text.primary">
                    Total
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {estadisticas?.total}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={6}>
                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  <Typography variant="caption" color="text.primary">
                    Sin conciliar
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: (theme) => (theme.vars || theme).palette.warning.main,
                    }}
                  >
                    {estadisticas?.sinConciliar}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={6}>
                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  <Typography variant="caption" color="text.primary">
                    Conciliados
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: (theme) => (theme.vars || theme).palette.success.main,
                    }}
                  >
                    {estadisticas?.conciliados}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={6}>
                <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", gap: 1 }}>
                  <Typography variant="caption" color="text.primary">
                    Progreso
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "60%" }}>
                    <LinearProgress
                      variant="determinate"
                      value={estadisticas?.porcentajeConciliado || 0}
                      sx={{ flex: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {Math.round(estadisticas?.porcentajeConciliado || 0)}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Stack direction="row" spacing={3} alignItems="center">
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.primary">
                  Total de movimientos
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {estadisticas?.total}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.primary">
                  Sin conciliar
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color: (theme) => (theme.vars || theme).palette.warning.main,
                  }}
                >
                  {estadisticas?.sinConciliar}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.primary">
                  Conciliados
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color: (theme) => (theme.vars || theme).palette.success.main,
                  }}
                >
                  {estadisticas?.conciliados}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.primary">
                  Progreso
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={estadisticas?.porcentajeConciliado || 0}
                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {Math.round(estadisticas?.porcentajeConciliado || 0)}%
                  </Typography>
                </Box>
              </Box>
            </Stack>
          )}
        </Paper>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}
        >
          {/* Filtro de estado */}
          {isMobile ? (
            <FormControl size="small" sx={{ minWidth: 150, flex: "1 1 auto" }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtroEstado}
                label="Estado"
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <MenuItem value="sin-conciliar">
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PendingIcon sx={{ mr: 1, fontSize: 18 }} />
                    Sin conciliar
                  </Box>
                </MenuItem>
                <MenuItem value="conciliados">
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CheckCircleIcon sx={{ mr: 1, fontSize: 18 }} />
                    Conciliados
                  </Box>
                </MenuItem>
                <MenuItem value="todos">Todos</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <ToggleButtonGroup
              value={filtroEstado}
              exclusive
              onChange={(e, value) => value && setFiltroEstado(value)}
              size="small"
              fullWidth
            >
              <ToggleButton value="sin-conciliar">
                <PendingIcon sx={{ mr: 0.5, fontSize: 18 }} />
                Sin conciliar
              </ToggleButton>
              <ToggleButton value="conciliados">
                <CheckCircleIcon sx={{ mr: 0.5, fontSize: 18 }} />
                Conciliados
              </ToggleButton>
              <ToggleButton value="todos">Todos</ToggleButton>
            </ToggleButtonGroup>
          )}

          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", md: "block" } }}
          />

          {/* Filtro de tipo */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              label="Tipo"
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="Ingreso">Ingreso</MenuItem>
              <MenuItem value="Egreso">Egreso</MenuItem>
            </Select>
          </FormControl>

          {/* Búsqueda */}
          <TextField
            size="small"
            placeholder="Buscar..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 200 }}
          />

          {/* Botón recargar */}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={cargarDatos}
            size="small"
            sx={{ minWidth: "fit-content", whiteSpace: "nowrap" }}
          >
            Recargar
          </Button>
        </Stack>

        {/* Contador de resultados */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.primary">
            Mostrando {movimientos.length} de{" "}
            {totalElementos} movimientos (página{" "}
            {paginaActual + 1}/{totalPaginas})
          </Typography>
        </Box>
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Panel de dos columnas */}
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          maxWidth: 1200,
          width: "100%",
          mx: "auto",
        }}
      >
        <Grid
          container
          spacing={2}
          sx={{
            height: "100%",
            flexWrap: { xs: "wrap", md: "nowrap" }, // evita que la columna de sugeridos baje en escritorio
            alignItems: "stretch",
          }}
        >
          {/* Columna izquierda: Movimientos */}
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              height: "100%",
              minWidth: 0,
              flexBasis: { md: "50%" },
              maxWidth: { md: "50%" },
            }}
          >
            <Paper
              sx={{
                p: 2,
                height: "100%",
                minHeight: { xs: 160, sm: 180, md: 210 },
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Movimientos
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {loading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : movimientos.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay movimientos que coincidan con los filtros
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ flex: 1, overflow: "auto", pr: 1 }}>
                    {movimientos.map((mov) => (
                      <MovimientoCard
                        key={mov.id}
                        movimiento={mov}
                        selected={movimientoSeleccionado?.id === mov.id}
                        onClick={() => handleSeleccionarMovimiento(mov)}
                        onDesvincular={handleDesvincular}
                      />
                    ))}
                  </Box>
                  {totalPaginas > 1 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        mt: 2,
                      }}
                    >
                      <Pagination
                        count={totalPaginas}
                        page={paginaActual + 1}
                        onChange={handleCambioPagina}
                        color="primary"
                        size="small"
                      />
                    </Box>
                  )}
                </>
              )}
            </Paper>
          </Grid>

          {/* Columna derecha: Sugerencias */}
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              height: "100%",
              minWidth: 0,
              flexBasis: { md: "50%" },
              maxWidth: { md: "50%" },
            }}
          >
            <Paper
              sx={{
                p: 2,
                height: "100%",
                minHeight: { xs: 160, sm: 180, md: 210 },
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
              }}
            >
              <Typography variant="h6" gutterBottom>
                💡 Documentos Sugeridos
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {!movimientoSeleccionado ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="text.primary">
                    Selecciona un movimiento de la izquierda para ver
                    sugerencias de documentos
                  </Typography>
                </Box>
              ) : movimientoSeleccionado.conciliado ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <CheckCircleIcon
                    sx={{ fontSize: 64, color: "#4caf50", mb: 2 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    Movimiento ya conciliado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Este movimiento ya está vinculado con{" "}
                    <strong>
                      {movimientoSeleccionado.tipoDocumentoConciliado}{" "}
                      {movimientoSeleccionado.numeroDocumentoConciliado}
                    </strong>
                  </Typography>
                </Box>
              ) : loadingSugerencias ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : sugerencias.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron documentos sugeridos para este movimiento
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Puedes buscar manualmente un documento o crear uno nuevo
                  </Typography>
                </Box>
              ) : (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Se encontraron <strong>{sugerencias.length}</strong>{" "}
                    documento(s) que podrían corresponder a este movimiento
                  </Alert>
                  <Box sx={{ flex: 1, overflow: "auto", pr: 1 }}>
                    {sugerenciasPaginadas.map((doc) => (
                      <DocumentoCard
                        key={doc.idDocumento}
                        documento={doc}
                        onVincular={handleVincular}
                      />
                    ))}
                  </Box>
                  {totalPaginasSugerencias > 1 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        mt: 2,
                      }}
                    >
                      <Pagination
                        count={totalPaginasSugerencias}
                        page={paginaSugerenciasActiva}
                        onChange={(_, value) => setPaginaSugerencias(value)}
                        color="primary"
                        size="small"
                      />
                    </Box>
                  )}
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
