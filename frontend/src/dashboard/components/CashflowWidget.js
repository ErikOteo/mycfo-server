import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { LineChart } from "@mui/x-charts/LineChart";
import { formatCurrencyAR } from "../../utils/formatters";

const CashflowWidget = ({
  data,
  loading = false,
  error = null,
  onRetry,
  onNavigate,
}) => {
  if (loading) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader title="Flujo de caja 30 días" subheader="Calculando proyecciones..." />
        <CardContent>
          <Skeleton variant="rectangular" height={200} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader title="Flujo de caja 30 días" />
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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

  const labels = data?.labels ?? [];
  const incomes = data?.incomes ?? [];
  const expenses = data?.expenses ?? [];
  const net = data?.net ?? [];

  return (
    <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        title="Flujo de caja 30 días"
        subheader="Proyección diaria combinando ingresos y egresos"
      />
      <CardContent sx={{ flexGrow: 1 }}>
        {labels.length === 0 ? (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Todavía no hay movimientos suficientes para proyectar el flujo. Importá un Excel o
              sincronizá tus cuentas para comenzar.
            </Typography>
            {onRetry ? (
              <Button variant="outlined" onClick={onRetry}>
                Actualizar
              </Button>
            ) : null}
          </Stack>
        ) : (
          <>
            <LineChart
              height={240}
              series={[
                {
                  data: incomes,
                  label: "Ingresos",
                  color: "#2e7d32",
                  area: true,
                },
                {
                  data: expenses,
                  label: "Egresos",
                  color: "#c62828",
                  area: true,
                },
                {
                  data: net,
                  label: "Neto",
                  color: "#0288d1",
                  showMark: false,
                  curve: "natural",
                },
              ]}
              xAxis={[{ data: labels, scaleType: "point" }]}
              margin={{ left: 32, right: 16, top: 16, bottom: 32 }}
              slotProps={{
                legend: { hidden: false },
              }}
            />
            <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap">
              <ChipLike label="Saldo proyectado" value={formatCurrencyAR(net[net.length - 1] || 0)} />
              <ChipLike label="Ingresos estimados" value={formatCurrencyAR(incomes.reduce((acc, v) => acc + v, 0))} />
              <ChipLike label="Egresos estimados" value={formatCurrencyAR(expenses.reduce((acc, v) => acc + v, 0))} />
            </Stack>
          </>
        )}
      </CardContent>
      <CardActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onNavigate} disabled={!onNavigate}>
          Ver más
        </Button>
      </CardActions>
    </Card>
  );
};

const ChipLike = ({ label, value }) => (
  <Box
    sx={{
      px: 1.5,
      py: 0.75,
      borderRadius: 2,
      bgcolor: "action.hover",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600}>
      {value}
    </Typography>
  </Box>
);

export default CashflowWidget;
