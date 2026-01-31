import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import { formatCurrencyByCode, formatPercentage } from "../../utils/formatters";
import useResolvedColorTokens from "../useResolvedColorTokens";
import API_CONFIG from "../../config/api-config";
import { matchesCurrencyFilter } from "../../pronostico/presupuesto/utils/currencyTag";

const getStatusColor = (ratio) => {
  if (ratio <= 0.9) {
    return { color: "primary", label: "En verde" };
  }
  if (ratio <= 1.1) {
    return { color: "primary", label: "Cerca del objetivo" };
  }
  return { color: "primary", label: "Sobre el plan" };
};

const monthLabels = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const formatMonthLabel = (value) => {
  if (!value) return "";
  const parts = String(value).split("-");
  if (parts.length < 2) {
    return value;
  }
  const year = Number(parts[0]);
  const monthIndex = Number(parts[1]) - 1;
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(monthIndex) ||
    monthIndex < 0 ||
    monthIndex >= monthLabels.length
  ) {
    return value;
  }
  return `${monthLabels[monthIndex]} ${year}`;
};

const formatDateRange = (from, to) => {
  const startLabel = formatMonthLabel(from);
  const endLabel = formatMonthLabel(to);
  if (startLabel && endLabel) {
    return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
  }
  return startLabel || endLabel || "";
};

const toSlug = (name) =>
  encodeURIComponent(
    String(name ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-"),
  );

const parseYearMonthStart = (value) => {
  if (!value) return null;
  const parts = String(value).split("-");
  if (parts.length < 2) {
    return null;
  }
  const year = Number(parts[0]);
  const monthIndex = Number(parts[1]) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return null;
  }
  return new Date(year, monthIndex, 1);
};

const parseYearMonthEnd = (value) => {
  const start = parseYearMonthStart(value);
  if (!start) return null;
  return new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
};

const isBudgetActiveOnDate = (budget, reference) => {
  if (!budget) return false;
  const from = parseYearMonthStart(budget.desde);
  const to = parseYearMonthEnd(budget.hasta);
  if (!from || !to) {
    return false;
  }
  return from <= reference && reference <= to;
};

const valueToNumber = (value) => {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object" && value !== null && "value" in value) {
    const nested = Number(value.value);
    return Number.isNaN(nested) ? 0 : nested;
  }
  return 0;
};

const aggregateTotals = (items) =>
  items.reduce(
    (acc, item) => ({
      ingresoEstimado: acc.ingresoEstimado + valueToNumber(item.ingresoEstimado),
      ingresoReal: acc.ingresoReal + valueToNumber(item.ingresoReal),
      egresoEstimado: acc.egresoEstimado + valueToNumber(item.egresoEstimado),
      egresoReal: acc.egresoReal + valueToNumber(item.egresoReal),
      saldoEstimado: acc.saldoEstimado + valueToNumber(item.saldoEstimado),
      saldoReal: acc.saldoReal + valueToNumber(item.saldoReal),
    }),
    {
      ingresoEstimado: 0,
      ingresoReal: 0,
      egresoEstimado: 0,
      egresoReal: 0,
      saldoEstimado: 0,
      saldoReal: 0,
    },
  );

const buildCategories = (totals) => {
  if (!totals) {
    return [];
  }
  const categories = [
    {
      name: "Ingresos",
      planned: totals.ingresoEstimado,
      actual: totals.ingresoReal,
    },
    {
      name: "Egresos",
      planned: totals.egresoEstimado,
      actual: totals.egresoReal,
    },
  ];
  if (
    Math.abs(totals.saldoEstimado) > 0 ||
    Math.abs(totals.saldoReal) > 0
  ) {
    categories.push({
      name: "Resultado",
      planned: totals.saldoEstimado,
      actual: totals.saldoReal,
    });
  }
  return categories;
};

const extractBudgetList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.content)) {
    return payload.content;
  }
  return [];
};

const normalizeError = (err) => {
  if (!err) return null;
  if (typeof err === "string") {
    return err;
  }
  if (err?.response?.data?.error) {
    return String(err.response.data.error);
  }
  if (err?.message) {
    return err.message;
  }
  return "No pudimos cargar el presupuesto actual.";
};

const transformMockBudget = (mock) => {
  if (!mock) {
    return null;
  }
  const slug = mock.slug
    ? encodeURIComponent(String(mock.slug))
    : toSlug(mock.name || mock.nombre || "");
  return {
    id: mock.id ?? null,
    nombre: mock.name || mock.nombre || "Presupuesto",
    slug,
    desde: mock.desde ?? null,
    hasta: mock.hasta ?? null,
    rangeLabel:
      mock.period?.label ||
      formatDateRange(mock.desde ?? null, mock.hasta ?? null),
    categories: Array.isArray(mock.categories) ? mock.categories : [],
    totals: null,
  };
};

const periodToDate = (value) => {
  if (!value) return null;
  const parts = String(value).split("-");
  if (parts.length < 2) {
    return null;
  }
  const year = Number(parts[0]);
  const monthIndex = Number(parts[1]) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return null;
  }
  return new Date(year, monthIndex, 15);
};

const BudgetWidget = ({
  companyId,
  period,
  data,
  loading: externalLoading = false,
  error: externalError = null,
  onRetry,
  currency = "ARS",
}) => {
  const navigate = useNavigate();
  const { resolvedMode, primaryTextColor, secondaryTextColor } = useResolvedColorTokens();
  const isDarkMode = resolvedMode === "dark";
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [budget, setBudget] = React.useState(null);
  const useMocks = process.env.REACT_APP_USE_MOCKS === "true";
  const baseURL = API_CONFIG.PRONOSTICO;
  const usuarioSub = sessionStorage.getItem("sub");
  const referenceDate = React.useMemo(
    () => periodToDate(period) ?? new Date(),
    [period],
  );

  const loadBudgetData = React.useCallback(async () => {
    if (useMocks) {
      if (externalLoading && !data) {
        setLoading(true);
        setError(null);
        setBudget(null);
        return;
      }
      setBudget(transformMockBudget(data));
      setError(externalError ? normalizeError(externalError) : null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("status", "active");
      params.set("page", "0");
      params.set("size", "100");
      params.set("sort", "createdAt,desc");
      if (currency) params.set("moneda", currency);
      const response = await http.get(
        `${baseURL}/api/presupuestos?${params.toString()}`,
        {
          headers: {
            "X-Usuario-Sub": usuarioSub
          }
        }
      );
      const list = extractBudgetList(response?.data).filter((item) =>
        matchesCurrencyFilter(item?.nombre, currency)
      );
      const vigente = list.find((item) =>
        isBudgetActiveOnDate(item, referenceDate),
      );
      if (!vigente) {
        setBudget(null);
        return;
      }
      const totalsResponse = await http.get(
        `${baseURL}/api/presupuestos/${vigente.id}/totales`,
        {
          headers: {
            "X-Usuario-Sub": usuarioSub
          }
        }
      );
      const totales = Array.isArray(totalsResponse?.data)
        ? totalsResponse.data
        : [];
      const aggregated = aggregateTotals(totales);
      setBudget({
        id: vigente.id,
        nombre: vigente.nombre,
        slug: toSlug(vigente.nombre),
        desde: vigente.desde,
        hasta: vigente.hasta,
        rangeLabel: formatDateRange(vigente.desde, vigente.hasta),
        categories: buildCategories(aggregated),
        totals: aggregated,
      });
    } catch (err) {
      setError(normalizeError(err));
      setBudget(null);
    } finally {
      setLoading(false);
    }
  }, [
    useMocks,
    externalLoading,
    data,
    externalError,
    baseURL,
    referenceDate,
    currency,
  ]);

  React.useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  const handleRetry = React.useCallback(() => {
    if (useMocks && typeof onRetry === "function") {
      onRetry();
      return;
    }
    loadBudgetData();
  }, [useMocks, onRetry, loadBudgetData]);

  const goToList = React.useCallback(() => {
    navigate("/presupuestos");
  }, [navigate]);

  const goToNew = React.useCallback(() => {
    navigate("/presupuestos/nuevo");
  }, [navigate]);

  const goToDetail = React.useCallback(() => {
    if (!budget?.slug) {
      return;
    }
    navigate(`/presupuestos/${budget.slug}`);
  }, [navigate, budget]);

  if (loading) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader
          title="Presupuesto actual"
          subheader="Cargando datos..."
          titleTypographyProps={{
            variant: "h6",
            sx: { color: primaryTextColor },
          }}
          subheaderTypographyProps={{
            variant: "body2",
            sx: { color: secondaryTextColor },
          }}
        />
        <CardContent>
          {Array.from({ length: 4 }).map((_, index) => (
            <Stack
              key={index}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1.5 }}
            >
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="20%" />
            </Stack>
          ))}
          <Skeleton variant="rectangular" height={8} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader
          title="Presupuesto actual"
          titleTypographyProps={{ variant: "h6", sx: { color: primaryTextColor } }}
        />
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Alert severity="error">{error}</Alert>
          {handleRetry ? (
            <Button variant="outlined" onClick={handleRetry}>
              Reintentar
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const categories = budget?.categories ?? [];
  const subheader = budget
    ? [budget.nombre, budget.rangeLabel].filter(Boolean).join(" - ")
    : undefined;

  return (
    <Card
      variant="outlined"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardHeader
        title="Presupuesto actual"
        subheader={subheader}
        titleTypographyProps={{ variant: "h6", sx: { color: primaryTextColor } }}
        subheaderTypographyProps={{ variant: "body2", sx: { color: primaryTextColor } }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        {budget ? (
          <Stack spacing={2}>
            {budget.totals ? (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.primary">
                  Saldo estimado:{" "}
                  {formatCurrencyByCode(budget.totals.saldoEstimado, currency)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.primary"
                  fontWeight={600}
                >
                  Saldo real: {formatCurrencyByCode(budget.totals.saldoReal, currency)}
                </Typography>
              </Stack>
            ) : null}
            {categories.length > 0 ? (
              categories.map((item) => {
                const planned = Number(item.planned) || 0;
                const actual = Number(item.actual) || 0;
                const ratio = planned === 0 ? 0 : actual / planned;
                const status = getStatusColor(ratio);
                const rawPercentage =
                  planned === 0 ? 0 : (actual / planned) * 100;
                const limitedProgress = Math.min(rawPercentage, 150);
                const progress =
                  limitedProgress > 100
                    ? 100
                    : Math.max(0, limitedProgress);

                return (
                  <Box
                    key={item.name}
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        {item.name}
                      </Typography>
                      <Chip
                        color={status.color}
                        label={`${formatPercentage(rawPercentage, {
                          fractionDigits: 0,
                        })} - ${status.label}`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      color={status.color}
                      sx={{
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: "action.hover",
                        [`& .MuiLinearProgress-bar`]: {
                          borderRadius: 999,
                        },
                      }}
                    />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.primary">
                        Planificado: {formatCurrencyByCode(planned, currency)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        fontWeight={600}
                      >
                        Ejecutado: {formatCurrencyByCode(actual, currency)}
                      </Typography>
                    </Stack>
                    <Divider sx={{ my: 0.5 }} />
                  </Box>
                );
              })
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay datos cargados para este presupuesto.
              </Typography>
            )}
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              No hay presupuesto actual.
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={goToNew}
                sx={{
                  lineHeight: 1.2,
                  ...(isDarkMode && { color: "#42897f" }),
                }}
              >
                Nuevo presupuesto
              </Button>
              <Button variant="text" onClick={goToList} sx={{ lineHeight: 1.2 }}>
                Ver presupuestos
              </Button>
            </Stack>
          </Stack>
        )}
      </CardContent>
      {budget ? (
        <CardActions sx={{ justifyContent: "flex-end", px: 3, pb: 2 }}>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={goToDetail}
              disabled={!budget?.slug}
              sx={{ lineHeight: 1.2 }}
            >
              Ver más
            </Button>
            <Button
              variant="outlined"
              onClick={goToNew}
              sx={{
                lineHeight: 1.2,
                ...(isDarkMode && { color: "#42897f" }),
              }}
            >
              Nuevo presupuesto
            </Button>
            <Button variant="text" onClick={goToList} sx={{ lineHeight: 1.2 }}>
              Ver presupuestos
            </Button>
          </Stack>
        </CardActions>
      ) : null}
    </Card>
  );
};

export default BudgetWidget;
