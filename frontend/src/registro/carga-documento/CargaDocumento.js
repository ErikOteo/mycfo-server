import * as React from "react";
import axios from "axios";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormHelperText from "@mui/material/FormHelperText";

import DropzoneUploader from "./../../shared-components/DropzoneUploader";
import CustomButton from "./../../shared-components/CustomButton";

// Componentes locales del módulo
import CamposRequeridos from "./components/CamposRequeridos";
import ResumenCarga from "./components/ResumenCarga";
import TablaErrores from "./components/TablaErrores";
import API_CONFIG from "../../config/api-config";

export default function CargaDocumento() {
  const [file, setFile] = React.useState(null);
  const [resumen, setResumen] = React.useState(null);
  const [error, setError] = React.useState("");

  // Tipo fijo para este módulo
  const tipoOrigen = "mycfo";

  const handleFileSelected = (archivo) => {
    setFile(archivo);
    setError("");
    setResumen(null);
    console.log("Archivo recibido:", archivo);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Subí un archivo válido antes de continuar.");
      return;
    }

    try {
      setError("");
      const usuarioSub = sessionStorage.getItem("sub");
      if (!usuarioSub) {
        setError("No se encontró la sesión del usuario. Volvé a iniciar sesión.");
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tipoOrigen", tipoOrigen);

      const { data } = await axios.post(
        `${API_CONFIG.REGISTRO}/api/importar-excel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-Usuario-Sub": usuarioSub,
          },
        }
      );

      setResumen(data);
    } catch (e) {
      console.error("Error al procesar el archivo:", e);
      setError("Ocurrió un error al procesar el archivo. Revisá la consola.");
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        gap: 2,
      }}
    >
      <Typography variant="h5" gutterBottom>
        Carga de documento
      </Typography>

      {/* Campos adicionales del módulo */}
      <CamposRequeridos sx={{ mb: 1 }} />

      {/* Dropzone para subir archivo */}
      <DropzoneUploader
        onFileSelected={handleFileSelected}
        width="100%"
        height={140}
        accept={{
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            [],
          "application/vnd.ms-excel": [],
        }}
      />

      {/* Botón para subir */}
      <CustomButton
        text="Subir documento"
        width="100%"
        sx={{ mt: 1 }}
        onClick={handleUpload}
      />

      {!!error && (
        <FormHelperText error sx={{ mt: 1, textAlign: "center" }}>
          {error}
        </FormHelperText>
      )}

      {/* Resumen + errores */}
      {resumen && (
        <Box sx={{ width: "100%", mt: 2 }}>
          <ResumenCarga resumen={resumen} sx={{ mb: 2 }} />
          {Array.isArray(resumen.errores) && resumen.errores.length > 0 && (
            <TablaErrores errores={resumen.errores} />
          )}
        </Box>
      )}
    </Box>
  );
}
