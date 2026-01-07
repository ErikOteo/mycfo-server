import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import useResolvedColorTokens from "../useResolvedColorTokens";

const defaultFormatter = (value) => value;

const KpiCard = ({
  title,
  value,
  formatter = defaultFormatter,
  secondaryLabel,
  secondaryValue,
  secondaryFormatter = defaultFormatter,
  trend = [],
  trendColor = "primary.main",
  loading = false,
  error = null,
  onRetry,
}) => {
  const { primaryTextColor, secondaryTextColor } = useResolvedColorTokens();

  if (loading) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="70%" height={36} />
          <Skeleton variant="rectangular" width="100%" height={40} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
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

  if (value === null || typeof value === "undefined") {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" sx={{ color: secondaryTextColor }}>
            Sin datos disponibles para este indicador.
          </Typography>
          {onRetry ? (
            <Button variant="outlined" onClick={onRetry}>
              Actualizar
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "space-between",
          gap: 1,
          px: 2.0,
          py: 1.5,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: primaryTextColor,
            fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            textAlign: "right",
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <Typography
            variant="h5"
            fontWeight={600}
            sx={{
              color: primaryTextColor,
              fontSize: { xs: "1.3rem", sm: "1.6rem", md: "1.9rem" },
              lineHeight: 1.1,
              wordBreak: "break-word",
            }}
          >
            {formatter(value)}
          </Typography>
          {secondaryLabel ? (
            <Typography variant="body2" sx={{ color: secondaryTextColor }}>
              {secondaryLabel}:{" "}
              <Box component="span" fontWeight={500}>
                {secondaryFormatter(secondaryValue)}
              </Box>
            </Typography>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );
};

export default KpiCard;
