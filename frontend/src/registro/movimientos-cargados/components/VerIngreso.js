import React from "react";
import { Box, FormLabel, OutlinedInput } from "@mui/material";

export default function VerIngreso({ movimiento }) {
  if (!movimiento) return null;

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    try {
      if (Array.isArray(fecha)) {
        const [year, month, day] = fecha;
        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      }
      const date = new Date(`${fecha}T00:00:00`);
      return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
    } catch (e) {
      return "-";
    }
  };

  // Formatear monto
  const formatearMonto = (monto, moneda = "ARS") => {
    if (monto === null || monto === undefined) return "-";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: moneda === "USD" ? "USD" : moneda === "EUR" ? "EUR" : "ARS",
      minimumFractionDigits: 2
    }).format(Math.abs(monto));
  };

  const renderField = ({ label, value, flex = 1, multiline = false, minRows = 1 }) => (
    <Box sx={{ flex }}>
      <FormLabel sx={{ mb: 1, display: "block" }}>{label}</FormLabel>
      <OutlinedInput
        value={value ?? "-"}
        size="small"
        fullWidth
        disabled
        multiline={multiline}
        minRows={minRows}
      />
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
      {/* 1️⃣ Monto total + Moneda + Medio de pago */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        {renderField({
          label: "Monto total",
          value: formatearMonto(movimiento.montoTotal, movimiento.moneda),
        })}
        {renderField({
          label: "Moneda",
          value: movimiento.moneda || "-",
        })}
        {renderField({
          label: "Medio de pago",
          value: movimiento.medioPago || "-",
        })}
      </Box>

      {/* 2️⃣ Fecha emisión */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        {renderField({
          label: "Fecha emisión",
          value: formatearFecha(movimiento.fechaEmision),
        })}
      </Box>

      {/* 3️⃣ Datos del cliente (origen) */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        {renderField({
          label: "Nombre del cliente",
          value: movimiento.origenNombre || "-",
        })}
        {renderField({
          label: "CUIT del cliente",
          value: movimiento.origenCuit || "-",
        })}
      </Box>

      {/* 4️⃣ Categoría */}
      {renderField({
        label: "Categoría",
        value: movimiento.categoria || "-",
        flex: 1,
      })}

      {/* 5️⃣ Descripción */}
      {renderField({
        label: "Descripción",
        value: movimiento.descripcion || "-",
        flex: 1,
        multiline: true,
        minRows: 3,
      })}
    </Box>
  );
}
