import React, { useEffect } from "react";
import { Box, FormLabel, FormHelperText } from "@mui/material";
import OutlinedInput from "@mui/material/OutlinedInput";
import CustomSingleAutoComplete from "../../../../shared-components/CustomSingleAutoComplete";
import CustomDatePicker from "../../../../shared-components/CustomDatePicker";
import CustomSelect from "../../../../shared-components/CustomSelect";
import dayjs from "dayjs";

export default function FormRecibo({ formData, setFormData, errors = {} }) {
  // Establecer fecha de hoy por defecto si no hay fecha de emisión
  useEffect(() => {
    if (!formData.fechaEmision) {
      const hoy = dayjs();
      setFormData((p) => ({ ...p, fechaEmision: hoy }));
    }
  }, [formData.fechaEmision, setFormData]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
      
      {/* 1️⃣ Número documento */}
      <Box>
        <FormLabel>Número documento *</FormLabel>
        <OutlinedInput
          value={formData.numeroDocumento || ""}
          onChange={(e) =>
            setFormData((p) => ({ ...p, numeroDocumento: e.target.value }))
          }
          size="small"
          fullWidth
          error={!!errors.numeroDocumento}
        />
        {errors.numeroDocumento && (
          <FormHelperText error>{errors.numeroDocumento}</FormHelperText>
        )}
      </Box>

      {/* 2️⃣ Versión + Medio de pago + Fecha emisión */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Versión *</FormLabel>
          <CustomSelect
            value={formData.versionDocumento || ""}
            onChange={(valor) =>
              setFormData((p) => ({ ...p, versionDocumento: valor }))
            }
            options={["Original", "Duplicado"]}
            width="100%"
            error={!!errors.versionDocumento}
          />
          {errors.versionDocumento && (
            <FormHelperText error>{errors.versionDocumento}</FormHelperText>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Medio de pago *</FormLabel>
          <CustomSelect
            value={formData.medioPago || ""}
            onChange={(valor) =>
              setFormData((p) => ({ ...p, medioPago: valor }))
            }
            options={["Efectivo", "Transferencia", "Cheque"]}
            width="100%"
            error={!!errors.medioPago}
          />
          {errors.medioPago && (
            <FormHelperText error>{errors.medioPago}</FormHelperText>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Fecha emisión *</FormLabel>
          <CustomDatePicker
            value={formData.fechaEmision || null}
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

      {/* 3️⃣ Monto total + Moneda */}
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

      {/* 4️⃣ Receptor */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Nombre receptor *</FormLabel>
          <OutlinedInput
            value={formData.receptorNombre || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, receptorNombre: e.target.value }))
            }
            size="small"
            fullWidth
            error={!!errors.receptorNombre}
          />
          {errors.receptorNombre && (
            <FormHelperText error>{errors.receptorNombre}</FormHelperText>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>CUIT receptor</FormLabel>
          <OutlinedInput
            value={formData.receptorCuit || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, receptorCuit: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Condición IVA receptor</FormLabel>
          <CustomSelect
            value={formData.receptorCondicionIVA || ""}
            onChange={(valor) =>
              setFormData((p) => ({ ...p, receptorCondicionIVA: valor }))
            }
            options={["Responsable Inscripto", "Monotributo", "Exento"]}
            width="100%"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Domicilio receptor</FormLabel>
          <OutlinedInput
            value={formData.receptorDomicilio || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, receptorDomicilio: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
      </Box>

      {/* 5️⃣ Emisor */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Nombre emisor *</FormLabel>
          <OutlinedInput
            value={formData.emisorNombre || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, emisorNombre: e.target.value }))
            }
            size="small"
            fullWidth
            error={!!errors.emisorNombre}
          />
          {errors.emisorNombre && (
            <FormHelperText error>{errors.emisorNombre}</FormHelperText>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>CUIT emisor</FormLabel>
          <OutlinedInput
            value={formData.emisorCuit || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, emisorCuit: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Condición IVA emisor</FormLabel>
          <CustomSelect
            value={formData.emisorCondicionIVA || ""}
            onChange={(valor) =>
              setFormData((p) => ({ ...p, emisorCondicionIVA: valor }))
            }
            options={["Responsable Inscripto", "Monotributo", "Exento"]}
            width="100%"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Domicilio emisor</FormLabel>
          <OutlinedInput
            value={formData.emisorDomicilio || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, emisorDomicilio: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
      </Box>

      {/* 6️⃣ Categoría */}
      <Box sx={{ flex: 1 }}>
        <FormLabel>Categoría *</FormLabel>
        <CustomSingleAutoComplete
          options={["Productos", "Servicios", "Mantenimiento", "Consultoría"]}
          value={formData.categoria || ""}
          onChange={(valor) =>
            setFormData((p) => ({ ...p, categoria: valor }))
          }
          error={!!errors.categoria}
        />
        {errors.categoria && (
          <FormHelperText error>{errors.categoria}</FormHelperText>
        )}
      </Box>

      {/* 7️⃣ Documento asociado */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Documento asociado</FormLabel>
          <CustomSelect
            value={formData.documentoAsociado || ""}
            onChange={(valor) =>
              setFormData((p) => ({ ...p, documentoAsociado: valor }))
            }
            options={["Factura", "Pagaré"]}
            width="100%"
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
    </Box>
  );
}
