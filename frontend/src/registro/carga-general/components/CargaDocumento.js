import React, { useState } from "react";
import {
  Alert,
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import DropzoneUploader from "../../../shared-components/DropzoneUploader";
import CustomButton from "../../../shared-components/CustomButton";
import axios from "axios";

export default function CargaDocumento({ tipoDoc, endpoint }) {
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleFileSelected = (file) => {
    setArchivo(file);
    setError("");
    setResultado(null);
  };

  const handleSubmit = async () => {
    if (!archivo) {
      setError("Seleccioná un archivo Excel o CSV antes de continuar.");
      return;
    }

    if (!endpoint) {
      setError("No se encontró el endpoint de carga para este tipo.");
      return;
    }

    const usuarioSub = sessionStorage.getItem("sub");
    if (!usuarioSub) {
      setError(
        "No se encontró la sesión del usuario. Iniciá sesión nuevamente para continuar."
      );
      return;
    }

    try {
      setSubiendo(true);
      setError("");

      if (process.env.NODE_ENV !== "production") {
        console.debug("[CargaDocumento] Subiendo archivo a:", endpoint);
      }

      const formData = new FormData();
      formData.append("file", archivo);

      const endpointTrimmed =
        typeof endpoint === "string" ? endpoint.toLowerCase() : "";

      const shouldSendTipoMovimiento =
        endpointTrimmed.includes("/movimientos/documento") &&
        !endpointTrimmed.includes("/facturas/");

      if (shouldSendTipoMovimiento) {
        formData.append("tipoMovimiento", tipoDoc);
      }

      const headers = {
        "X-Usuario-Sub": usuarioSub,
      };

      const { data } = await axios.post(endpoint, formData, { headers });

      setResultado(data);
    } catch (err) {
      console.error("❌ Error en envío:", err);
      const mensaje =
        err.response?.data?.mensaje ||
        err.response?.data?.error ||
        err.message ||
        "Ocurrió un error al procesar el archivo.";
      setError(mensaje);
    } finally {
      setSubiendo(false);
    }
  };

  const tipoDocLabel =
    typeof tipoDoc === "string" && tipoDoc.length
      ? tipoDoc.charAt(0).toUpperCase() + tipoDoc.slice(1)
      : "registro";

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Cargá un archivo Excel o CSV con tus {tipoDocLabel}
      </Typography>

      <DropzoneUploader
        onFileSelected={handleFileSelected}
        width="100%"
        height={140}
        accept={{
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            [],
          "application/vnd.ms-excel": [],
          "text/csv": [],
          "application/csv": [],
        }}
      />

      <CustomButton
        label={subiendo ? "Subiendo..." : "Subir documento"}
        width="100%"
        sx={{ mt: 2 }}
        onClick={handleSubmit}
        disabled={subiendo}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {resultado && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Resumen de la importación
          </Typography>

          <Typography variant="body2">
            Total de filas procesadas: {resultado.totalFilas ?? 0}
          </Typography>
          <Typography variant="body2">
            Movimientos guardados: {resultado.registrosCargados ?? 0}
          </Typography>

          {Array.isArray(resultado.errores) && resultado.errores.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Errores detectados ({resultado.errores.length})
              </Typography>
              <List dense>
                {resultado.errores.map((item, index) => (
                  <ListItem key={`${item.fila}-${index}`}>
                    <ListItemText
                      primary={`Fila ${item.fila}: ${item.mensaje}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
