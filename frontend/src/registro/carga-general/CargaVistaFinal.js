import React, { useState, Suspense } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import VerIngreso from "../movimientos-cargados/components/VerIngreso";
import VerEgreso from "../movimientos-cargados/components/VerEgreso";
import VerDeuda from "../movimientos-cargados/components/VerDeuda";
import VerAcreencia from "../movimientos-cargados/components/VerAcreencia";
import API_CONFIG from "../../config/api-config";
import { useChatbotScreenContext } from "../../shared-components/useChatbotScreenContext";
import { sessionService } from "../../shared-services/sessionService";

// Lazy loading para componentes pesados
const CargaFormulario = React.lazy(() =>
  import("./components/CargaFormulario")
);
const CargaDocumento = React.lazy(() => import("./components/CargaDocumento"));
const CargaImagen = React.lazy(() => import("./components/CargaImagen"));
const CargaAudio = React.lazy(() => import("./components/CargaAudio"));

export default function CargaVistaFinal() {
  const { tipo, modo } = useParams();
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState(null);
  const [dialogEndpoint, setDialogEndpoint] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const API_BASE = API_CONFIG.REGISTRO;

  const endpointMap = {
    factura: {
      formulario: `${API_BASE}/api/carga-datos`,
      documento: `${API_BASE}/api/carga-datos/facturas/documento`,
      foto: `${API_BASE}/facturas/foto`,
      audio: `${API_BASE}/api/carga-datos/facturas/audio`,
    },
    movimiento: {
      formulario: `${API_BASE}/api/carga-datos`,
      documento: `${API_BASE}/movimientos/documento`,
      foto: `${API_BASE}/movimientos/foto`,
      audio: `${API_BASE}/api/carga-datos/movimientos/audio`,
    },
    ingreso: {
      formulario: `${API_BASE}/api/carga-datos`,
      documento: `${API_BASE}/movimientos/ingreso/documento`,
      foto: `${API_BASE}/movimientos/foto`,
      audio: `${API_BASE}/api/carga-datos/movimientos/audio`,
    },
    egreso: {
      formulario: `${API_BASE}/api/carga-datos`,
      documento: `${API_BASE}/movimientos/egreso/documento`,
      foto: `${API_BASE}/movimientos/foto`,
      audio: `${API_BASE}/api/carga-datos/movimientos/audio`,
    },
    deuda: {
      formulario: `${API_BASE}/api/carga-datos`,
      documento: `${API_BASE}/movimientos/deuda/documento`,
      foto: `${API_BASE}/movimientos/foto`,
      audio: `${API_BASE}/api/carga-datos/movimientos/audio`,
    },
    acreencia: {
      formulario: `${API_BASE}/api/carga-datos`,
      documento: `${API_BASE}/movimientos/acreencia/documento`,
      foto: `${API_BASE}/movimientos/foto`,
      audio: `${API_BASE}/api/carga-datos/movimientos/audio`,
    },
  };

  const endpoint = endpointMap[tipo]?.[modo];
  const disableDynamicCategorias = tipo === "factura" && modo === "documento";

  const chatbotContext = React.useMemo(
    () => ({
      screen: "carga-vista-final",
      tipo,
      modo,
      endpoint,
      formData,
      dialogOpen: formDialogOpen,
      dialogMessage,
      vistaPreviaDisponible: Boolean(dialogData),
    }),
    [tipo, modo, endpoint, formData, formDialogOpen, dialogMessage, dialogData]
  );

  useChatbotScreenContext(chatbotContext);

  const prepararVistaPrevia = (datos) => {
    if (!datos) return null;
    const normalizarMonto = (valor) => {
      if (valor === null || valor === undefined || valor === "") return "";
      const numero = Number(String(valor).replace(",", "."));
      return Number.isNaN(numero) ? valor : numero;
    };
    const fecha = datos.fechaEmision
      ? dayjs(datos.fechaEmision).format("YYYY-MM-DDTHH:mm:ss")
      : "";
    return {
      ...datos,
      montoTotal: normalizarMonto(datos.montoTotal),
      fechaEmision: fecha,
    };
  };

  const isLimitedField = (key) =>
    [
      "tipoFactura",
      "versionDocumento",
      "moneda",
      "medioPago",
      "periodicidad",
      "vendedorCondicionIVA",
      "compradorCondicionIVA",
    ].includes(key);

  const sanitizeLimitedField = (key, value) => {
    if (value === null || value === undefined) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    const lower = raw.toLowerCase();
    switch (key) {
      case "tipoFactura": {
        const match = raw.match(/\b([ABC])\b/i);
        return match ? match[1].toUpperCase() : null;
      }
      case "versionDocumento": {
        if (lower.includes("original")) return "Original";
        if (lower.includes("duplicado") || lower.includes("dup") || lower.includes("copia")) return "Duplicado";
        return null;
      }
      case "moneda": {
        if (lower.includes("usd") || lower.includes("dolar") || lower.includes("dólar") || lower.includes("u$s")) return "USD";
        if (lower.includes("ars") || lower.includes("peso")) return "ARS";
        return null;
      }
      case "medioPago": {
        if (lower.includes("efectivo") || /\bcash\b/i.test(lower)) return "Efectivo";
        if (lower.includes("transferencia") || lower.includes("transf") || lower.includes("banco") || lower.includes("cbu")) return "Transferencia";
        if (lower.includes("cheque")) return "Cheque";
        if (lower.includes("tarjeta") || lower.includes("debito") || lower.includes("débito") || lower.includes("credito") || lower.includes("crédito")) return "Tarjeta";
        if (lower.includes("mercadopago") || lower.includes("mercado pago") || /\bmp\b/i.test(lower)) return "MercadoPago";
        if (lower.includes("otro")) return "Otro";
        return null;
      }
      case "periodicidad": {
        if (lower.includes("mensual")) return "Mensual";
        if (lower.includes("bimestral")) return "Bimestral";
        if (lower.includes("trimestral")) return "Trimestral";
        if (lower.includes("semestral")) return "Semestral";
        if (lower.includes("anual")) return "Anual";
        return null;
      }
      case "vendedorCondicionIVA":
      case "compradorCondicionIVA": {
        if (lower.includes("responsable")) return "Responsable Inscripto";
        if (lower.includes("monotributo") || lower.includes("mono")) return "Monotributo";
        if (lower.includes("exento")) return "Exento";
        return null;
      }
      default:
        return raw;
    }
  };

  const renderVistaPrevia = () => {
    if (!dialogData) return null;
    switch (tipo) {
      case "ingreso":
        return <VerIngreso movimiento={dialogData} />;
      case "egreso":
        return <VerEgreso movimiento={dialogData} />;
      case "deuda":
        return <VerDeuda movimiento={dialogData} />;
      case "acreencia":
        return <VerAcreencia movimiento={dialogData} />;
      default:
        return null;
    }
  };

  const completarEmpresaPorVersion = (datos) => {
    if (!datos || (tipo || "").toLowerCase() !== "factura") return datos;
    const empresa = sessionService.getEmpresa();
    if (!empresa) return datos;
    const version = datos.versionDocumento;
    if (version === "Original") {
      return {
        ...datos,
        compradorNombre: datos.compradorNombre || empresa.nombre || "",
        compradorCuit: datos.compradorCuit || empresa.cuit || "",
        compradorCondicionIVA: datos.compradorCondicionIVA || empresa.condicionIVA || "",
        compradorDomicilio: datos.compradorDomicilio || empresa.domicilio || "",
      };
    }
    if (version === "Duplicado") {
      return {
        ...datos,
        vendedorNombre: datos.vendedorNombre || empresa.nombre || "",
        vendedorCuit: datos.vendedorCuit || empresa.cuit || "",
        vendedorCondicionIVA: datos.vendedorCondicionIVA || empresa.condicionIVA || "",
        vendedorDomicilio: datos.vendedorDomicilio || empresa.domicilio || "",
      };
    }
    return datos;
  };

  const abrirDialogoFormulario = ({ datos = {}, vistaPrevia = null, mensaje = "" } = {}) => {
    setFormData(datos);
    setDialogData(vistaPrevia);
    setDialogEndpoint(endpointMap[tipo]?.formulario || "");
    setDialogMessage(mensaje);
    setErrors({});
    setFormDialogOpen(true);
  };

  const resetFormulario = () => {
    setFormData({});
    setErrors({});
    setDialogData(null);
    setDialogMessage("");
    setFormDialogOpen(false);
  };

  const handleFallbackManual = (info) => {
    abrirDialogoFormulario({
      datos: {},
      vistaPrevia: null,
      mensaje:
        info?.mensaje ||
        "No pudimos procesar el archivo. Completa los datos manualmente.",
    });
  };

  const handleResultadoAudio = (respuesta) => {
    if (!respuesta) return;
    console.group("Resultado de audio");
    console.log("Payload recibido:", respuesta);
    const campos = respuesta.campos || {};
    const normalizados = {};
    Object.entries(campos).forEach(([clave, valor]) => {
      if (!valor) return;
      const sanitized = sanitizeLimitedField(clave, valor);
      if (sanitized === null) {
        return;
      }
      const valueToUse = sanitized;
      if (clave === "fechaEmision") {
        const fecha = dayjs(valueToUse);
        if (fecha.isValid()) {
          normalizados[clave] = fecha;
        }
      } else {
        normalizados[clave] = valueToUse;
      }
    });
    const merged = completarEmpresaPorVersion({ ...formData, ...normalizados });

    const transcript =
      respuesta.transcript ||
      respuesta.texto ||
      respuesta.text ||
      respuesta.rawTranscript ||
      "";
    if (transcript) {
      console.info("Transcripción de audio:", transcript);
    } else {
      console.warn("No se recibió texto transcripto en la respuesta.");
    }

    const camposLog = Object.keys(normalizados).length ? normalizados : campos;
    const camposDetectados =
      camposLog &&
      Object.entries(camposLog).some(([campo, valor]) => {
        if (!campo) return false;
        if (campo.toLowerCase() === "moneda") return false;
        if (valor === null || valor === undefined) return false;
        return String(valor).trim() !== "";
      });

    if (!camposDetectados) {
      console.warn(
        "Autocompletado por audio: no se detectaron campos para completar."
      );
      handleFallbackManual({
        mensaje:
          "No pudimos interpretar el audio. Completa los datos manualmente.",
      });
      console.groupEnd();
      return;
    }

    console.table(
      Object.entries(camposLog).map(([campo, valor]) => ({
        campo,
        valor,
      }))
    );
    console.groupEnd();

    const vistaPrevia = prepararVistaPrevia(merged);
    abrirDialogoFormulario({
      datos: merged,
      vistaPrevia,
    });
  };

  const handleResultadoFoto = (respuesta) => {
    if (!respuesta) return;
    console.group("Resultado de foto");
    console.log("Payload recibido:", respuesta);
    const campos = respuesta.campos || {};
    const normalizados = {};
    const normalizarNumero = (valor) => {
      if (valor === null || valor === undefined || valor === "") return valor;
      const texto = String(valor).trim().replace(/\s+/g, "");
      if (texto.includes(",") && texto.includes(".")) {
        return texto.replace(/\./g, "").replace(",", ".");
      }
      if (texto.includes(",")) {
        return texto.replace(",", ".");
      }
      return texto;
    };
    Object.entries(campos).forEach(([clave, valor]) => {
      if (valor === null || valor === undefined || valor === "") return;
      const sanitized = sanitizeLimitedField(clave, valor);
      if (sanitized === null) {
        if (isLimitedField(clave)) {
          normalizados[clave] = null;
        }
        return;
      }
      const valueToUse = sanitized;
      if (clave === "fechaEmision" || clave === "fechaVencimiento") {
        const fecha = dayjs(valueToUse);
        if (fecha.isValid()) {
          normalizados[clave] = fecha;
        }
      } else if (["montoTotal", "montoCuota", "tasaInteres", "cantidadCuotas", "cuotasPagadas"].includes(clave)) {
        normalizados[clave] = normalizarNumero(valueToUse);
      } else {
        normalizados[clave] = valueToUse;
      }
    });
    if (Object.keys(normalizados).length > 0 && !normalizados.moneda) {
      normalizados.moneda = "ARS";
    }
    const merged = completarEmpresaPorVersion({ ...formData, ...normalizados });

    const camposDetectados =
      Object.entries(normalizados).some(([campo, valor]) => {
        if (!campo) return false;
        if (campo.toLowerCase() === "moneda") return false;
        if (valor === null || valor === undefined) return false;
        return String(valor).trim() !== "";
      });

    if (!camposDetectados) {
      console.warn(
        "Autocompletado por foto: no se detectaron campos para completar."
      );
      handleFallbackManual({
        mensaje:
          "No pudimos interpretar la imagen. Completa los datos manualmente.",
      });
      console.groupEnd();
      return;
    }

    console.table(
      Object.entries(normalizados).map(([campo, valor]) => ({
        campo,
        valor,
      }))
    );
    console.groupEnd();
    const vistaPrevia = prepararVistaPrevia(merged);
    abrirDialogoFormulario({
      datos: merged,
      vistaPrevia,
    });
  };

  const renderContenido = () => {
    const LoadingFallback = () => (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 200,
        }}
      >
        <CircularProgress />
      </Box>
    );

    switch (modo) {
      case "formulario":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <CargaFormulario
              tipoDoc={tipo}
              endpoint={endpoint}
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
              disableDynamicCategorias={disableDynamicCategorias}
            />
          </Suspense>
        );
      case "documento":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <CargaDocumento
              tipoDoc={tipo}
              endpoint={endpoint}
              onResultado={handleResultadoFoto}
              onFallback={handleFallbackManual}
            />
          </Suspense>
        );
      case "foto":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <CargaImagen
              tipoDoc={tipo}
              endpoint={endpoint}
              onResultado={handleResultadoFoto}
              onFallback={handleFallbackManual}
              dialogOpen={formDialogOpen}
              onNewCapture={resetFormulario}
            />
          </Suspense>
        );
      case "audio":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <CargaAudio
              tipoDoc={tipo}
              endpoint={endpoint}
              onResultado={handleResultadoAudio}
              onFallback={handleFallbackManual}
              onNewCapture={resetFormulario}
            />
          </Suspense>
        );
      default:
        return <Typography>No se encontró vista</Typography>;
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1000,
        mx: "auto",
        mt: 1,
        p: 3,
      }}
    >
      <Typography variant="h5" sx={{ mb: 2, textAlign: "center" }}>
        Carga de {tipo} por {modo}
      </Typography>
      {renderContenido()}
      <Dialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          setDialogData(null);
          setDialogMessage("");
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {dialogData
            ? "Revisá y completá la información detectada"
            : "Completá los datos manualmente"}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Suspense
            fallback={
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            }
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {dialogData && tipo === "factura" && renderVistaPrevia()}
              {dialogMessage && (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {dialogMessage}
                </Typography>
              )}
              <CargaFormulario
                tipoDoc={tipo}
                endpoint={dialogEndpoint}
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                setErrors={setErrors}
                disableDynamicCategorias={disableDynamicCategorias}
              />
            </Box>
          </Suspense>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setFormDialogOpen(false);
              setDialogData(null);
              setDialogMessage("");
            }}
            variant="outlined"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
