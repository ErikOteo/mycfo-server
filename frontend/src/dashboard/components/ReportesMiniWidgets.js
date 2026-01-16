import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import API_CONFIG from "../../config/api-config";

const currencyFormatter = (value, currency) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: currency || "ARS" }).format(
    value || 0
  );

const MiniChart = ({ title, ingresos = 0, egresos = 0, loading, error, currency }) => (
  <Card variant="outlined" sx={{ height: "100%" }}>
    <CardHeader titleTypographyProps={{ variant: "subtitle2" }} title={title} />
    <CardContent sx={{ height: 180 }}>
      {loading ? (
        <Skeleton variant="rectangular" height={140} />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={[{ name: "Mes", Ingresos: ingresos, Egresos: egresos }]}
                    margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Tooltip formatter={(v) => currencyFormatter(v, currency)} />
            <Bar dataKey="Ingresos" fill="#2e7d32" barSize={24} />
            <Bar dataKey="Egresos" fill="#c62828" barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </CardContent>
  </Card>
);

export default function ReportesMiniWidgets({ currency = "ARS" }) {
  const [state, setState] = React.useState({
    resumen: { ingresos: 0, egresos: 0, loading: true, error: null },
    cashflow: { ingresos: 0, egresos: 0, loading: true, error: null },
    pyl: { ingresos: 0, egresos: 0, loading: true, error: null },
  });

  React.useEffect(() => {
    const baseUrl = API_CONFIG.REPORTE;
    if (!baseUrl) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12

    const headers = {};
    const sub = sessionStorage.getItem('sub');
    const token = sessionStorage.getItem('accessToken');
    if (sub) headers['X-Usuario-Sub'] = sub;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Resumen mensual: sumar totales del endpoint /resumen
    const qResumen = new URLSearchParams();
    qResumen.set('anio', year);
    qResumen.set('mes', month);
    if (currency) qResumen.set('moneda', currency);
    const pResumen = fetch(`${baseUrl}/resumen?${qResumen.toString()}`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(json => {
        const ingresos = (json?.detalleIngresos ?? []).reduce((a, it) => a + (it.total || 0), 0);
        const egresos = (json?.detalleEgresos ?? []).reduce((a, it) => a + (it.total || 0), 0);
        return { ingresos, egresos };
    });

    // Cashflow anual: filtrar registros del último mes y sumar
    const cashParams = new URLSearchParams();
    cashParams.set('anio', year);
    if (currency) cashParams.set('moneda', currency);
    const pCash = fetch(`${baseUrl}/cashflow?${cashParams.toString()}`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(arr => {
        const registros = Array.isArray(arr) ? arr : [];
        const ingresos = registros.filter(r => r.tipo === 'Ingreso' && new Date(r.fechaEmision).getMonth() + 1 === month)
          .reduce((a, r) => a + (r.montoTotal || 0), 0);
        const egresos = registros.filter(r => r.tipo === 'Egreso' && new Date(r.fechaEmision).getMonth() + 1 === month)
          .reduce((a, r) => a + (r.montoTotal || 0), 0);
        return { ingresos, egresos };
      });

    // P&L: usar arrays mensuales e índice del mes
    const qPyl = new URLSearchParams();
    qPyl.set('anio', year);
    if (currency) qPyl.set('moneda', currency);
    const pPyl = fetch(`${baseUrl}/pyl?${qPyl.toString()}`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(json => {
        const idx = month - 1;
        const ingresos = (json?.ingresosMensuales ?? [])[idx] || 0;
        const egresos = (json?.egresosMensuales ?? [])[idx] || 0;
        return { ingresos, egresos };
      });

    setState(s => ({
      resumen: { ...s.resumen, loading: true, error: null },
      cashflow: { ...s.cashflow, loading: true, error: null },
      pyl: { ...s.pyl, loading: true, error: null },
    }));

    pResumen
      .then(({ ingresos, egresos }) => setState(s => ({ ...s, resumen: { ingresos, egresos, loading: false, error: null } })))
      .catch(err => setState(s => ({ ...s, resumen: { ingresos: 0, egresos: 0, loading: false, error: String(err) } })));

    pCash
      .then(({ ingresos, egresos }) => setState(s => ({ ...s, cashflow: { ingresos, egresos, loading: false, error: null } })))
      .catch(err => setState(s => ({ ...s, cashflow: { ingresos: 0, egresos: 0, loading: false, error: String(err) } })));

    pPyl
      .then(({ ingresos, egresos }) => setState(s => ({ ...s, pyl: { ingresos, egresos, loading: false, error: null } })))
      .catch(err => setState(s => ({ ...s, pyl: { ingresos: 0, egresos: 0, loading: false, error: String(err) } })));
  }, [currency]);

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardHeader title="Reportes (último mes)" subheader="Resumen compacto de los 3 reportes" />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <MiniChart title="Resumen mensual" currency={currency} {...state.resumen} />
          </Grid>
          <Grid item xs={12} md={4}>
            <MiniChart title="Cash Flow" currency={currency} {...state.cashflow} />
          </Grid>
          <Grid item xs={12} md={4}>
            <MiniChart title="P&L (devengado)" currency={currency} {...state.pyl} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
