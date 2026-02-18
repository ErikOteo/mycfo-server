import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";

import CamposRequeridos from "./components/CamposRequeridos";
import ResumenCarga from "./components/ResumenCarga";
import TablaErrores from "./components/TablaErrores";
import ExcelPreviewDialog from "./components/ExcelPreviewDialog";
import ExcelLibreMapper from "./components/ExcelLibreMapper";
import DropzoneUploader from "./../../shared-components/DropzoneUploader";
import CustomButton from "./../../shared-components/CustomButton";
import http from "../../api/http";
import API_CONFIG from "../../config/api-config";

export default function CargaMovimientos({ onCargaCompletada }) {
  const [resumen, setResumen] = React.useState(null);
  const [file, setFile] = React.useState(null);
  const [tipoOrigen, setTipoOrigen] = React.useState("");
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewData, setPreviewData] = React.useState([]);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [fileName, setFileName] = React.useState("");
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [excelLibreConfig, setExcelLibreConfig] = React.useState({
    columnMap: { fecha: 1, descripcion: 2, monto: 3 },
    dataStartRow: 2,
    dateFormat: "dd/MM/yyyy",
    decimalSeparator: ",",
  });
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "info",
  });
  const obtenerUsuarioSub = () => sessionStorage.getItem("sub");

  const handleTipoOrigenChange = (event) => {
    const value = event.target.value;
    const bloqueados = ["modo"];
    if (bloqueados.includes(value)) return;
    setTipoOrigen(value);
    if (value !== "excel-libre") {
      setExcelLibreConfig((prev) => ({
        ...prev,
        columnMap: prev.columnMap || { fecha: 1, descripcion: 2, monto: 3 },
      }));
    }
  };

  const handleFileSelected = (archivo) => {
    if (!archivo) {
      setFile(null);
      setFileName("");
      return;
    }
    setFile(archivo);
    setFileName(archivo.name || "");
    console.log("Archivo recibido:", archivo);
  };

  const procesarArchivo = async () => {
    if (!file || !tipoOrigen) {
      console.warn("Debe seleccionar un tipo de archivo y subir un archivo");
      return;
    }

    if (tipoOrigen === "excel-libre") {
      const colMap = excelLibreConfig?.columnMap || {};
      if (
        colMap.fecha === undefined ||
        colMap.descripcion === undefined ||
        colMap.monto === undefined
      ) {
        setSnackbar({
          open: true,
          message:
            "Configura el mapeo: fecha, descripcion y monto son obligatorios.",
          severity: "warning",
        });
        return;
      }
    }

    setPreviewLoading(true);
    try {
      const usuarioSub = obtenerUsuarioSub();
      if (!usuarioSub) {
        setSnackbar({
          open: true,
          message:
            "No se encontro la sesion del usuario. Volve a iniciar sesion.",
          severity: "error",
        });
        setPreviewLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tipoOrigen", tipoOrigen);
      if (tipoOrigen === "excel-libre") {
        formData.append("config", JSON.stringify(excelLibreConfig));
      }

      const response = await http.post(
        `${API_CONFIG.REGISTRO}/api/preview-excel`,
        formData,
        {
          headers: {
            "X-Usuario-Sub": usuarioSub,
          },
        },
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
      setSnackbar({
        open: true,
        message: "Ocurrio un error al procesar el archivo. Revisar consola.",
        severity: "error",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleImportSelected = async (selectedRegistros) => {
    try {
      const usuarioSub = obtenerUsuarioSub();
      if (!usuarioSub) {
        setSnackbar({
          open: true,
          message:
            "No se encontro la sesion del usuario. Volve a iniciar sesion.",
          severity: "error",
        });
        return;
      }
      const requestData = {
        registrosSeleccionados: selectedRegistros,
        fileName: fileName,
        tipoOrigen: tipoOrigen,
      };

      const response = await http.post(
        `${API_CONFIG.REGISTRO}/api/guardar-seleccionados`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Usuario-Sub": usuarioSub,
          },
        },
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

      onCargaCompletada?.();
    } catch (error) {
      console.error("Error al guardar los registros:", error);
      setSnackbar({
        open: true,
        message: "Ocurrio un error al guardar los registros. Revisar consola.",
        severity: "error",
      });
    }
  };

  const guiaPasos = [
    {
      titulo: "1. Elegi las 3 columnas obligatorias",
      desc: "Completa Fecha, Descripcion y Monto. La columna A es 1, B es 2, C es 3.",
    },
    {
      titulo: "2. Indica desde que fila hay datos",
      desc: "La fila de inicio es la primera fila con movimientos, no la fila de encabezados.",
    },
    {
      titulo: "3. Revisa formato de fecha",
      desc: "Si tus fechas son 31/01/2026 usa dd/MM/yyyy. Si no coincide, ajusta este campo.",
    },
    {
      titulo: "4. Ejecuta Vista Previa",
      desc: "Valida duplicados, categorias sugeridas y luego guarda solo los movimientos seleccionados.",
    },
  ];

  return (
    <Box
      sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" }, mx: "auto" }}
    >
      <Typography component="h2" variant="h6" sx={{ mb: 3 }}>
        Carga Excel
      </Typography>

      <FormControl fullWidth sx={{ mb: 4 }} size="small">
        <InputLabel id="tipo-origen-label">Tipo de archivo</InputLabel>
        <Select
          labelId="tipo-origen-label"
          id="tipo-origen"
          value={tipoOrigen}
          label="Tipo de archivo"
          onChange={handleTipoOrigenChange}
        >
          <MenuItem value="">Seleccione una opcion</MenuItem>
          <MenuItem value="mycfo">MyCFO - Plantilla Generica</MenuItem>
          <MenuItem value="excel-libre">Excel libre - Mapeo Manual</MenuItem>
          <MenuItem value="mercado-pago">Mercado Pago</MenuItem>
          <MenuItem value="santander">Banco Santander</MenuItem>
          <MenuItem value="galicia">Banco Galicia</MenuItem>
          <MenuItem value="nacion">Banco Nacion</MenuItem>
          <MenuItem value="uala">Uala (PDF)</MenuItem>
        </Select>
      </FormControl>

      {tipoOrigen === "mycfo" && <CamposRequeridos sx={{ mb: 4 }} />}

      {tipoOrigen === "excel-libre" && (
        <Box sx={{ mb: 3 }}>
          <ExcelLibreMapper
            value={excelLibreConfig}
            onOpenHelp={() => setHelpOpen(true)}
            onChange={(next) =>
              setExcelLibreConfig((prev) => ({ ...prev, ...next }))
            }
          />
        </Box>
      )}

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

      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Guia de mapeo libre
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {guiaPasos.map((paso, index) => (
              <Box key={paso.titulo}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "primary.main", mb: 0.5 }}
                >
                  {paso.titulo}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.primary", opacity: 0.8 }}>
                  {paso.desc}
                </Typography>
                {index < guiaPasos.length - 1 && <Divider sx={{ mt: 2, opacity: 0.5 }} />}
              </Box>
            ))}
          </Stack>

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => setHelpOpen(false)}
              sx={{ borderRadius: 2 }}
            >
              Entendido
            </Button>
          </Box>
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
