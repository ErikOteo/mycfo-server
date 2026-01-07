import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import UploadForm from "./UploadForm";
import CamposRequeridos from "./CamposRequeridos";
import ResumenCarga from "./ResumenCarga";
import TablaErrores from "./TablaErrores";

export default function MainGrid() {
  const [resumen, setResumen] = React.useState(null);

  const handleUploadResult = (resultado) => {
    setResumen(resultado);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Carga Documento
      </Typography>

      <CamposRequeridos />
      <Box mt={3}>
        <UploadForm onUpload={handleUploadResult} />
      </Box>
      {resumen && (
        <>
          <ResumenCarga resumen={resumen} />
          {resumen.errores?.length > 0 && (
            <TablaErrores errores={resumen.errores} />
          )}
        </>
      )}
    </Box>
  );
}
