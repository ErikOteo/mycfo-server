import React, { useEffect } from "react";
import { Box, FormLabel, FormHelperText } from "@mui/material";
import OutlinedInput from "@mui/material/OutlinedInput";
import CategoriaAutoComplete from "../../../../shared-components/CategoriaAutoComplete";
import CustomDatePicker from "../../../../shared-components/CustomDatePicker";
import CustomSelect from "../../../../shared-components/CustomSelect";
import dayjs from "dayjs";

const CURRENCY_OPTIONS = ["ARS", "USD"];

export default function FormPagare({ formData, setFormData, errors = {} }) {
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

      {/* 2️⃣ Versión + Intereses + Cláusula */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, width: "100%" }}>
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
          <FormLabel>Intereses mora</FormLabel>
          <OutlinedInput
            type="number"
            value={formData.interesesMora || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, interesesMora: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Cláusula</FormLabel>
          <CustomSelect
            value={formData.clausula || ""}
            onChange={(valor) =>
              setFormData((p) => ({ ...p, clausula: valor }))
            }
            options={["A la orden", "No a la orden"]}
            width="100%"
          />
        </Box>
      </Box>

      {/* 3️⃣ Monto total + Moneda + Fecha vencimiento */}
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
          <FormLabel>Fecha vencimiento *</FormLabel>
          <CustomDatePicker
            value={formData.fechaVencimiento || null}
            onChange={(fecha) =>
              setFormData((p) => ({ ...p, fechaVencimiento: fecha }))
            }
            error={!!errors.fechaVencimiento}
          />
          {errors.fechaVencimiento && (
            <FormHelperText error>{errors.fechaVencimiento}</FormHelperText>
          )}
        </Box>
      </Box>

      {/* 4️⃣ Datos del deudor */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Nombre deudor *</FormLabel>
          <OutlinedInput
            value={formData.deudorNombre || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, deudorNombre: e.target.value }))
            }
            size="small"
            fullWidth
            error={!!errors.deudorNombre}
          />
          {errors.deudorNombre && (
            <FormHelperText error>{errors.deudorNombre}</FormHelperText>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>CUIT deudor</FormLabel>
          <OutlinedInput
            value={formData.deudorCuit || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, deudorCuit: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
      </Box>

      {/* 5️⃣ Datos del beneficiario */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Nombre beneficiario *</FormLabel>
          <OutlinedInput
            value={formData.beneficiarioNombre || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, beneficiarioNombre: e.target.value }))
            }
            size="small"
            fullWidth
            error={!!errors.beneficiarioNombre}
          />
          {errors.beneficiarioNombre && (
            <FormHelperText error>{errors.beneficiarioNombre}</FormHelperText>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>CUIT beneficiario</FormLabel>
          <OutlinedInput
            value={formData.beneficiarioCuit || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, beneficiarioCuit: e.target.value }))
            }
            size="small"
            fullWidth
          />
        </Box>
      </Box>

      {/* 6️⃣ Categoría */}
      <Box sx={{ flex: 1 }}>
        <FormLabel>Categoría *</FormLabel>
        <CategoriaAutoComplete
          options={TODAS_LAS_CATEGORIAS}
          value={formData.categoria || ""}
          onChange={(valor) => setFormData((p) => ({ ...p, categoria: valor }))}
          error={!!errors.categoria}
        />
        {errors.categoria && (
          <FormHelperText error>{errors.categoria}</FormHelperText>
        )}
      </Box>

      {/* 7️⃣ Factura asociada */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Factura asociada</FormLabel>
          <CustomSelect
            value={formData.facturaAsociada || ""}
            onChange={(valor) =>
              setFormData((p) => ({ ...p, facturaAsociada: valor }))
            }
            options={["Factura 1", "Factura 2", "Factura 3"]}
            width="100%"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Número factura asociada</FormLabel>
          <CategoriaAutoComplete
            options={["112", "113", "114"]}
            value={formData.numeroFacturaAsociada || ""}
            onChange={(valor) =>
              setFormData((p) => ({ ...p, numeroFacturaAsociada: valor }))
            }
          />
        </Box>
      </Box>
    </Box>
  );
}
