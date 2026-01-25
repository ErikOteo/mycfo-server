import React, { useState } from "react";
import { Box, Paper, IconButton, Alert, CircularProgress, Typography } from "@mui/material";
import { Mic, Close, Delete } from "@mui/icons-material";
import CustomButton from "../../../shared-components/CustomButton";
import http from "../../../api/http";
import { styled, keyframes } from "@mui/material/styles";

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 239, 0.6); }
  50% { box-shadow: 0 0 0 20px rgba(76, 175, 239, 0); }
  100% { box-shadow: 0 0 0 0 rgba(76, 175, 239, 0); }
`;

const BigRecordButton = styled(IconButton)(({ theme, recording }) => ({
  width: 100,
  height: 100,
  borderRadius: "50%",
  color: "#fff",
  backgroundColor: recording ? theme.palette.error.main : theme.palette.primary.main,
  ...(recording && { animation: `${pulse} 1.5s infinite` }),
}));

const tipoMovimientoMap = {
  Movimiento: "Movimiento",
  Ingreso: "Ingreso",
  Egreso: "Egreso",
  Deuda: "Deuda",
  Acreencia: "Acreencia",
  Factura: "Factura",
};

export default function CargaAudio({ tipoDoc, endpoint, onResultado, onFallback }) {
  const [grabando, setGrabando] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [parseWarning, setParseWarning] = useState(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    let chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      setAudioUrl(URL.createObjectURL(blob));
      setAudioFile(new File([blob], "grabacion.webm", { type: "audio/webm" }));
      stream.getTracks().forEach((t) => t.stop());
    };

    setParseWarning(null);
    setError(null);
    setMediaRecorder(recorder);
    recorder.start();
    setGrabando(true);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    setGrabando(false);
  };

  const eliminarGrabacion = () => {
    setAudioUrl(null);
    setAudioFile(null);
    setError(null);
    setParseWarning(null);
  };

  const handleSubmit = async () => {
    if (!audioFile) return;
    const usuarioSub = sessionStorage.getItem("sub");
    if (!usuarioSub) {
      setError("No se encontró la sesión del usuario. Volvé a iniciar sesión.");
      return;
    }

    setCargando(true);
    setError(null);
    setParseWarning(null);
    const archivo = audioFile;
    const fd = new FormData();
    fd.append("file", archivo);
    const tipoMovimiento = tipoMovimientoMap[tipoDoc];
    if (tipoMovimiento && endpoint.includes("/movimientos/")) {
      fd.append("tipoMovimiento", tipoMovimiento);
    }
    if (tipoDoc) {
      fd.append("tipoDoc", tipoDoc);
    }
    setAudioUrl(null);
    setAudioFile(null);

    try {
      const response = await http.post(endpoint, fd, {
        headers: {
          // http.js agrega Authorization; dejamos X-Usuario-Sub explícito
          "X-Usuario-Sub": usuarioSub,
        },
      });
      console.log("Respuesta completa del audio:", response.data);
      const { campos, transcript, rawText, warnings } = response.data || {};
      if (warnings?.length) {
        console.warn("Advertencias al procesar audio:", warnings);
      }

      const camposDetectados = campos && Object.entries(campos).some(([key, value]) => {
        if (!key) return false;
        if (key.toLowerCase() === "moneda") {
          return false;
        }
        return !!value;
      });

      if (!camposDetectados) {
        const fallbackTranscript = transcript || rawText;
        const warningPayload = {
          message: "No se pudo interpretar el audio. Por favor grabalo nuevamente procurando mayor claridad.",
          transcript: fallbackTranscript || "Sin transcripción disponible.",
        };
        setParseWarning(warningPayload);
        console.warn("Procesamiento de audio sin campos detectados.", { transcript, warnings });
        if (onFallback) {
          onFallback({
            origen: "audio",
            mensaje: "No pudimos interpretar el audio. Completa los datos manualmente.",
            detalle: warningPayload,
          });
        }
        return;
      }

      if (onResultado) {
        onResultado(response.data);
      }
    } catch (err) {
      console.error("❌ Error en envío:", err);
      const mensaje = err.response?.data?.message || err.message || "Error desconocido al procesar el audio.";
      setError(mensaje);
      if (onFallback) {
        onFallback({
          origen: "audio",
          mensaje,
          detalle: err,
        });
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <Box sx={{ mt: 3, textAlign: "center" }}>
      {!cargando && (
        <BigRecordButton
          sx={{ mt: 5 }}
          recording={grabando ? 1 : 0}
          onClick={grabando ? stopRecording : startRecording}
        >
          {grabando ? <Close /> : <Mic />}
        </BigRecordButton>
      )}

      {!cargando && audioUrl && (
        <>
          <Paper
            sx={{
              mt: 1,
              p: 1.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid",
              borderColor: "grey.400",
              borderRadius: 1,
            }}
          >
            <audio controls src={audioUrl} />
            <IconButton onClick={eliminarGrabacion} color="error">
              <Delete />
            </IconButton>
          </Paper>
          <CustomButton
            label="Enviar audio"
            width="100%"
            sx={{ mt: 2 }}
            onClick={handleSubmit}
          />
        </>
      )}

      {cargando && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={40} />
        </Box>
      )}

      <Box sx={{ mt: 3, textAlign: "left" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {parseWarning && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setParseWarning(null)}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              {parseWarning.message}
            </Typography>
            <Typography variant="body2">
              Transcripción detectada: {parseWarning.transcript}
            </Typography>
          </Alert>
        )}
      </Box>
    </Box>
  );
}
