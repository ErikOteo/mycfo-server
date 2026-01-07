import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  Stack,
  Tooltip,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import LinkIcon from "@mui/icons-material/Link";
import StarIcon from "@mui/icons-material/Star";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import StarBorderIcon from "@mui/icons-material/StarBorder";

/**
 * Card para mostrar un documento sugerido en el panel de conciliación
 */
export default function DocumentoCard({ documento, onVincular }) {
  const formatMonto = (monto) => {
    if (!monto) return "$0";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(Math.abs(monto));
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

      // Fallback genérico para Date/ISO
      const d = new Date(fecha);
      if (Number.isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("es-AR");
    } catch {
      return "-";
    }
  };

  const getTipoDocumentoColor = (tipo) => {
    if (tipo === "FACTURA") return "#1976d2";
    if (tipo === "PAGARE") return "#f57c00";
    if (tipo === "RECIBO") return "#388e3c";
    return "#757575";
  };

  const getTipoDocumentoIcon = () => {
    return <DescriptionIcon fontSize="small" />;
  };

  const getNivelColor = (nivel) => {
    if (nivel === "ALTA") return "#4caf50";
    if (nivel === "MEDIA") return "#ff9800";
    return "#9e9e9e";
  };

  const renderEstrellas = (score) => {
    const numEstrellas = Math.round((score / 100) * 5);
    const estrellas = [];

    for (let i = 0; i < 5; i++) {
      if (i < numEstrellas) {
        estrellas.push(
          <StarIcon key={i} sx={{ fontSize: 16, color: "#ffc107" }} />
        );
      } else {
        estrellas.push(
          <StarBorderIcon key={i} sx={{ fontSize: 16, color: "#e0e0e0" }} />
        );
      }
    }

    return <Box sx={{ display: "flex" }}>{estrellas}</Box>;
  };

  return (
    <Card
      sx={{
        mb: 2,
        border:
          documento.nivelSugerencia === "ALTA"
            ? "2px solid #4caf50"
            : "1px solid #e0e0e0",
        backgroundColor:
          documento.nivelSugerencia === "ALTA" ? "#f1f8e9" : "#fff",
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: 4,
          transform: "translateY(-2px)",
        },
      }}
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
            {/* Tipo de documento y score */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Chip
                icon={getTipoDocumentoIcon()}
                label={documento.tipoDocumento}
                size="small"
                sx={{
                  backgroundColor: `${getTipoDocumentoColor(
                    documento.tipoDocumento
                  )}15`,
                  color: getTipoDocumentoColor(documento.tipoDocumento),
                  fontWeight: "bold",
                  border: `1px solid ${getTipoDocumentoColor(
                    documento.tipoDocumento
                  )}`,
                }}
              />
              {documento.nivelSugerencia === "ALTA" && (
                <Tooltip title="Alta coincidencia">
                  <StarIcon sx={{ color: "#ffc107", fontSize: 20 }} />
                </Tooltip>
              )}
            </Stack>

            {/* Número de documento */}
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
              {documento.numeroDocumento}
            </Typography>

            {/* Monto y Fecha */}
            <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: "#1976d2" }}
              >
                {formatMonto(documento.montoTotal)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatFecha(documento.fechaEmision)}
              </Typography>
            </Stack>

            {/* Nombre relacionado */}
            {documento.nombreRelacionado && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {documento.nombreRelacionado}
              </Typography>
            )}

            {/* Categoría y CUIT */}
            <Stack
              direction="row"
              spacing={1}
              sx={{ mb: 1, flexWrap: "wrap", gap: 0.5 }}
            >
              {documento.categoria && (
                <Chip
                  label={documento.categoria}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: "0.75rem" }}
                />
              )}
              {documento.cuit && (
                <Chip
                  label={`CUIT: ${documento.cuit}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.75rem" }}
                />
              )}
            </Stack>

            {/* Score de coincidencia */}
            <Box
              sx={{
                mt: 1,
                p: 1,
                backgroundColor: `${getNivelColor(
                  documento.nivelSugerencia
                )}15`,
                borderRadius: 1,
                border: `1px solid ${getNivelColor(documento.nivelSugerencia)}`,
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 0.5 }}
              >
                {renderEstrellas(documento.scoreCoincidencia)}
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: getNivelColor(documento.nivelSugerencia),
                  }}
                >
                  {documento.scoreCoincidencia}% coincidencia
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {documento.razonSugerencia}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Botón de vincular */}
        <Button
          variant={
            documento.nivelSugerencia === "ALTA" ? "contained" : "outlined"
          }
          color="primary"
          startIcon={<LinkIcon />}
          fullWidth
          onClick={() => onVincular(documento.idDocumento)}
          sx={{ mt: 1 }}
        >
          Vincular
        </Button>
      </CardContent>
    </Card>
  );
}
