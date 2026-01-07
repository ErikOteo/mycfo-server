import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Alert,
} from "@mui/material";
import { CameraAlt, Check, Close, Delete } from "@mui/icons-material";
import Webcam from "react-webcam";
import CustomButton from "../../../shared-components/CustomButton";
import ImageIcon from "@mui/icons-material/Image";
import axios from "axios";

export default function CargaImagen({ tipoDoc, endpoint, onFallback }) {
  const webcamRef = useRef(null);
  const [capturando, setCapturando] = useState(true);
  const [fotoTemporal, setFotoTemporal] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [error, setError] = useState(null);

  const tomarFoto = () => {
    const img = webcamRef.current.getScreenshot();
    setFotoTemporal(img);
    setCapturando(false);
  };

  const aceptarFoto = () => {
    setFotos((prev) => [...prev, fotoTemporal]);
    setFotoTemporal(null);
    setCapturando(true);
  };

  const rechazarFoto = () => {
    setFotoTemporal(null);
    setCapturando(true);
  };

  const eliminarFoto = (index) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
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
    if (fotos.length === 0) return;
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
      const fd = new FormData();
      fotos.forEach((f, idx) => {
        fd.append("files", dataURLtoBlob(f), `foto-${idx + 1}.jpg`);
      });
      await axios.post(endpoint, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ Fotos enviadas!");
      setFotos([]);
      setError(null);
    } catch (err) {
      console.error("❌ Error en envío de foto:", err);
      const mensaje = err.response?.data?.message || err.message || "Error al procesar las fotos.";
      setError(mensaje);
      if (onFallback) {
        onFallback({
          origen: "foto",
          mensaje,
          detalle: err,
        });
      }
    }
  };

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
            style={{ width: "100%" }}
          />
        ) : (
          <img src={fotoTemporal} alt="captura" style={{ width: "100%" }} />
        )}

        {capturando ? (
          <IconButton
            onClick={tomarFoto}
            color="primary"
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
            <IconButton onClick={rechazarFoto} color="error" sx={{ width: 50, height: 50 }}>
              <Close />
            </IconButton>
            <IconButton onClick={aceptarFoto} color="success" sx={{ width: 50, height: 50 }}>
              <Check />
            </IconButton>
          </Box>
        )}
      </Box>

      {fotos.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 3 }}>
            Fotos seleccionadas:
          </Typography>
          {fotos.map((f, i) => (
            <Paper
              key={i}
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
              <Typography variant="body2">{`foto-${i + 1}.jpg`}</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <IconButton onClick={() => setFotoAmpliada(f)} size="small" color="primary">
                  <ImageIcon />
                </IconButton>
                <IconButton onClick={() => eliminarFoto(i)} size="small" color="error">
                  <Delete />
                </IconButton>
              </Box>
            </Paper>
          ))}

          <CustomButton
            label="Subir fotos"
            width="100%"
            sx={{ mt: 2 }}
            onClick={handleSubmit}
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
    </Box>
  );
}
