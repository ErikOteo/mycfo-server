import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

import CamposRequeridos from "./components/CamposRequeridos";
import ResumenCarga from "./components/ResumenCarga";
import TablaErrores from "./components/TablaErrores";
import ExcelPreviewDialog from "./components/ExcelPreviewDialog";
import DropzoneUploader from "./../../shared-components/DropzoneUploader";
import CustomButton from "./../../shared-components/CustomButton";
import axios from "axios";
import API_CONFIG from "../../config/api-config";

export default function CargaMovimientos({ onCargaCompletada }) {
  const [resumen, setResumen] = React.useState(null);
  const [file, setFile] = React.useState(null);
  const [tipoOrigen, setTipoOrigen] = React.useState("");
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewData, setPreviewData] = React.useState([]);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [fileName, setFileName] = React.useState("");
  const obtenerUsuarioSub = () => sessionStorage.getItem("sub");

  const handleTipoOrigenChange = (event) => {
    const value = event.target.value;
    // Mostrar opciones pero ignorar selección para las bloqueadas
    const bloqueados = ["modo"];
    if (bloqueados.includes(value)) return;
    setTipoOrigen(value);
  };

  const handleFileSelected = (archivo) => {
    setFile(archivo);
    setFileName(archivo.name);
    console.log("Archivo recibido:", archivo);
  };

  const procesarArchivo = async () => {
    if (!file || !tipoOrigen) {
      console.warn("Debe seleccionar un tipo de archivo y subir un archivo");
      return;
    }

    setPreviewLoading(true);
    try {
      const usuarioSub = obtenerUsuarioSub();
      if (!usuarioSub) {
        alert("No se encontró la sesión del usuario. Volvé a iniciar sesión.");
        setPreviewLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tipoOrigen", tipoOrigen);

      const response = await axios.post(
        `${API_CONFIG.REGISTRO}/api/preview-excel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-Usuario-Sub": usuarioSub,
          },
        }
      );

      console.log("[CargaMovimientos] Preview response", {
        tipoOrigen,
        fileName: file?.name,
        total: response.data?.totalRegistros,
        registros: response.data?.registros?.length,
        sample: response.data?.registros?.slice?.(0, 5),
      });

      setPreviewData(response.data.registros || []);
      setPreviewOpen(true);
    } catch (error) {
      console.error("Error al procesar el archivo:", error);
      alert("Ocurrió un error al procesar el archivo. Revisar consola.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleImportSelected = async (selectedRegistros) => {
    try {
      const usuarioSub = obtenerUsuarioSub();
      if (!usuarioSub) {
        alert("No se encontró la sesión del usuario. Volvé a iniciar sesión.");
        return;
      }
      const requestData = {
        registrosSeleccionados: selectedRegistros,
        fileName: fileName,
        tipoOrigen: tipoOrigen,
      };

      const response = await axios.post(
        `${API_CONFIG.REGISTRO}/api/guardar-seleccionados`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Usuario-Sub": usuarioSub,
          },
        }
      );

      console.log("[CargaMovimientos] Guardar seleccionados", {
        tipoOrigen,
        fileName,
        enviados: selectedRegistros?.length,
        resultado: response.data,
      });

      setResumen(response.data);
      setPreviewOpen(false);
      setFile(null);
      setFileName("");

      // Notificar que la carga se completó
      onCargaCompletada?.();
    } catch (error) {
      console.error("Error al guardar los registros:", error);
      alert("Ocurrió un error al guardar los registros. Revisar consola.");
    }
  };

  return (
    <Box
      sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" }, mx: "auto" }}
    >
      <Typography component="h2" variant="h6" sx={{ mb: 3 }}>
        Carga Excel
      </Typography>
      <CamposRequeridos sx={{ mb: 4 }} /> {/* margen debajo del ejemplo */}
      {/* Desplegable para tipo de archivo */}
      <FormControl fullWidth sx={{ mb: 4 }}>
        <InputLabel id="tipo-origen-label">Tipo de archivo</InputLabel>
        <Select
          labelId="tipo-origen-label"
          id="tipo-origen"
          value={tipoOrigen}
          label="Tipo de archivo"
          onChange={handleTipoOrigenChange}
        >
          <MenuItem value="">Seleccione una opción</MenuItem>
          <MenuItem value="mycfo">MyCFO (plantilla genérica)</MenuItem>
          <MenuItem value="mercado-pago">Mercado Pago</MenuItem>
          <MenuItem value="santander">Banco Santander</MenuItem>
          <MenuItem value="galicia">Banco Galicia</MenuItem>
          <MenuItem value="nacion">Banco Nación</MenuItem>
          <MenuItem value="uala">Ualá (PDF)</MenuItem>
        </Select>
      </FormControl>
      <DropzoneUploader
        onFileSelected={handleFileSelected}
        width="100%"
        height={120}
        sx={{ mb: 3 }}
      />
      <CustomButton
        width="100%"
        onClick={procesarArchivo}
        sx={{ mt: 1, mb: 4 }}
        disabled={previewLoading || !tipoOrigen || !file}
      >
        {previewLoading ? "Procesando..." : "Vista Previa"}
      </CustomButton>
      {resumen && (
        <Box mt={4} mb={4}>
          {" "}
          {/* <-- agrega mb aquí para separar de FormControl */}
          <ResumenCarga resumen={resumen} sx={{ mb: 3 }} />
          {resumen.errores?.length > 0 && (
            <TablaErrores errores={resumen.errores} />
          )}
        </Box>
      )}
      <ExcelPreviewDialog
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewData([]);
        }}
        previewData={previewData}
        loading={previewLoading}
        onImportSelected={handleImportSelected}
        fileName={fileName}
        tipoOrigen={tipoOrigen}
      />
    </Box>
  );
}
