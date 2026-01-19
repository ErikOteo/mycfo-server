import React, { useEffect } from "react";
import { Box, FormLabel, FormHelperText } from "@mui/material";
import OutlinedInput from "@mui/material/OutlinedInput";
import CategoriaAutoComplete from "../../../../shared-components/CategoriaAutoComplete";
import CustomDatePicker from "../../../../shared-components/CustomDatePicker";
import CustomSelect from "../../../../shared-components/CustomSelect";
import dayjs from "dayjs";

export default function FormRegistro({
  tipoDoc,
  formData,
  setFormData,
  errors = {},
}) {
  useEffect(() => {
    if (tipoDoc === "Movimiento") {
      const tipo = formData.montoTotal >= 0 ? "Ingreso" : "Egreso";
      setFormData((p) => ({
        ...p,
        tipo: tipo,
      }));
    }
  }, [tipoDoc, setFormData, formData.montoTotal]);

  // Establecer fecha de hoy por defecto si no hay fecha de emision
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

      {/* 2: Origen + Destino + Fecha emision */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Origen</FormLabel>
          <OutlinedInput
            value={formData.origen || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, origen: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Destino</FormLabel>
          <OutlinedInput
            value={formData.destino || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, destino: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Fecha emision *</FormLabel>
          <CustomDatePicker
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

      {/* 3: Categoria */}
      <Box>
        <FormLabel>Categoria</FormLabel>
        <CategoriaAutoComplete
          tipo={formData.tipo}
          value={formData.categoria || ""}
          onChange={(valor) => setFormData((p) => ({ ...p, categoria: valor }))}
          error={!!errors.categoria}
          helperText={errors.categoria}
        />
      </Box>

      {/* 4: Descripcion */}
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
      <Box sx={{ flex: 1 }}>
        <FormLabel>Numero de documento asociado</FormLabel>
        <OutlinedInput
          value={formData.numeroDocumentoAsociado || ""}
          onChange={(e) =>
            setFormData((p) => ({
              ...p,
              numeroDocumentoAsociado: e.target.value,
            }))
          }
          size="small"
          fullWidth
        />
      </Box>
    </Box>
  );
}
