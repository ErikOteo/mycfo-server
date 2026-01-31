import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import useResolvedColorTokens from "../useResolvedColorTokens";
import { formatCurrencyByCode } from "../../utils/formatters";

const numberFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const clampPercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.min(Math.max(numeric, 0), 100);
};

const formatPercent = (value) => `${percentFormatter.format(clampPercent(value))}%`;

const formatDate = (value) => {
  if (!value) {
    return "--";
  }
  return String(value);
};

const ReconciliationWidget = ({
  data,
  loading = false,
  error = null,
  onRetry,
  onNavigate,
  currency = "ARS",
}) => {
  const { resolvedMode } = useResolvedColorTokens();
  const isDarkMode = resolvedMode === "dark";
  const formatAmount = React.useCallback(
    (value) => formatCurrencyByCode(value, currency, { fallback: "--" }),
    [currency]
  );

  if (loading) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader title="Conciliación bancaria" subheader="Sincronizando movimientos..." />
        <CardContent>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={48} sx={{ mb: 1.5 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <CardHeader title="Conciliación bancaria" />
        <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <Alert severity="error">{error}</Alert>
          {onRetry ? (
            <Button variant="outlined" onClick={onRetry}>
              Reintentar
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const summary = data ?? null;
  const progress = clampPercent(summary?.porcentajeConciliados);
  const porTipo = Array.isArray(summary?.porTipo) ? [...summary.porTipo] : [];
  porTipo.sort((a, b) => (Number(b?.total ?? 0) || 0) - (Number(a?.total ?? 0) || 0));

  const conciliadosPercent =
    summary && summary.totalMovimientos
      ? (summary.conciliados * 100) / (summary.totalMovimientos || 1)
      : 0;
  const pendientesPercent =
    summary && summary.totalMovimientos
      ? (summary.pendientes * 100) / (summary.totalMovimientos || 1)
      : 0;

  const renderMetric = (label, value, helper) => (
    <Stack
      key={label}
      spacing={0.5}
      sx={{
        p: 1.25,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: "divider",
        minWidth: 0,
        flex: 1,
      }}
    >
      <Typography variant="caption" color="text.primary">
        {label}
      </Typography>
      <Typography variant="subtitle1" fontWeight={600}>
        {value}
      </Typography>
      {helper ? (
        <Typography variant="caption" color="text.primary">
          {helper}
        </Typography>
      ) : null}
    </Stack>
  );

  return (
    <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        title="Conciliación bancaria"
        subheader={
          summary?.periodLabel ? `Período ${summary.periodLabel}` : "Resumen del último período"
        }
        subheaderTypographyProps={{ color: 'text.primary' }}
      />
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {summary ? (
          <>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ alignItems: { xs: "stretch", sm: "flex-start" } }}
            >
              {renderMetric(
                "Movimientos",
                numberFormatter.format(summary.totalMovimientos ?? 0),
                "Total del período"
              )}
              {renderMetric(
                "Conciliados",
                numberFormatter.format(summary.conciliados ?? 0),
                formatPercent(conciliadosPercent)
              )}
              {renderMetric(
                "Pendientes",
                numberFormatter.format(summary.pendientes ?? 0),
                formatPercent(pendientesPercent)
              )}
            </Stack>

            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 0.75 }}
              >
                <Typography variant="subtitle2">Avance general</Typography>
                <Typography variant="caption" color="text.primary">
                  {formatPercent(progress)}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: "action.hover",
                  [`& .MuiLinearProgress-bar`]: {
                    borderRadius: 999,
                  },
                }}
              />
            </Box>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Últimas referencias</Typography>
              <Typography variant="caption" color="text.primary">
                Última conciliación: {formatDate(summary.ultimaConciliacion)}
              </Typography>
              <Typography variant="caption" color="text.primary">
                Último movimiento pendiente: {formatDate(summary.ultimoPendiente)}
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2">Detalle por tipo</Typography>
              {porTipo.length > 0 ? (
                porTipo.map((item) => {
                  const itemProgress = clampPercent(item?.porcentaje ?? 0);
                  return (
                    <Stack
                      key={item?.tipo ?? "tipo-desconocido"}
                      spacing={0.5}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1.5,
                        p: 1.25,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight={600}>
                          {item?.tipo ?? "Sin tipo"}
                        </Typography>
                        <Typography variant="caption" color="text.primary">
                          {formatPercent(itemProgress)}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={itemProgress}
                        sx={{
                          height: 8,
                          borderRadius: 999,
                          backgroundColor: "action.hover",
                          [`& .MuiLinearProgress-bar`]: {
                            borderRadius: 999,
                          },
                        }}
                      />
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.primary">
                          {numberFormatter.format(item?.conciliados ?? 0)} /{" "}
                          {numberFormatter.format(item?.total ?? 0)} conciliados
                        </Typography>
                        {(item?.montoTotal !== undefined && item?.montoTotal !== null) && (
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{
                              color: (item.tipo === "Egreso" || item.montoTotal < 0) ? "error.main" : "success.main"
                            }}
                          >
                            {formatAmount(item.montoTotal)}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  );
                })
              ) : (
                <Typography variant="caption" color="text.primary">
                  No hay movimientos clasificados por tipo en este período.
                </Typography>
              )}
            </Stack>
          </>
        ) : (
          <Stack spacing={2} alignItems="flex-start">
            <Typography variant="body2" color="text.primary">
              Todavía no hay movimientos que analizar en este período. Carga o importa operaciones
              para comenzar a conciliarlas.
            </Typography>
            {onRetry ? (
              <Button variant="outlined" onClick={onRetry}>
                Actualizar
              </Button>
            ) : null}
          </Stack>
        )}
      </CardContent>
      <CardActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="outlined"
          onClick={() => onNavigate?.()}
          disabled={!onNavigate}
          sx={{
            lineHeight: 1.2,
            ...(isDarkMode && { color: "#42897f" }),
          }}
        >
          Ir a conciliación
        </Button>
      </CardActions>
    </Card>
  );
};

export default ReconciliationWidget;
