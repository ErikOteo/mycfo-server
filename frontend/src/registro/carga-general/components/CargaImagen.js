import React, { useState, useRef, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Alert,
  Button,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import { CameraAlt, Check, Close, Delete } from "@mui/icons-material";
import Webcam from "react-webcam";
import CustomButton from "../../../shared-components/CustomButton";
import ImageIcon from "@mui/icons-material/Image";
import http from "../../../api/http";

const tipoMovimientoMap = {
  Movimiento: "Movimiento",
  Ingreso: "Ingreso",
  Egreso: "Egreso",
  Deuda: "Deuda",
  Acreencia: "Acreencia",
};

export default function CargaImagen({ tipoDoc, endpoint, onResultado, onFallback, dialogOpen, onNewCapture }) {
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [capturando, setCapturando] = useState(true);
  const [fotoTemporal, setFotoTemporal] = useState(null);
  const [fotoFinal, setFotoFinal] = useState(null);
  const [fotoNombre, setFotoNombre] = useState(null);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [usarCamaraDefault, setUsarCamaraDefault] = useState(false);

  const esMobile = useMemo(
    () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ""),
    []
  );

  const videoConstraints = useMemo(() => {
    if (!esMobile || usarCamaraDefault) {
      return undefined;
    }
    return { facingMode: { ideal: "environment" } };
  }, [esMobile, usarCamaraDefault]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const tomarFoto = () => {
    if (onNewCapture) {
      onNewCapture();
    }
    setError(null);
    const img = webcamRef.current.getScreenshot();
    setFotoTemporal(img);
    setCapturando(false);
  };

  const aceptarFoto = () => {
    setFotoFinal(fotoTemporal);
    setFotoNombre("foto-capturada.jpg");
    setFotoTemporal(null);
    setCapturando(true);
  };

  const rechazarFoto = () => {
    setFotoTemporal(null);
    setCapturando(true);
  };

  const eliminarFoto = () => {
    setFotoFinal(null);
    setFotoNombre(null);
  };

  const seleccionarArchivo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (onNewCapture) {
      onNewCapture();
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setFotoFinal(reader.result);
      setFotoNombre(file.name || "imagen.jpg");
      setFotoTemporal(null);
      setCapturando(true);
    };
    reader.readAsDataURL(file);
  };

  const dataURLtoBlob = (dataURL) => {
    const byteString = atob(dataURL.split(",")[1]);
    const mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const handleSubmit = async () => {
    if (!fotoFinal) return;
    if (!endpoint) {
      setError("No se encontró el endpoint para subir las fotos.");
      if (onFallback) {
        onFallback({
          origen: "foto",
          mensaje: "No se encontró el endpoint para subir las fotos. Carga los datos manualmente.",
        });
      }
      return;
    }
    try {
      setCargando(true);
      const fd = new FormData();
      fd.append("files", dataURLtoBlob(fotoFinal), fotoNombre || "imagen.jpg");
      const tipoMovimiento = tipoMovimientoMap[tipoDoc];
      if (tipoMovimiento && endpoint.includes("/movimientos/")) {
        fd.append("tipoMovimiento", tipoMovimiento);
      }
      if (tipoDoc) {
        fd.append("tipoDoc", tipoDoc);
      }
      const usuarioSub = sessionStorage.getItem("sub");
      const response = await http.post(endpoint, fd, {
        headers: {
          // http.js meterá Authorization + X-Usuario-Sub si faltan
          "X-Usuario-Sub": usuarioSub,
        },
      });
      const { campos, warnings } = response.data || {};
      if (warnings?.length) {
        console.warn("Advertencias al procesar imagen:", warnings);
      }

      const camposDetectados =
        campos &&
        Object.entries(campos).some(([key, value]) => {
          if (!key) return false;
          if (key.toLowerCase() === "moneda") return false;
          return value !== null && value !== undefined && String(value).trim() !== "";
        });

      if (!camposDetectados) {
        const warningPayload = {
          message: "No se pudo interpretar la imagen. Proba con una foto mas nitida.",
        };
        console.warn("Procesamiento de imagen sin campos detectados.", warningPayload);
        if (onFallback) {
          onFallback({
            origen: "foto",
            mensaje: "No pudimos interpretar la imagen. Completa los datos manualmente.",
            detalle: warningPayload,
          });
        }
        return;
      }

      if (onResultado) {
        onResultado(response.data);
      } else {
        setSnackbar({ open: true, message: "¡Fotos enviadas con éxito! 📸✅", severity: "success" });
      }
      setFotoFinal(null);
      setFotoNombre(null);
      setError(null);
    } catch (err) {
      console.error("❌ Error en envío de foto:", err);
      const mensaje = err.response?.data?.message || err.message || "Error al procesar las fotos.";
      setSnackbar({ open: true, message: mensaje, severity: "error" });
      setError(mensaje);
      if (onFallback) {
        onFallback({
          origen: "foto",
          mensaje,
          detalle: err,
        });
      }
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (dialogOpen) {
    return null;
  }

  return (
    <Box sx={{ mt: 3 }}>

      <Box
        sx={{
          position: "relative",
          width: "100%",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {capturando ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMediaError={() => {
              if (!usarCamaraDefault) {
                setUsarCamaraDefault(true);
              }
            }}
            style={{ width: "100%" }}
          />
        ) : (
          <img src={fotoTemporal} alt="captura" style={{ width: "100%" }} />
        )}

        {capturando ? (
          <IconButton
            onClick={tomarFoto}
            color="primary"
            disabled={cargando}
            sx={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              width: 50,
              height: 50,
            }}
          >
            <CameraAlt />
          </IconButton>
        ) : (
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <IconButton onClick={rechazarFoto} color="error" disabled={cargando} sx={{ width: 50, height: 50 }}>
              <Close />
            </IconButton>
            <IconButton onClick={aceptarFoto} color="success" disabled={cargando} sx={{ width: 50, height: 50 }}>
              <Check />
            </IconButton>
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={seleccionarArchivo}
          style={{ display: "none" }}
        />
        <Button
          variant="outlined"
          disabled={cargando}
          onClick={() => fileInputRef.current?.click()}
        >
          Subir imagen desde PC
        </Button>
      </Box>

      {fotoFinal && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 3 }}>
            Imagen seleccionada:
          </Typography>
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
            <Typography variant="body2">{fotoNombre || "imagen.jpg"}</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton onClick={() => setFotoAmpliada(fotoFinal)} size="small" color="primary">
                <ImageIcon />
              </IconButton>
              <IconButton onClick={eliminarFoto} size="small" color="error">
                <Delete />
              </IconButton>
            </Box>
          </Paper>

          <CustomButton
            label="Subir imagen"
            width="100%"
            sx={{ mt: 2 }}
            onClick={handleSubmit}
            disabled={cargando}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </>
      )}

      <Dialog open={Boolean(fotoAmpliada)} onClose={() => setFotoAmpliada(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Vista previa
          <IconButton onClick={() => setFotoAmpliada(null)} size="small" color="error">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
          {fotoAmpliada && (
            <img
              src={fotoAmpliada}
              alt="ampliada"
              style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 8 }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
