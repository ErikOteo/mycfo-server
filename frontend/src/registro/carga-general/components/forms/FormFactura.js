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

const CURRENCY_OPTIONS = ["ARS", "USD"];

export default function FormFactura({
  formData,
  setFormData,
  errors = {},
  modoEdicion = true,
  disableDynamicCategorias = false,
}) {
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

  // Función para autocompletar datos según la versión (sin pisar lo detectado por audio)
  const autocompletarDatos = (version) => {
    console.log('Autocompletando datos para versión:', version);
    console.log('Datos de empresa disponibles:', datosEmpresa);

    if (!datosEmpresa) {
      console.log('No hay datos de empresa disponibles');
      return;
    }

    if (version === "Original") {
      // Para Original: empresa va en comprador (sin borrar vendedor)
      console.log('Autocompletando datos del comprador');
      setFormData((p) => (modoEdicion ? {
        ...p,
        compradorNombre: p.compradorNombre || datosEmpresa.nombre || "",
        compradorCuit: p.compradorCuit || datosEmpresa.cuit || "",
        compradorCondicionIVA: p.compradorCondicionIVA || datosEmpresa.condicionIVA || "",
        compradorDomicilio: p.compradorDomicilio || datosEmpresa.domicilio || ""
      } : p));
    } else if (version === "Duplicado") {
      // Para Duplicado: empresa va en vendedor (sin borrar comprador)
      console.log('Autocompletando datos del vendedor');
      setFormData((p) => (modoEdicion ? {
        ...p,
        vendedorNombre: p.vendedorNombre || datosEmpresa.nombre || "",
        vendedorCuit: p.vendedorCuit || datosEmpresa.cuit || "",
        vendedorCondicionIVA: p.vendedorCondicionIVA || datosEmpresa.condicionIVA || "",
        vendedorDomicilio: p.vendedorDomicilio || datosEmpresa.domicilio || ""
      } : p));
    }
  };

  const inferirTipoFactura = (vendedorCondicion, compradorCondicion) => {
    if (!vendedorCondicion || !compradorCondicion) return "";
    const vendedor = vendedorCondicion.toLowerCase();
    const comprador = compradorCondicion.toLowerCase();
    const esRI = (texto) => texto.includes("responsable");
    const esMono = (texto) => texto.includes("monotributo") || texto.includes("mono");
    const esExento = (texto) => texto.includes("exento");

    if (esRI(vendedor) && esRI(comprador)) return "A";
    if (esRI(vendedor) && (esMono(comprador) || esExento(comprador))) return "B";
    if (esMono(vendedor) || esExento(vendedor)) return "C";
    return "";
  };

  // Si la versión ya viene seteada (por autocompletado), completar datos automáticamente
  useEffect(() => {
    if (!modoEdicion) return;
    if (!datosEmpresa) return;
    if (!formData.versionDocumento) return;
    autocompletarDatos(formData.versionDocumento);
  }, [formData.versionDocumento, datosEmpresa, modoEdicion]);

  useEffect(() => {
    if (!modoEdicion) return;
    if (formData.tipoFactura) return;
    if (!formData.vendedorCondicionIVA || !formData.compradorCondicionIVA) return;
    const tipo = inferirTipoFactura(formData.vendedorCondicionIVA, formData.compradorCondicionIVA);
    if (!tipo) return;
    setFormData((p) => ({ ...p, tipoFactura: tipo }));
  }, [
    formData.tipoFactura,
    formData.vendedorCondicionIVA,
    formData.compradorCondicionIVA,
    modoEdicion,
    setFormData,
  ]);


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
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, width: "100%" }}>
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
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, width: "100%" }}>
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
          <CustomSelect
            value={formData.moneda || "ARS"}
            onChange={(valor) => {
              if (!modoEdicion) return;
              setFormData((p) => ({ ...p, moneda: valor || "ARS" }));
            }}
            options={CURRENCY_OPTIONS}
            width="100%"
            disabled={!modoEdicion}
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
            disableDynamic={disableDynamicCategorias}
          />
        </Box>
      </Box>

      {/* 4️⃣ Descripción */}
      <Box>
        <FormLabel>Descripción</FormLabel>
        <OutlinedInput
          value={formData.descripcion || ""}
          onChange={(e) => {
            if (!modoEdicion) return;
            setFormData((p) => ({ ...p, descripcion: e.target.value }));
          }}
          size="small"
          fullWidth
          multiline
          disabled={!modoEdicion}
        />
      </Box>


      {/* 5️⃣ Datos Vendedor */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, width: "100%" }}>
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
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, width: "100%" }}>
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
