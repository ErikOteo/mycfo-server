import React from "react";
import { Typography, Grid, Snackbar, Alert } from "@mui/material";
import axios from "axios";
import CustomButton from "../../../shared-components/CustomButton";
import LazyFormWrapper from "./LazyFormWrapper";
import API_CONFIG from "../../../config/api-config";
import dayjs from "dayjs";

// Lazy loading para formularios específicos
const FormFactura = React.lazy(() => import("./forms/FormFactura"));
const FormRegistro = React.lazy(() => import("./forms/FormRegistro"));
const FormIngreso = React.lazy(() => import("./forms/FormIngreso"));
const FormEgreso = React.lazy(() => import("./forms/FormEgreso"));
const FormDeuda = React.lazy(() => import("./forms/FormDeuda"));
const FormAcreencia = React.lazy(() => import("./forms/FormAcreencia"));

// 📌 Campos obligatorios por tipo de documento
const requiredFieldsMap = {
  Factura: [
    "numeroDocumento",
    "versionDocumento",
    "tipoFactura",
    "fechaEmision",
    "montoTotal",
    "categoria",
    "vendedorNombre",
    "compradorNombre",
  ],
  Movimiento: ["montoTotal", "fechaEmision"],
  Ingreso: ["montoTotal", "fechaEmision"],
  Egreso: ["montoTotal", "fechaEmision"],
  Deuda: ["montoTotal", "fechaEmision"],
  Acreencia: ["montoTotal", "fechaEmision"],
};

export default function CargaFormulario({
  tipoDoc,
  endpoint,
  formData,
  setFormData,
  errors,
  setErrors,
}) {
  const [localErrors, setLocalErrors] = React.useState(errors);
  const [snackbar, setSnackbar] = React.useState({ open: false, severity: "info", message: "" });
  const [successSnackbar, setSuccessSnackbar] = React.useState({ open: false, message: "" });

  React.useEffect(() => {
    setFormData((prev) => {
      const actual = prev || {};
      if (actual.moneda) {
        return actual;
      }
      return { ...actual, moneda: "ARS" };
    });
  }, [setFormData]);

  React.useEffect(() => {
    if (!successSnackbar.open) return;
    const timer = setTimeout(
      () => setSuccessSnackbar({ open: false, message: "" }),
      3500
    );
    return () => clearTimeout(timer);
  }, [successSnackbar.open]);

  React.useEffect(() => {
    setLocalErrors(errors);
  }, [errors]);

  React.useEffect(() => {
    setErrors(localErrors);
  }, [localErrors, setErrors]);

    const normalizarDatos = React.useCallback(
    (datos) => {
      const resultado = {};
      Object.entries(datos || {}).forEach(([clave, valor]) => {
        if (dayjs.isDayjs(valor)) {
          // Para fechaEmision y cualquier campo de fecha/hora, conservar también la hora
          const formato = clave === "fechaEmision" ? "YYYY-MM-DDTHH:mm:ss" : "YYYY-MM-DD";
          resultado[clave] = valor.format(formato);
        } else if (Array.isArray(valor)) {
          resultado[clave] = valor.map((item) =>
            dayjs.isDayjs(item)
              ? item.format("YYYY-MM-DD")
              : item ?? ""
          );
        } else if (valor && typeof valor === "object") {
          resultado[clave] = valor;
        } else {
          resultado[clave] = valor ?? "";
        }
      });
      if (resultado.moneda === undefined || resultado.moneda === null || resultado.moneda === "") {
        resultado.moneda = "ARS";
      }
      return resultado;
    },
    []
  );

  const handleSubmit = async () => {
    // ✅ Validación dinámica
    const newErrors = {};
    const requiredFields = requiredFieldsMap[tipoDoc] || [];

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = "Campo obligatorio";
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      alert("⚠️ Por favor completa todos los campos obligatorios");
      return; // 🚫 No enviar si hay errores
    }

    try {
      // Obtener sub del usuario (REQUERIDO)
      const usuarioSub = sessionStorage.getItem("sub");
      
      if (!usuarioSub) {
        alert("❌ Error: No se encontró el usuario en la sesión. Por favor, inicia sesión nuevamente.");
        return;
      }
      
      // Configurar headers - SOLO necesitamos X-Usuario-Sub
      const headers = {
        "X-Usuario-Sub": usuarioSub
      };

      const datosParaEnviar = normalizarDatos(formData);

      // Preparar payload para el endpoint unificado /api/carga-datos
      let payload;
      let tipoMovimiento = null;

      // Determinar tipo y tipoMovimiento
      if (["ingreso", "egreso", "deuda", "acreencia"].includes(tipoDoc.toLowerCase())) {
        // Es un movimiento
        tipoMovimiento = tipoDoc.charAt(0).toUpperCase() + tipoDoc.slice(1); // Ingreso, Egreso, Deuda, Acreencia
        
        payload = {
          tipo: "movimiento",
          metodo: "formulario",
          datos: datosParaEnviar,
          tipoMovimiento: tipoMovimiento
        };
      } else if (tipoDoc.toLowerCase() === "factura") {
        // Es una factura
        payload = {
          tipo: "factura",
          metodo: "formulario",
          datos: datosParaEnviar
        };
      } else {
        // Movimiento genérico
        payload = {
          tipo: "movimiento",
          metodo: "formulario",
          datos: datosParaEnviar
        };
      }
      
      console.log("📤 Enviando datos:", payload);
      console.log("🔐 Headers:", headers);
      
      // Usar endpoint unificado
      const ENDPOINT_UNIFICADO = `${API_CONFIG.REGISTRO}/api/carga-datos`;
      const response = await axios.post(ENDPOINT_UNIFICADO, payload, { headers });

      console.log("✅ Respuesta del servidor:", response.data);
      setSuccessSnackbar({ open: true, message: response.data.mensaje || "Datos guardados exitosamente" });
      setFormData({});
      setLocalErrors({});

    } catch (err) {
      console.error("❌ Error en envío:", err);
      const mensaje = err.response?.data?.mensaje || err.message || "Error desconocido";
      setSnackbar({ open: true, severity: "error", message: mensaje });
    }
  };

  const renderFormulario = () => {
    switch (tipoDoc) {
      case "factura":
        return (
          <LazyFormWrapper>
            <FormFactura
              formData={formData}
              setFormData={setFormData}
              errors={localErrors}
            />
          </LazyFormWrapper>
        );
      case "movimiento":
        return (
          <LazyFormWrapper>
            <FormRegistro
              tipoDoc={tipoDoc}
              formData={formData}
              setFormData={setFormData}
              errors={localErrors}
            />
          </LazyFormWrapper>
        );
      case "ingreso":
        return (
          <LazyFormWrapper>
            <FormIngreso
              formData={formData}
              setFormData={setFormData}
              errors={localErrors}
            />
          </LazyFormWrapper>
        );
      case "egreso":
        return (
          <LazyFormWrapper>
            <FormEgreso
              formData={formData}
              setFormData={setFormData}
              errors={localErrors}
            />
          </LazyFormWrapper>
        );
      case "deuda":
        return (
          <LazyFormWrapper>
            <FormDeuda
              formData={formData}
              setFormData={setFormData}
              errors={localErrors}
            />
          </LazyFormWrapper>
        );
      case "acreencia":
        return (
          <LazyFormWrapper>
            <FormAcreencia
              formData={formData}
              setFormData={setFormData}
              errors={localErrors}
            />
          </LazyFormWrapper>
        );
      default:
        return <Typography>No hay formulario definido para {tipoDoc}</Typography>;
    }
  };

  return (
    <Grid sx={{ mt: 3, width: "100%" }}>
      

      {renderFormulario()}

      <CustomButton
        label={`Enviar ${tipoDoc}`}
        width="100%"
        onClick={handleSubmit}
      />
      {successSnackbar.open && (
        <Alert
          severity="success"
          variant="outlined"
          sx={{ width: "100%", mt: 2 }}
          onClose={() => setSuccessSnackbar({ open: false, message: "" })}
        >
          {successSnackbar.message}
        </Alert>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ open: false, severity: "info", message: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ open: false, severity: "info", message: "" })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
