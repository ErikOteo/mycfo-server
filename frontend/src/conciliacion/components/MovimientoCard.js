import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import ReceiptIcon from "@mui/icons-material/Receipt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

/**
 * Card para mostrar un movimiento en el panel de conciliación
 */
export default function MovimientoCard({
  movimiento,
  selected = false,
  onClick,
  onDesvincular,
}) {
  const formatMonto = (monto) => {
    if (!monto && monto !== 0) return "$0";
    // Mantener el signo original (no usar Math.abs)
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(monto);
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "-";

    try {
      // Caso LocalDate como array [yyyy, mm, dd]
      if (Array.isArray(fecha) && fecha.length >= 3) {
        const [year, month, day] = fecha;
        const dd = String(day).padStart(2, "0");
        const mm = String(month).padStart(2, "0");
        return `${dd}/${mm}/${year}`;
      }

      // Caso string "YYYY-MM-DD" (LocalDate plano)
      if (typeof fecha === "string") {
        const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
          const [, year, month, day] = match;
          return `${day}/${month}/${year}`;
        }
      }

      // Fallback genérico para Date/ISO (mantiene compatibilidad)
      const d = new Date(fecha);
      if (Number.isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("es-AR");
    } catch {
      return "-";
    }
  };

  const getTipoColor = (tipo) => {
    if (tipo === "Ingreso") return "#2e7d32";
    if (tipo === "Egreso") return "#d32f2f";
    return "#757575";
  };

  const getTipoIcon = (tipo) => {
    if (tipo === "Ingreso") return <TrendingUpIcon fontSize="small" />;
    if (tipo === "Egreso") return <TrendingDownIcon fontSize="small" />;
    return <ReceiptIcon fontSize="small" />;
  };

  const getFuenteColor = (fuente) => {
    if (fuente === "MERCADOPAGO") return "#00b0ff";
    if (fuente === "EXCEL") return "#4caf50";
    return "#9e9e9e";
  };

  return (
    <Card
      sx={{
        mb: 2,
        cursor: "pointer",
        border: selected ? "2px solid #1976d2" : "1px solid #e0e0e0",
        backgroundColor: selected ? "#e3f2fd" : "#fff",
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: 4,
          transform: "translateY(-2px)",
        },
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Box sx={{ flex: 1 }}>
            {/* Tipo y Monto */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Chip
                icon={getTipoIcon(movimiento.tipo)}
                label={movimiento.tipo || "Sin tipo"}
                size="small"
                sx={{
                  backgroundColor: `${getTipoColor(movimiento.tipo)}15`,
                  color: getTipoColor(movimiento.tipo),
                  fontWeight: "bold",
                  border: `1px solid ${getTipoColor(movimiento.tipo)}`,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  color: getTipoColor(movimiento.tipo),
                  fontWeight: "bold",
                }}
              >
                {formatMonto(movimiento.montoTotal)}
              </Typography>
            </Stack>

            {/* Descripción */}
            <Typography
              variant="body2"
              color="text.primary"
              sx={{ mb: 0.5, fontWeight: 500 }}
            >
              {movimiento.descripcion || "Sin descripción"}
            </Typography>

            {/* Origen/Destino */}
            {(movimiento.origen || movimiento.destino) && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {movimiento.tipo === "Egreso" &&
                  movimiento.destino &&
                  `Para: ${movimiento.destino}`}
                {movimiento.tipo === "Ingreso" &&
                  movimiento.origen &&
                  `De: ${movimiento.origen}`}
                {movimiento.tipo !== "Egreso" &&
                  movimiento.tipo !== "Ingreso" &&
                  (movimiento.origen || movimiento.destino)}
              </Typography>
            )}

            {/* Chips de información adicional */}
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: "wrap", gap: 0.5 }}
            >
              <Chip
                label={formatFecha(movimiento.fechaEmision)}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.75rem" }}
              />
              {movimiento.categoria && (
                <Chip
                  label={movimiento.categoria}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: "0.75rem" }}
                />
              )}
              {movimiento.fuenteOrigen && (
                <Chip
                  label={movimiento.fuenteOrigen}
                  size="small"
                  sx={{
                    fontSize: "0.75rem",
                    backgroundColor: `${getFuenteColor(
                      movimiento.fuenteOrigen
                    )}15`,
                    color: getFuenteColor(movimiento.fuenteOrigen),
                    fontWeight: 500,
                  }}
                />
              )}
            </Stack>
          </Box>

          {/* Estado de conciliación */}
          <Box
            sx={{
              ml: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            {movimiento.conciliado ? (
              <>
                <Tooltip
                  title={`Conciliado con ${movimiento.tipoDocumentoConciliado} ${movimiento.numeroDocumentoConciliado}`}
                >
                  <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 32 }} />
                </Tooltip>
                {onDesvincular && (
                  <Tooltip title="Desvincular">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDesvincular(movimiento.id);
                      }}
                      sx={{ mt: 0.5 }}
                    >
                      <LinkOffIcon fontSize="small" color="error" />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            ) : (
              <Chip
                label="Sin conciliar"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* Info del documento conciliado */}
        {movimiento.conciliado && (
          <Box
            sx={{
              mt: 1,
              pt: 1,
              borderTop: "1px solid #e0e0e0",
              backgroundColor: "#f5f5f5",
              p: 1,
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Conciliado con:{" "}
              <strong>
                {movimiento.tipoDocumentoConciliado}{" "}
                {movimiento.numeroDocumentoConciliado}
              </strong>
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
