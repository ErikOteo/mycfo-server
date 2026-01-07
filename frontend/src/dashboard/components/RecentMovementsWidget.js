import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import useResolvedColorTokens from "../useResolvedColorTokens";

const typeStyles = {
  ingreso: { color: "#1b5e20", backgroundColor: "rgba(46, 125, 50, 0.12)" },
  egreso: { color: "#b71c1c", backgroundColor: "rgba(198, 40, 40, 0.12)" },
  deuda: { color: "#37474f", backgroundColor: "rgba(55, 71, 79, 0.12)" },
  acreencia: { color: "#01579b", backgroundColor: "rgba(1, 87, 155, 0.12)" },
  transferencia: { color: "#4a148c", backgroundColor: "rgba(74, 20, 140, 0.12)" },
};

const getTypeStyle = (tipo) => {
  if (!tipo) {
    return { color: "#424242", backgroundColor: "rgba(66, 66, 66, 0.1)" };
  }
  const key = String(tipo).toLowerCase();
  return typeStyles[key] ?? { color: "#424242", backgroundColor: "rgba(66, 66, 66, 0.1)" };
};

const formatAmount = (value, currency = "ARS") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "-";
  }
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch (error) {
    return `${numeric.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency || ""}`.trim();
  }
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
};

const RecentMovementsWidget = ({
  data,
  loading = false,
  error = null,
  onRetry,
  onNavigate,
}) => {
  const { resolvedMode, primaryTextColor, secondaryTextColor } = useResolvedColorTokens();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDarkMode = resolvedMode === "dark";
  const cardHeaderTypography = React.useMemo(
    () => ({
      titleTypographyProps: {
        variant: "h6",
        sx: { color: primaryTextColor },
      },
      subheaderTypographyProps: {
        variant: "body2",
        sx: { color: primaryTextColor },
      },
    }),
    [primaryTextColor]
  );

  if (loading) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader
          title="Movimientos"
          subheader="Cargando..."
          {...cardHeaderTypography}
        />
        <CardContent>
          <Skeleton variant="rectangular" height={180} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader title="Movimientos" {...cardHeaderTypography} />
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

  const movements = Array.isArray(data) ? data : [];

  return (
    <Card
      variant="outlined"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardHeader
        title="Movimientos"
        subheader="Últimos movimientos registrados"
        {...cardHeaderTypography}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        {movements.length === 0 ? (
          <Stack spacing={2} alignItems="flex-start">
            <Typography variant="body2" sx={{ color: secondaryTextColor }}>
              Todavía no hay movimientos para mostrar. Registra un ingreso o egreso para verlos aquí.
            </Typography>
            {onRetry ? (
              <Button variant="outlined" onClick={onRetry}>
                Actualizar
              </Button>
            ) : null}
          </Stack>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell>Fecha</TableCell>
                  {!isMobile ? <TableCell>Categoría</TableCell> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {movements.map((movement, index) => {
                  const key = movement.id ?? `movement-${index}`;
                  const tipo = movement.tipo ?? "Movimiento";
                  const categoria = movement.categoria || "Sin categoría";
                  const amountColor = (movement.montoTotal ?? 0) < 0 ? "error.main" : "success.main";
                  const typeStyle = getTypeStyle(tipo);
                  return (
                    <TableRow key={key} hover>
                      <TableCell>
                        <Chip
                          label={tipo}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            color: typeStyle.color,
                            backgroundColor: typeStyle.backgroundColor,
                            border: `1px solid ${typeStyle.color}`,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ color: amountColor, fontWeight: 600 }}>
                        {formatAmount(movement.montoTotal, movement.moneda)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(movement.fechaEmision)}</Typography>
                      </TableCell>
                      {!isMobile ? (
                        <TableCell>
                          <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                            {categoria}
                          </Typography>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
      <CardActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onNavigate}
          disabled={!onNavigate}
          sx={isDarkMode ? { color: "#42897f" } : undefined}
        >
          Ver más
        </Button>
      </CardActions>
    </Card>
  );
};

export default RecentMovementsWidget;
