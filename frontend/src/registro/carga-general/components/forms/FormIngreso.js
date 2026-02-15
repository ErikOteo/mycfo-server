import React, { useEffect } from "react";
import { Box, FormLabel, FormHelperText } from "@mui/material";
import OutlinedInput from "@mui/material/OutlinedInput";
import CategoriaAutoComplete from "../../../../shared-components/CategoriaAutoComplete";
import CustomDateTimePicker from "../../../../shared-components/CustomDateTimePicker";
import CustomSelect from "../../../../shared-components/CustomSelect";
import dayjs from "dayjs";

const CURRENCY_OPTIONS = ["ARS", "USD"];

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
      {/* 1: Monto total + Moneda + Medio de pago */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, width: "100%" }}>
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
          <CustomSelect
            value={formData.moneda || "ARS"}
            onChange={(valor) =>
              setFormData((p) => ({ ...p, moneda: valor || "ARS" }))
            }
            options={CURRENCY_OPTIONS}
            width="100%"
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

      {/* 2: Fecha emision (con hora) */}
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

      {/* 3: Datos del cliente (origen) */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, width: "100%" }}>
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

      {/* 4: Categoria */}
      <Box>
        <FormLabel>Categoria</FormLabel>
        <CategoriaAutoComplete
          tipo="Ingreso"
          value={formData.categoria || ""}
          onChange={(valor) => setFormData((p) => ({ ...p, categoria: valor }))}
          error={!!errors.categoria}
          helperText={errors.categoria}
        />
      </Box>

      {/* 5: Descripcion */}
      <Box>
        <FormLabel>Descripcion</FormLabel>
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
