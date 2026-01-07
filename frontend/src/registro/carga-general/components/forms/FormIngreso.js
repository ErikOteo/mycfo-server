import React, { useEffect } from "react";
import { Box, FormLabel, FormHelperText } from "@mui/material";
import OutlinedInput from "@mui/material/OutlinedInput";
import CustomSingleAutoComplete from "../../../../shared-components/CustomSingleAutoComplete";
import CustomDateTimePicker from "../../../../shared-components/CustomDateTimePicker";
import CustomSelect from "../../../../shared-components/CustomSelect";
import { TODAS_LAS_CATEGORIAS } from "../../../../shared-components/categorias";
import dayjs from "dayjs";

export default function FormIngreso({
  formData,
  setFormData,
  errors = {},
}) {
  // Establecer fecha de hoy por defecto si no hay fecha de emisión
  useEffect(() => {
    if (!formData.fechaEmision) {
      const hoy = dayjs();
      setFormData((p) => ({ ...p, fechaEmision: hoy }));
    }
  }, [formData.fechaEmision, setFormData]);
  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}
    >
      {/* 1️⃣ Monto total + Moneda + Medio de pago */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Monto total *</FormLabel>
          <OutlinedInput
            type="number"
            value={formData.montoTotal || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, montoTotal: e.target.value }))
            }
            size="small"
            fullWidth
            error={!!errors.montoTotal}
          />
          {errors.montoTotal && (
            <FormHelperText error>{errors.montoTotal}</FormHelperText>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Moneda</FormLabel>
          <OutlinedInput
            value={formData.moneda || "ARS"}
            size="small"
            fullWidth
            disabled
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Medio de pago</FormLabel>
          <CustomSelect
            value={formData.medioPago || ""}
            onChange={(valor) =>
              setFormData((p) => ({ ...p, medioPago: valor }))
            }
            options={[
              "Efectivo",
              "Transferencia",
              "Cheque",
              "Tarjeta",
              "MercadoPago",
              "Otro",
            ]}
            width="100%"
          />
        </Box>
      </Box>

      {/* 2️⃣ Fecha emisión (con hora) */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Fecha emisión *</FormLabel>
          <CustomDateTimePicker
            value={formData.fechaEmision ? dayjs(formData.fechaEmision) : null}
            onChange={(fecha) =>
              setFormData((p) => ({ ...p, fechaEmision: fecha }))
            }
            error={!!errors.fechaEmision}
          />
          {errors.fechaEmision && (
            <FormHelperText error>{errors.fechaEmision}</FormHelperText>
          )}
        </Box>
      </Box>

      {/* 3️⃣ Datos del cliente (origen) */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Nombre del cliente</FormLabel>
          <OutlinedInput
            value={formData.origenNombre || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, origenNombre: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>CUIT del cliente</FormLabel>
          <OutlinedInput
            value={formData.origenCuit || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, origenCuit: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
      </Box>


      {/* 4️⃣ Categoría */}
      <Box>
        <FormLabel>Categoría</FormLabel>
        <CustomSingleAutoComplete
          options={TODAS_LAS_CATEGORIAS}
          value={formData.categoria || ""}
          onChange={(valor) => setFormData((p) => ({ ...p, categoria: valor }))}
        />
      </Box>

      {/* 5️⃣ Descripción */}
      <Box>
        <FormLabel>Descripción</FormLabel>
        <OutlinedInput
          multiline
          value={formData.descripcion || ""}
          onChange={(e) =>
            setFormData((p) => ({ ...p, descripcion: e.target.value }))
          }
          size="small"
          fullWidth
        />
      </Box>
    </Box>
  );
}

