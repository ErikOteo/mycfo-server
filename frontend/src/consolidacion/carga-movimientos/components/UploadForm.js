// src/carga-excel/components/UploadForm.js
import React, { useState } from "react";
import {
  Button,
  Box,
  Typography,
  FormHelperText,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/material/styles";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const UploadForm = ({ onUpload }) => {
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState(false);
  const [tipoOrigen, setTipoOrigen] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setArchivo(selected);
      setError(false);

      // Simulamos un resultado de carga
      const resultadoMock = {
        total: 5,
        correctos: 3,
        errores: [
          { fila: 2, motivo: "Falta la categoría" },
          { fila: 5, motivo: "Formato de fecha inválido" },
        ],
        tipoOrigen: tipoOrigen,
      };
      onUpload(resultadoMock);
    } else {
      setArchivo(null);
      setError(true);
    }
  };

  return (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="tipo-origen-label">Tipo de archivo</InputLabel>
        <Select
          labelId="tipo-origen-label"
          id="tipo-origen"
          value={tipoOrigen}
          label="Tipo de archivo"
          onChange={(e) => setTipoOrigen(e.target.value)}
        >
          <MenuItem value="">Seleccione una opción</MenuItem>
          <MenuItem value="mycfo">MyCFO (plantilla genérica)</MenuItem>
          <MenuItem value="mercado-pago">Mercado Pago</MenuItem>
          {/*<MenuItem value="santander">Banco Santander</MenuItem>*/}
        </Select>
      </FormControl>

      {tipoOrigen && (
        <Button
          component="label"
          variant="contained"
          startIcon={<CloudUploadIcon />}
          color={error ? "error" : "primary"}
        >
          Subir archivo Excel
          <VisuallyHiddenInput
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
          />
        </Button>
      )}

      {archivo && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Archivo seleccionado: {archivo.name}
        </Typography>
      )}

      {error && (
        <FormHelperText error sx={{ mt: 1 }}>
          Por favor seleccioná un archivo válido.
        </FormHelperText>
      )}
    </Box>
  );
};

export default UploadForm;
