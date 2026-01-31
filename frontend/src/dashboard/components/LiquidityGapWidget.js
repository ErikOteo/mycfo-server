import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import API_CONFIG from "../../config/api-config";
import http from "../../api/http";
import useResolvedColorTokens from "../useResolvedColorTokens";

const formatCurrency = (value, currencyCode) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currencyCode || "ARS",
  }).format(value || 0);

export default function LiquidityGapWidget({ currency = "ARS" }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);
  const { primaryTextColor, secondaryTextColor } = useResolvedColorTokens();

  React.useEffect(() => {
    const baseUrl = API_CONFIG.REPORTE;
    if (!baseUrl) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1..12

    setLoading(true);
    setError(null);

    const fetchCash = http
      .get(`${baseUrl}/cashflow`, {
        params: {
          anio: year,
          ...(currency ? { moneda: currency } : {}),
        },
      })
      .then(({ data: arr }) => {
        const registros = Array.isArray(arr) ? arr : [];
        const ingresos = registros.filter(r => r.tipo === 'Ingreso' && new Date(r.fechaEmision).getMonth() + 1 === month)
          .reduce((a, r) => a + (r.montoTotal || 0), 0);
        const egresos = registros.filter(r => r.tipo === 'Egreso' && new Date(r.fechaEmision).getMonth() + 1 === month)
          .reduce((a, r) => a + (r.montoTotal || 0), 0);
        return { ingresos, egresos };
      });

    const fetchAccrual = http
      .get(`${baseUrl}/pyl`, {
        params: {
          anio: year,
          ...(currency ? { moneda: currency } : {}),
        },
      })
      .then(({ data: json }) => {
        const idx = month - 1;
        const ingresos = (json?.ingresosMensuales ?? [])[idx] || 0;
        const egresos = (json?.egresosMensuales ?? [])[idx] || 0;
        return { ingresos, egresos };
      });

    Promise.all([fetchCash, fetchAccrual])
      .then(([cash, accrual]) => {
        const dataset = [
          {
            name: 'Ingresos',
            Reales: cash.ingresos,
            Devengado: accrual.ingresos,
          },
          {
            name: 'Egresos',
            Reales: cash.egresos,
            Devengado: accrual.egresos,
          },
        ];
        setData({ dataset, cash, accrual });
      })
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }, [currency]);

  return (
    <Card variant="outlined" sx={{ height: "100%", display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Caja vs Devengado (último mes)"
        subheader="Comparativo de ingresos y egresos para detectar gaps"
        titleTypographyProps={{
          variant: "h6",
          sx: { color: primaryTextColor },
        }}
        subheaderTypographyProps={{
          variant: "body2",
          sx: { color: primaryTextColor },
        }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        {loading ? (
          <Skeleton variant="rectangular" height={220} />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : data ? (
          <>
            <ResponsiveContainer width="100%" height={240} minWidth={0} minHeight={240}>
              <BarChart data={data.dataset} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                <Legend />
                <Bar dataKey="Reales" fill="#2e7d32" />
                <Bar dataKey="Devengado" fill="#0288d1" />
              </BarChart>
            </ResponsiveContainer>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap">
              <ChipLike label="Gap Ingresos" value={formatCurrency((data.accrual.ingresos || 0) - (data.cash.ingresos || 0), currency)} />
              <ChipLike label="Gap Egresos" value={formatCurrency((data.accrual.egresos || 0) - (data.cash.egresos || 0), currency)} />
            </Stack>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

const ChipLike = ({ label, value }) => {
  const { primaryTextColor, secondaryTextColor, paletteVars, resolvedMode } =
    useResolvedColorTokens();
  const chipBackground =
    paletteVars.action?.hover ??
    (resolvedMode === "dark"
      ? "rgba(255, 255, 255, 0.12)"
      : "rgba(0, 0, 0, 0.05)");

  return (
    <div
      style={{
        padding: "6px 12px",
        borderRadius: 8,
        background: chipBackground,
      }}
    >
      <Typography variant="caption" sx={{ color: primaryTextColor }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{ color: primaryTextColor }}
      >
        {value}
      </Typography>
    </div>
  );
};
