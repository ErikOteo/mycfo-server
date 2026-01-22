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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useTheme, alpha } from "@mui/material/styles";
import useResolvedColorTokens from "../useResolvedColorTokens";

const formatCurrency = (value) => {
  if (value === null || value === undefined) {
    return "--";
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "--";
  }
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(numeric);
};

const SalesByCategoryWidget = ({
  data = [],
  loading = false,
  error = null,
  emptyMessage = "No hay datos para mostrar por categoría en este período.",
  title = "Ingresos por categorías",
  subtitle = "Distribución anual por segmento",
}) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const { primaryTextColor, secondaryTextColor } = useResolvedColorTokens();

  if (loading) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader title={title} subheader="Armando ranking..." />
        <CardContent>
          <Stack spacing={1}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} variant="rectangular" height={24} />
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader title={title} />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  const hasData = Array.isArray(data) && data.length > 0;
  const safeData = hasData ? data : [];
  const chartData = safeData.map((item) => ({
    name: item.category ?? "Sin categoría",
    value: Number(item.value) || 0,
  }));

  let topCategory = null;
  let bottomCategory = null;
  let average = null;

  if (hasData) {
    const values = chartData.map(d => d.value);
    const total = values.reduce((sum, value) => sum + value, 0);
    average = values.length > 0 ? total / values.length : null;
    const sorted = [...chartData].sort((a, b) => b.value - a.value);
    topCategory = sorted[0] ? { category: sorted[0].name, value: sorted[0].value } : null;
    bottomCategory = sorted[sorted.length - 1] ? { category: sorted[sorted.length - 1].name, value: sorted[sorted.length - 1].value } : null;
  }

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
        title={title}
        subheader={subtitle}
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
          hasData ? (
            <Box
              sx={{
                width: { xs: "100%", sm: "auto" },
                pr: { xs: 0, sm: 2.5 },
                pt: { xs: 1, sm: 0.5 },
                ml: { xs: 5, sm: 2.5 },
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
                  <Typography
                    variant="overline"
                    sx={{ color: primaryTextColor }}
                  >
                    Categoría superior
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ color: primaryTextColor }}
                  >
                    {formatCurrency(topCategory?.value)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: primaryTextColor }}>
                    {topCategory?.category ?? "--"}
                  </Typography>
                </Stack>
                <Stack
                  spacing={0.5}
                  alignItems={isSmall ? "flex-start" : "flex-end"}
                  sx={{ minWidth: 120, width: isSmall ? "100%" : "auto" }}
                >
                  <Typography
                    variant="overline"
                    sx={{ color: primaryTextColor }}
                  >
                    Categoría menor
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ color: primaryTextColor }}
                  >
                    {formatCurrency(bottomCategory?.value)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: primaryTextColor }}>
                    {bottomCategory?.category ?? "--"}
                  </Typography>
                </Stack>
                <Stack
                  spacing={0.5}
                  alignItems={isSmall ? "flex-start" : "flex-end"}
                  sx={{ minWidth: 120, width: isSmall ? "100%" : "auto" }}
                >
                  <Typography
                    variant="overline"
                    sx={{ color: primaryTextColor }}
                  >
                    Promedio
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ color: primaryTextColor }}
                  >
                    {formatCurrency(average)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: primaryTextColor }}>
                    {chartData.length} categorías
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          ) : null
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
        {hasData ? (
          <Box
            sx={{
              width: "100%",
              height: 350,
              mt: { xs: 1, md: 2 },
            }}
          >
            <ResponsiveContainer width="100%" height="100%" minHeight={240}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: primaryTextColor, fontSize: 9 }}
                  angle={-40}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis 
                  tick={{ fill: primaryTextColor, fontSize: 9 }}
                  tickFormatter={(value) => formatCurrency(value)}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: primaryTextColor }}
                  formatter={(value) => [formatCurrency(value), "Valor"]}
                />
                <Bar 
                  dataKey="value" 
                  fill={theme.palette.primary.main}
                  radius={[8, 8, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={alpha(theme.palette.primary.main, 0.85)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: { xs: 2.5, md: 3 },
            }}
          >
            <Typography
              variant="body2"
              textAlign="center"
              sx={{ color: secondaryTextColor }}
            >
              {emptyMessage}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesByCategoryWidget;
