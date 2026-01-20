import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  ButtonBase,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  Edit,
  Description,
  CameraAlt,
  Mic,
  Receipt,
  SwapHoriz,
} from "@mui/icons-material";

import dayjs from "dayjs";
import CargaFormulario from "./components/CargaFormulario";
import CargaDocumento from "./components/CargaDocumento";
import CargaImagen from "./components/CargaImagen";
import CargaAudio from "./components/CargaAudio";
import VerIngreso from "../movimientos-cargados/components/VerIngreso";
import VerEgreso from "../movimientos-cargados/components/VerEgreso";
import VerDeuda from "../movimientos-cargados/components/VerDeuda";
import VerAcreencia from "../movimientos-cargados/components/VerAcreencia";
import API_CONFIG from "../../config/api-config";

export default function CargaGeneral() {
  const [tipoDoc, setTipoDoc] = useState(""); // Factura, Movimiento...
  const [modoCarga, setModoCarga] = useState(""); // formulario, documento, foto, audio
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [dialogTipoDoc, setDialogTipoDoc] = useState("");
  const [dialogEndpoint, setDialogEndpoint] = useState("");
  const [dialogData, setDialogData] = useState(null);
  const [dialogMessage, setDialogMessage] = useState("");

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

  const renderVistaPrevia = () => {
    if (!dialogData) return null;
    const tipo = dialogTipoDoc;
    if (!tipo) return null;
    if (tipo === "ingreso") {
      return <VerIngreso movimiento={dialogData} />;
    }
    if (tipo === "egreso") {
      return <VerEgreso movimiento={dialogData} />;
    }
    if (tipo === "deuda") {
      return <VerDeuda movimiento={dialogData} />;
    }
    if (tipo === "acreencia") {
      return <VerAcreencia movimiento={dialogData} />;
    }
    return null;
  };

  const API_BASE = API_CONFIG.REGISTRO;

  const endpointMap = {
    Factura: {
      formulario: `${API_BASE}/facturas/formulario`,
      documento: `${API_BASE}/facturas/documento`,
      foto: `${API_BASE}/facturas/foto`,
      audio: `${API_BASE}/api/carga-datos/facturas/audio`,
    },
    Movimiento: {
      formulario: `${API_BASE}/movimientos`,
      documento: `${API_BASE}/movimientos/documento`,
      foto: `${API_BASE}/movimientos/foto`,
      audio: `${API_BASE}/api/carga-datos/movimientos/audio`,
    },
    Ingreso: {
      formulario: `${API_BASE}/movimientos`,
      documento: `${API_BASE}/movimientos/ingreso/documento`,
      foto: `${API_BASE}/movimientos/foto`,
      audio: `${API_BASE}/api/carga-datos/movimientos/audio`,
    },
    Egreso: {
      formulario: `${API_BASE}/movimientos`,
      documento: `${API_BASE}/movimientos/egreso/documento`,
      foto: `${API_BASE}/movimientos/foto`,
      audio: `${API_BASE}/api/carga-datos/movimientos/audio`,
    },
    Deuda: {
      formulario: `${API_BASE}/movimientos`,
      documento: `${API_BASE}/movimientos/deuda/documento`,
      foto: `${API_BASE}/movimientos/foto`,
      audio: `${API_BASE}/api/carga-datos/movimientos/audio`,
    },
    Acreencia: {
      formulario: `${API_BASE}/movimientos`,
      documento: `${API_BASE}/movimientos/acreencia/documento`,
      foto: `${API_BASE}/movimientos/foto`,
      audio: `${API_BASE}/api/carga-datos/movimientos/audio`,
    },
  };

  const tipos = [
    { key: "Factura", label: "Factura", icon: <Receipt fontSize="large" /> },
    { key: "Ingreso", label: "Ingreso", icon: <SwapHoriz fontSize="large" /> },
    { key: "Egreso", label: "Egreso", icon: <SwapHoriz fontSize="large" /> },
    { key: "Deuda", label: "Deuda", icon: <SwapHoriz fontSize="large" /> },
    {
      key: "Acreencia",
      label: "Acreencia",
      icon: <SwapHoriz fontSize="large" />,
    },
  ];

  const modos = [
    { key: "formulario", label: "Formulario", icon: <Edit fontSize="large" /> },
    {
      key: "documento",
      label: "Documento",
      icon: <Description fontSize="large" />,
    },
    { key: "foto", label: "Foto", icon: <CameraAlt fontSize="large" /> },
    { key: "audio", label: "Audio", icon: <Mic fontSize="large" /> },
  ];

  const abrirDialogoFormulario = ({ datos = {}, vistaPrevia = null, mensaje = "" } = {}) => {
    const tipoDocLower = (tipoDoc || "").toLowerCase();
    setDialogTipoDoc(tipoDocLower);
    const formularioEndpoint = endpointMap[tipoDoc]?.formulario;
    setDialogEndpoint(formularioEndpoint || "");
    setFormData(datos);
    setDialogData(vistaPrevia);
    setDialogMessage(mensaje);
    setErrors({});
    setFormDialogOpen(true);
  };

  const handleFallbackManual = (info) => {
    const mensaje =
      info?.mensaje ||
      "No pudimos procesar el archivo. Completa los datos manualmente.";
    abrirDialogoFormulario({
      datos: {},
      vistaPrevia: null,
      mensaje,
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
      if (clave === "fechaEmision") {
        const fecha = dayjs(valor);
        if (fecha.isValid()) {
          normalizados[clave] = fecha;
        }
      } else {
        normalizados[clave] = valor;
      }
    });
    normalizados.moneda = "ARS";
    const merged = { ...formData, ...normalizados };
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

    if (camposDetectados) {
      console.table(
        Object.entries(camposLog).map(([campo, valor]) => ({
          campo,
          valor,
        }))
      );
    } else {
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
    console.groupEnd();
    const vistaPrevia = prepararVistaPrevia(merged);
    abrirDialogoFormulario({
      datos: merged,
      vistaPrevia,
      mensaje: "",
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
      if (clave === "fechaEmision" || clave === "fechaVencimiento") {
        const fecha = dayjs(valor);
        if (fecha.isValid()) {
          normalizados[clave] = fecha;
        }
      } else if (["montoTotal", "montoCuota", "tasaInteres", "cantidadCuotas", "cuotasPagadas"].includes(clave)) {
        normalizados[clave] = normalizarNumero(valor);
      } else {
        normalizados[clave] = valor;
      }
    });
    if (Object.keys(normalizados).length > 0 && !normalizados.moneda) {
      normalizados.moneda = "ARS";
    }
    const merged = { ...formData, ...normalizados };

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
      mensaje: "",
    });
  };

  const renderContenido = () => {
    if (!tipoDoc || !modoCarga)
      return (
        <Typography sx={{ mt: 3 }}>Seleccioná un tipo y un método</Typography>
      );

    const endpoint = endpointMap[tipoDoc]?.[modoCarga];
    const tipoDocLower = (tipoDoc || "").toLowerCase();

    switch (modoCarga) {
      case "formulario":
        return (
          <CargaFormulario
            tipoDoc={tipoDocLower}
            endpoint={endpoint}
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
          />
        );
      case "documento":
        return <CargaDocumento tipoDoc={tipoDoc} endpoint={endpoint} />;
      case "foto":
        return (
          <CargaImagen
            tipoDoc={tipoDoc}
            endpoint={endpoint}
            onResultado={handleResultadoFoto}
            onFallback={handleFallbackManual}
            dialogOpen={formDialogOpen}
          />
        );
      case "audio":
        return (
          <CargaAudio
            tipoDoc={tipoDoc}
            endpoint={endpoint}
            onResultado={handleResultadoAudio}
            onFallback={handleFallbackManual}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", p: 3 }}>
        {/* Encabezado */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            Registro de Documentos y Movimientos
          </Typography>
          <Typography variant="subtitle1">
            Elegí qué tipo de registro querés cargar
          </Typography>
        </Box>

        {/* Botones de selección de tipo */}
        {!tipoDoc && (
          <Grid container spacing={3} justifyContent="center">
            {tipos.map((t) => (
              <Grid item key={t.key}>
                <ButtonBase
                  onClick={() => {
                    setTipoDoc(t.key);
                    setModoCarga(""); // resetear modo al elegir tipo
                    setFormData({});
                    setErrors({});
                    setFormDialogOpen(false);
                    setDialogTipoDoc("");
                    setDialogEndpoint("");
                    setDialogData(null);
                    setDialogMessage("");
                  }}
                  sx={{
                    flexDirection: "column",
                    p: 3,
                    borderRadius: 3,
                    border: "2px solid",
                    borderColor: "divider",
                    width: 150,
                    height: 150,
                    justifyContent: "center",
                    alignItems: "center",
                    bgcolor: "background.paper",
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  {t.icon}
                  <Typography sx={{ mt: 1 }} variant="subtitle1">
                    {t.label}
                  </Typography>
                </ButtonBase>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Botones de métodos de carga */}
        {tipoDoc && !modoCarga && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Elegí el método de carga para {tipoDoc}
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              {modos.map((m) => (
                <Grid item key={m.key}>
                  <ButtonBase
                    onClick={() => {
                      setModoCarga(m.key);
                      setErrors({});
                      setFormDialogOpen(false);
                      setDialogData(null);
                      setDialogMessage("");
                    }}
                    sx={{
                      flexDirection: "column",
                      p: 3,
                      borderRadius: 3,
                      border: "2px solid",
                      borderColor: "divider",
                      width: 150,
                      height: 150,
                      justifyContent: "center",
                      alignItems: "center",
                      bgcolor: "background.paper",
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    {m.icon}
                    <Typography sx={{ mt: 1 }} variant="subtitle1">
                      {m.label}
                    </Typography>
                  </ButtonBase>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Vista final de carga */}
        {tipoDoc && modoCarga && (
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <ButtonBase
                onClick={() => {
                  setModoCarga("");
                  setFormData({});
                  setErrors({});
                  setFormDialogOpen(false);
                  setDialogData(null);
                  setDialogMessage("");
                }}
                sx={{
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2">← Cambiar método</Typography>
              </ButtonBase>
              <ButtonBase
                onClick={() => {
                  setTipoDoc("");
                  setModoCarga("");
                  setFormData({});
                  setErrors({});
                  setFormDialogOpen(false);
                  setDialogTipoDoc("");
                  setDialogEndpoint("");
                  setDialogData(null);
                  setDialogMessage("");
                }}
                sx={{
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2">← Cambiar tipo</Typography>
              </ButtonBase>
            </Box>
            {renderContenido()}
          </Box>
        )}
      </Box>
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {dialogData && dialogTipoDoc === "factura" && renderVistaPrevia()}
            {dialogMessage && (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {dialogMessage}
              </Typography>
            )}
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {dialogData
                ? "Podés editar los datos antes de guardar"
                : "Cargá los datos y enviá el registro"}
            </Typography>
            <CargaFormulario
              tipoDoc={dialogTipoDoc || (tipoDoc || "").toLowerCase()}
              endpoint={dialogEndpoint || endpointMap[tipoDoc]?.formulario}
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
            />
          </Box>
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
    </>
  );
}
