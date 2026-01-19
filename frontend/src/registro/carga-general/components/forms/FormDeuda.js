import React, { useEffect } from "react";
import { Box, FormLabel, FormHelperText } from "@mui/material";
import OutlinedInput from "@mui/material/OutlinedInput";
import CategoriaAutoComplete from "../../../../shared-components/CategoriaAutoComplete";
import CustomDateTimePicker from "../../../../shared-components/CustomDateTimePicker";
import CustomDatePicker from "../../../../shared-components/CustomDatePicker";
import CustomSelect from "../../../../shared-components/CustomSelect";
import dayjs from "dayjs";

export default function FormDeuda({
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
      {/* 1️⃣ Monto total + Moneda */}
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
      </Box>

      {/* 2️⃣ Fecha emisión (con hora) + Fecha vencimiento */}
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
        <Box sx={{ flex: 1 }}>
          <FormLabel>Fecha de vencimiento</FormLabel>
          <CustomDatePicker
            value={formData.fechaVencimiento || null}
            onChange={(fecha) =>
              setFormData((p) => ({ ...p, fechaVencimiento: fecha }))
            }
          />
        </Box>
      </Box>


      {/* Datos del acreedor (destino) */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Nombre del acreedor (a quien le debemos)</FormLabel>
          <OutlinedInput
            value={formData.destinoNombre || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, destinoNombre: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>CUIT del acreedor</FormLabel>
          <OutlinedInput
            value={formData.destinoCuit || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, destinoCuit: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
      </Box>

      {/* 4️⃣ Información de cuotas y financiamiento */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Cantidad de cuotas</FormLabel>
          <OutlinedInput
            type="number"
            value={formData.cantidadCuotas || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, cantidadCuotas: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Cuotas pagadas (abonadas)</FormLabel>
          <OutlinedInput
            type="number"
            value={formData.cuotasPagadas || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, cuotasPagadas: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Monto por cuota</FormLabel>
          <OutlinedInput
            type="number"
            value={formData.montoCuota || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, montoCuota: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
      </Box>

      {/* 5️⃣ Tasa de interés y periodicidad */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Tasa de interés anual (%)</FormLabel>
          <OutlinedInput
            type="number"
            value={formData.tasaInteres || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, tasaInteres: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Periodicidad</FormLabel>
          <CustomSelect
            value={formData.periodicidad || ""}
            onChange={(valor) =>
              setFormData((p) => ({ ...p, periodicidad: valor }))
            }
            options={["Mensual", "Bimestral", "Trimestral", "Semestral", "Anual"]}
            width="100%"
          />
        </Box>
      </Box>

      {/* 6: Categoria */}
      <Box>
        <FormLabel>Categoria</FormLabel>
        <CategoriaAutoComplete
          tipo="Deuda"
          value={formData.categoria || ""}
          onChange={(valor) => setFormData((p) => ({ ...p, categoria: valor }))}
          error={!!errors.categoria}
          helperText={errors.categoria}
        />
      </Box>

      {/* 7️⃣ Descripción */}
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

