import React, { useEffect, useState } from "react";
import {
  Box,
  FormLabel,
  FormHelperText,
  OutlinedInput,
} from "@mui/material";
import dayjs from "dayjs";
import CustomSelect from "../../../../shared-components/CustomSelect";
import CustomDateTimePicker from "../../../../shared-components/CustomDateTimePicker";
import CategoriaAutoComplete from "../../../../shared-components/CategoriaAutoComplete";
import { sessionService } from "../../../../shared-services/sessionService";

export default function FormFactura({ formData, setFormData, errors = {}, modoEdicion = true }) {
  const [datosEmpresa, setDatosEmpresa] = useState(null);

  // Establecer fecha de hoy por defecto si no hay fecha de emisión
  useEffect(() => {
    if (!formData.fechaEmision && modoEdicion) {
      const hoy = dayjs();
      setFormData((p) => ({ ...p, fechaEmision: hoy }));
    }
  }, [formData.fechaEmision, setFormData, modoEdicion]);

  // Cargar datos de la empresa del usuario desde la sesión (diferido)
  useEffect(() => {
    // Pequeño delay para evitar bloquear la navegación
    const timer = setTimeout(() => {
      console.log('Cargando datos de la empresa desde sesión...');
      const empresa = sessionService.getEmpresa();
      console.log('Datos de empresa obtenidos:', empresa);
      if (empresa) {
        setDatosEmpresa(empresa);
      } else {
        console.log('No hay datos de empresa en la sesión');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Función para autocompletar datos según la versión
  const autocompletarDatos = (version) => {
    console.log('Autocompletando datos para versión:', version);
    console.log('Datos de empresa disponibles:', datosEmpresa);
    
    if (!datosEmpresa) {
      console.log('No hay datos de empresa disponibles');
      return;
    }

    if (version === "Original") {
      // Para Original: empresa va en comprador, limpiar vendedor
      console.log('Autocompletando datos del comprador y limpiando vendedor');
      setFormData((p) => (modoEdicion ? {
        ...p,
        // Autocompletar comprador
        compradorNombre: datosEmpresa.nombre || "",
        compradorCuit: datosEmpresa.cuit || "",
        compradorCondicionIVA: datosEmpresa.condicionIVA || "",
        compradorDomicilio: datosEmpresa.domicilio || "",
        // Limpiar vendedor
        vendedorNombre: "",
        vendedorCuit: "",
        vendedorCondicionIVA: "",
        vendedorDomicilio: ""
      } : p));
    } else if (version === "Duplicado") {
      // Para Duplicado: empresa va en vendedor, limpiar comprador
      console.log('Autocompletando datos del vendedor y limpiando comprador');
      setFormData((p) => (modoEdicion ? {
        ...p,
        // Limpiar comprador
        compradorNombre: "",
        compradorCuit: "",
        compradorCondicionIVA: "",
        compradorDomicilio: "",
        // Autocompletar vendedor
        vendedorNombre: datosEmpresa.nombre || "",
        vendedorCuit: datosEmpresa.cuit || "",
        vendedorCondicionIVA: datosEmpresa.condicionIVA || "",
        vendedorDomicilio: datosEmpresa.domicilio || ""
      } : p));
    }
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}
    >
      {/* 1️⃣ Número Documento */}
      <Box>
        <FormLabel>Número documento *</FormLabel>
        <OutlinedInput
          value={formData.numeroDocumento || ""}
          onChange={(e) => {
            if (!modoEdicion) return;
            setFormData((p) => ({ ...p, numeroDocumento: e.target.value }));
          }}
          size="small"
          fullWidth
          error={!!errors.numeroDocumento}
          disabled={!modoEdicion}
        />
        {errors.numeroDocumento && (
          <FormHelperText error>{errors.numeroDocumento}</FormHelperText>
        )}
      </Box>

      {/* 2️⃣ Versión + Tipo factura + Fecha emisión */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Versión *</FormLabel>
          <CustomSelect
            value={formData.versionDocumento || ""}
            onChange={(valor) => {
              if (!modoEdicion) return;
              setFormData((p) => ({ ...p, versionDocumento: valor }));
              autocompletarDatos(valor);
            }}
            options={["Original", "Duplicado"]}
            width="100%"
            error={!!errors.versionDocumento}
            disabled={!modoEdicion}
          />
          {errors.versionDocumento && (
            <FormHelperText error>{errors.versionDocumento}</FormHelperText>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Tipo factura *</FormLabel>
          <CustomSelect
            value={formData.tipoFactura || ""}
            onChange={(valor) => {
              if (!modoEdicion) return;
              setFormData((p) => ({ ...p, tipoFactura: valor }))
            }}
            options={["A", "B", "C"]}
            width="100%"
            error={!!errors.tipoFactura}
            disabled={!modoEdicion}
          />
          {errors.tipoFactura && (
            <FormHelperText error>{errors.tipoFactura}</FormHelperText>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Fecha emisión *</FormLabel>
          <CustomDateTimePicker
            value={formData.fechaEmision ? dayjs(formData.fechaEmision) : null}
            onChange={(fecha) => {
              if (!modoEdicion) return;
              setFormData((p) => ({ ...p, fechaEmision: fecha }));
            }}
            error={!!errors.fechaEmision}
            disabled={!modoEdicion}
          />
          {errors.fechaEmision && (
            <FormHelperText error>{errors.fechaEmision}</FormHelperText>
          )}
        </Box>
      </Box>

      {/* 3️⃣ Monto Total + Moneda */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Monto total *</FormLabel>
          <OutlinedInput
            type="number"
            value={formData.montoTotal || ""}
            onChange={(e) => {
              if (!modoEdicion) return;
              setFormData((p) => ({ ...p, montoTotal: e.target.value }));
            }}
            size="small"
            fullWidth
            error={!!errors.montoTotal}
            disabled={!modoEdicion}
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

      {/* 3️⃣ Categoría */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Categoría</FormLabel>
          <CategoriaAutoComplete
            value={formData.categoria || ""}
            onChange={(valor) => {
              if (!modoEdicion) return;
              setFormData((p) => ({ ...p, categoria: valor }));
            }}
            disabled={!modoEdicion}
          />
        </Box>
      </Box>


      {/* 5️⃣ Datos Vendedor */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Nombre vendedor *</FormLabel>
          <OutlinedInput
            value={formData.vendedorNombre || ""}
            onChange={(e) => {
              if (!modoEdicion) return;
              setFormData((p) => ({ ...p, vendedorNombre: e.target.value }));
            }}
            size="small"
            fullWidth
            error={!!errors.vendedorNombre}
            disabled={!modoEdicion}
          />
          {errors.vendedorNombre && (
            <FormHelperText error>{errors.vendedorNombre}</FormHelperText>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>CUIT vendedor</FormLabel>
          <OutlinedInput
            value={formData.vendedorCuit || ""}
            onChange={(e) => {
              if (!modoEdicion) return;
              setFormData((p) => ({ ...p, vendedorCuit: e.target.value }));
            }}
            size="small"
            fullWidth
            disabled={!modoEdicion}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Condición IVA vendedor</FormLabel>
          <CustomSelect
            value={formData.vendedorCondicionIVA || ""}
            onChange={(valor) => {
              if (!modoEdicion) return;
              setFormData((p) => ({ ...p, vendedorCondicionIVA: valor }));
            }}
            options={["Responsable Inscripto", "Monotributo", "Exento"]}
            width="100%"
            disabled={!modoEdicion}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Domicilio vendedor</FormLabel>
          <OutlinedInput
            value={formData.vendedorDomicilio || ""}
            onChange={(e) => {
              if (!modoEdicion) return;
              setFormData((p) => ({ ...p, vendedorDomicilio: e.target.value }));
            }}
            size="small"
            fullWidth
            disabled={!modoEdicion}
          />
        </Box>
      </Box>

      {/* 6️⃣ Datos Comprador */}
      <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Nombre comprador *</FormLabel>
          <OutlinedInput
            value={formData.compradorNombre || ""}
            onChange={(e) => {
              if (!modoEdicion) return;
              setFormData((p) => ({ ...p, compradorNombre: e.target.value }));
            }}
            size="small"
            fullWidth
            error={!!errors.compradorNombre}
            disabled={!modoEdicion}
          />
          {errors.compradorNombre && (
            <FormHelperText error>{errors.compradorNombre}</FormHelperText>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>CUIT comprador</FormLabel>
          <OutlinedInput
            value={formData.compradorCuit || ""}
            onChange={(e) => {
              if (!modoEdicion) return;
              setFormData((p) => ({ ...p, compradorCuit: e.target.value }));
            }}
            size="small"
            fullWidth
            disabled={!modoEdicion}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Condición IVA comprador</FormLabel>
          <CustomSelect
            value={formData.compradorCondicionIVA || ""}
            onChange={(valor) => {
              if (!modoEdicion) return;
              setFormData((p) => ({ ...p, compradorCondicionIVA: valor }));
            }}
            options={["Responsable Inscripto", "Monotributo", "Exento"]}
            width="100%"
            disabled={!modoEdicion}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <FormLabel>Domicilio comprador</FormLabel>
          <OutlinedInput
            value={formData.compradorDomicilio || ""}
            onChange={(e) => {
              if (!modoEdicion) return;
              setFormData((p) => ({ ...p, compradorDomicilio: e.target.value }));
            }}
            size="small"
            fullWidth
            disabled={!modoEdicion}
          />
        </Box>
      </Box>

    </Box>
  );
}
