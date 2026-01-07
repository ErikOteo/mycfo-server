import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Box,
  Typography,
  Paper,
  useTheme,
  IconButton,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";

export default function DropzoneUploader({
  onFileSelected,
  initialFile = null,
  width = "100%",
  height = 100,
  accept
}) {
  const theme = useTheme();
  const [file, setFile] = useState(initialFile);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const newFile = acceptedFiles[0];
        setFile(newFile);
        onFileSelected?.(newFile);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: accept || undefined
  });

  const handleRemove = () => {
    setFile(null);
    onFileSelected?.(null);
  };

  useEffect(() => {
    if (initialFile) setFile(initialFile);
  }, [initialFile]);

  return (
    <Box sx={{ width }}>
      <Paper
        variant="outlined"
        {...getRootProps()}
        sx={{
          width: "100%",
          height: height,
          p: 3,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          border: "2px dashed",
          borderColor: isDragActive ? "primary.main" : "grey.400",
          bgcolor: isDragActive ? "grey.100" : "inherit",
          cursor: "pointer",
          ...(theme.palette.mode === "dark" && {
            borderColor: isDragActive ? "primary.light" : "grey.700",
            bgcolor: isDragActive ? "grey.900" : "inherit",
          }),
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 60, mb: 1 }} color="action" />
        {isDragActive ? (
          <Typography variant="body1">Suelta el archivo aquí...</Typography>
        ) : (
          <Typography variant="body1">
            Arrastrá y soltá un archivo aquí o hacé clic para seleccionarlo
          </Typography>
        )}
      </Paper>

      {file && (
        <Box
          sx={{
            mt: 2,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1.5,
            border: "1px solid",
            borderColor: "grey.300",
            borderRadius: 1,
            ...(theme.palette.mode === "dark" && {
              borderColor: "grey.700",
            }),
          }}
        >
          <Typography variant="body2">{file.name}</Typography>
          <IconButton onClick={handleRemove} size="small" color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
