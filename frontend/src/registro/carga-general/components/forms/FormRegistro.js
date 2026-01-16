import React, { useEffect } from "react";
import { Box, FormLabel, FormHelperText } from "@mui/material";
import OutlinedInput from "@mui/material/OutlinedInput";
import CustomSingleAutoComplete from "../../../../shared-components/CustomSingleAutoComplete";
import CustomDatePicker from "../../../../shared-components/CustomDatePicker";
import CustomSelect from "../../../../shared-components/CustomSelect";
import { TODAS_LAS_CATEGORIAS } from "../../../../shared-components/categorias";
import ConciliacionDialog from "../../../../shared-components/ConciliacionDialog";
import dayjs from "dayjs";

const CURRENCY_OPTIONS = ["ARS", "USD"];

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

      {/* 2️⃣ Origen + Destino + Fecha emisión */}
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
          <FormLabel>Fecha emisión *</FormLabel>
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

      {/* 3️⃣ Categoría */}
      <Box>
        <FormLabel>Categoría</FormLabel>
        <CustomSingleAutoComplete
          options={TODAS_LAS_CATEGORIAS}
          value={formData.categoria || ""}
          onChange={(valor) => setFormData((p) => ({ ...p, categoria: valor }))}
        />
      </Box>


      {/* 4️⃣ Descripción */}
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
      <Box sx={{ flex: 1 }}>
        <FormLabel>Número de documento asociado</FormLabel>
        <CustomSingleAutoComplete
          options={["112", "113", "114"]}
          value={formData.numeroDocumentoAsociado || ""}
          onChange={(valor) =>
            setFormData((p) => ({ ...p, numeroDocumentoAsociado: valor }))
          }
        />
      </Box>
    </Box>
  );
}
