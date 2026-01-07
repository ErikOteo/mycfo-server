import React from "react";
import {
  Chip,
  Box,
  IconButton,
  Tooltip,
  Autocomplete,
  TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { TODAS_LAS_CATEGORIAS } from "../../../shared-components/categorias";

export default function EditableExcelCategory({
  value = "Sin categorizar",
  onChange,
  disabled = false,
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);

  React.useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    // Solo guardar si la categoría seleccionada es válida y diferente
    if (
      editValue &&
      editValue !== value &&
      TODAS_LAS_CATEGORIAS.includes(editValue)
    ) {
      onChange?.(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 200 }}
      >
        <Autocomplete
          size="small"
          value={editValue}
          onChange={(event, newValue) => {
            if (newValue) {
              setEditValue(newValue);
            }
          }}
          options={TODAS_LAS_CATEGORIAS}
          autoHighlight
          openOnFocus
          disableClearable
          sx={{
            minWidth: 150,
            "& .MuiOutlinedInput-root": {
              height: 32,
              fontSize: "0.75rem",
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              autoFocus
              placeholder="Seleccionar categoría"
              variant="outlined"
            />
          )}
        />
        <Tooltip title="Guardar">
          <IconButton size="small" onClick={handleSave} color="primary">
            <CheckIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cancelar">
          <IconButton size="small" onClick={handleCancel} color="inherit">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Chip
        size="small"
        label={value}
        color="secondary"
        variant="outlined"
        sx={{ minWidth: 80 }}
      />
      {!disabled && (
        <Tooltip title="Editar categoría">
          <IconButton
            size="small"
            onClick={() => setIsEditing(true)}
            sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
