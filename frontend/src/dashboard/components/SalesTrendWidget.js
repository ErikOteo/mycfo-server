import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import useMediaQuery from "@mui/material/useMediaQuery";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useTheme, alpha } from "@mui/material/styles";
import useResolvedColorTokens from "../useResolvedColorTokens";
import { formatCurrencyByCode } from "../../utils/formatters";

const numberFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

const monthLabel = (raw, index) => {
  if (!raw) {
    const fallback = new Date(2000, index % 12, 1);
    return new Intl.DateTimeFormat("es-AR", { month: "long" }).format(fallback);
  }

  const normalized = String(raw).trim().toLowerCase();
  const dictionary = {
    ene: "enero",
    feb: "febrero",
    mar: "marzo",
    abr: "abril",
    may: "mayo",
    jun: "junio",
    jul: "julio",
    ago: "agosto",
    sep: "septiembre",
    oct: "octubre",
    nov: "noviembre",
    dic: "diciembre",
    january: "enero",
    february: "febrero",
    march: "marzo",
    april: "abril",
    june: "junio",
    july: "julio",
    august: "agosto",
    september: "septiembre",
    october: "octubre",
    november: "noviembre",
    december: "diciembre",
  };

  if (dictionary[normalized]) {
    return dictionary[normalized];
  }

  const parsed = Date.parse(`${normalized} 1, 2020`);
  if (Number.isNaN(parsed)) {
    const fallback = new Date(2000, index % 12, 1);
    return new Intl.DateTimeFormat("es-AR", { month: "long" }).format(fallback);
  }
  return new Intl.DateTimeFormat("es-AR", { month: "long" }).format(parsed);
};

const SalesTrendWidget = ({ data, loading = false, error = null, emptyMessage, currency = "ARS" }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const { primaryTextColor, secondaryTextColor } = useResolvedColorTokens();
  const formatAmount = React.useCallback(
    (value) => formatCurrencyByCode(value, currency, { fallback: "--" }),
    [currency]
  );

  if (loading) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader
          title={data?.title ?? "Ingresos durante el período"}
          subheader="Generando serie..."
        />
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="rectangular" height={220} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader title={data?.title ?? "Ingresos durante el período"} />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  const points = data?.points ?? [];
  const chartData = points.map((item, index) => ({
    name: monthLabel(item.month, item.monthIndex),
    value: item.value ?? 0,
  }));
  const noDataMessage = emptyMessage ?? data?.emptyMessage ?? "No hay ingresos registrados en este período.";
  const hasData = chartData.length > 0 && chartData.some(d => d.value !== 0);

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        minHeight: 520,
        display: "flex",
        flexDirection: "column",
      }}
    >
        <CardHeader
          title={data?.title ?? "Ingresos durante el período"}
          subheader={data?.subheader ?? "Serie mensual de ingresos registrados en los últimos 12 meses."}
        titleTypographyProps={{
          variant: "h6",
          fontWeight: 600,
          sx: { color: primaryTextColor },
        }}
        subheaderTypographyProps={{
          variant: "body2",
          sx: { color: primaryTextColor },
        }}
        action={
          <Box
            sx={{
              width: { xs: "100%", sm: "auto" },
              pr: { xs: 0, sm: 2.5 },
              pt: { xs: 1, sm: 0.5 },
              ml: { xs: 10, sm: 5 },
            }}
          >
            <Stack
              direction={isSmall ? "column" : "row"}
              spacing={isSmall ? 1.25 : 2}
              alignItems={isSmall ? "flex-start" : "flex-start"}
              justifyContent={isSmall ? "flex-start" : "flex-end"}
              divider={
                <Divider
                  flexItem={!isSmall}
                  orientation={isSmall ? "horizontal" : "vertical"}
                  sx={{
                    borderColor: "divider",
                    mx: isSmall ? 0 : 0.5,
                    my: isSmall ? 0.75 : 0,
                  }}
                />
              }
              sx={{
                width: "100%",
                "& .MuiTypography-overline": { letterSpacing: 0.6 },
              }}
            >
              <Stack
                spacing={0.5}
                alignItems={isSmall ? "flex-start" : "flex-end"}
                sx={{ minWidth: 120, width: isSmall ? "100%" : "auto" }}
              >
                <Typography variant="overline" sx={{ color: primaryTextColor }}>
                  Maximo
                </Typography>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: primaryTextColor }}>
                  {formatAmount(data?.max?.value)}
                </Typography>
                <Typography variant="caption" sx={{ color: primaryTextColor }}>
                  {data?.max?.label ?? "--"}
                </Typography>
              </Stack>
              <Stack
                spacing={0.5}
                alignItems={isSmall ? "flex-start" : "flex-end"}
                sx={{ minWidth: 120, width: isSmall ? "100%" : "auto" }}
              >
                <Typography variant="overline" sx={{ color: primaryTextColor }}>
                  Minimo
                </Typography>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: primaryTextColor }}>
                  {formatAmount(data?.min?.value)}
                </Typography>
                <Typography variant="caption" sx={{ color: primaryTextColor }}>
                  {data?.min?.label ?? "--"}
                </Typography>
              </Stack>
              <Stack
                spacing={0.5}
                alignItems={isSmall ? "flex-start" : "flex-end"}
                sx={{ minWidth: 120, width: isSmall ? "100%" : "auto" }}
              >
                <Typography variant="overline" sx={{ color: primaryTextColor }}>
                  Promedio
                </Typography>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: primaryTextColor }}>
                  {formatAmount(data?.average)}
                </Typography>
                  <Typography variant="caption" sx={{ color: primaryTextColor }}>
                    Últimos 12 meses
                  </Typography>
              </Stack>
            </Stack>
          </Box>
        }
        sx={{
          py: 2,
          "& .MuiCardHeader-content": {
            gap: 0.25,
            alignSelf: "flex-start",
          },
          "& .MuiCardHeader-action": {
            mt: 0,
            width: { xs: "100%", sm: "auto" },
            alignSelf: { xs: "stretch", sm: "flex-start" },
          },
        }}
      />
      <CardContent
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          px: { xs: 1, md: 1.5 },
          pt: { xs: 0.9, md: 1.25 },
          pb: { xs: 2.1, md: 2.35 },
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: 350,
            mt: { xs: 1, md: 2 },
          }}
        >
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: primaryTextColor, fontSize: 9 }}
                  angle={-40}
                  textAnchor="end"
                  height={45}
                  interval={0}
                />
                <YAxis 
                  tick={{ fill: primaryTextColor, fontSize: 9 }}
                  tickFormatter={(value) => formatAmount(value)}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: primaryTextColor }}
                  formatter={(value) => [formatAmount(value), "Valor"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={theme.palette.primary.main}
                  strokeWidth={3}
                  fill="url(#colorValue)"
                  dot={{ fill: theme.palette.primary.main, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
                color: secondaryTextColor,
                typography: "body2",
              }}
            >
              {noDataMessage}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SalesTrendWidget;



