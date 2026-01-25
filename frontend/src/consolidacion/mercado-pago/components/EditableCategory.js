// /mercado-pago/components/EditableCategory.js
import React from "react";
import {
  Chip,
  Box,
  IconButton,
  Tooltip,
  Autocomplete,
  TextField,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { TODAS_LAS_CATEGORIAS } from "../../../shared-components/categorias";
import { fetchCategorias, crearCategoria } from "../../../shared-services/categoriasService";

const filter = createFilterOptions();

export default function EditableCategory({
  value = "MercadoPago",
  onChange,
  disabled = false,
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const [options, setOptions] = React.useState(TODAS_LAS_CATEGORIAS);
  const [loading, setLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef(null);
  const crearOpcion = React.useMemo(() => ({ label: "+ Crear categoria", __createOption: true }), []);

  React.useEffect(() => {
    setEditValue(value);
  }, [value]);

  React.useEffect(() => {
    let active = true;
    const cargar = async () => {
      setLoading(true);
      try {
        const lista = await fetchCategorias();
        if (active && Array.isArray(lista) && lista.length > 0) {
          setOptions(lista);
        }
      } catch {
        // fallback con fijas
      } finally {
        setLoading(false);
      }
    };
    cargar();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = () => {
    const trimmed = (editValue || "").toString().trim();
    if (trimmed && trimmed !== value) {
      onChange?.(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const renderEditor = () => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 200 }}>
      <Autocomplete
        size="small"
        value={editValue}
        options={[crearOpcion, ...options]}
        inputValue={inputValue}
        onInputChange={(_e, newInput) => setInputValue(newInput)}
        filterOptions={(opts, params) => {
          const filtered = filter(opts.filter((o) => !o.__createOption), params);
          const { inputValue } = params;
          const trimmed = (inputValue || "").trim();
          const exists = opts.some(
            (o) => (o || "").toString().toLowerCase() === trimmed.toLowerCase()
          );
          if (trimmed && !exists) {
            filtered.push({
              inputValue: trimmed,
              label: `Crear "${trimmed}"`,
            });
          }
          return [crearOpcion, ...filtered];
        }}
        onChange={async (_event, newValue) => {
          if (newValue && newValue.__createOption) {
            setEditValue("");
            setInputValue("");
            setTimeout(() => { inputRef.current?.querySelector("input")?.focus(); }, 0);
            return;
          }
          if (!newValue) return;
          if (typeof newValue === "string") {
            const nombre = newValue.trim();
            if (!nombre) return;
            try {
              const creado = await crearCategoria({ nombre });
              setEditValue(creado);
              setOptions((prev) => Array.from(new Set([creado, ...prev])));
            } catch {
              setEditValue(nombre);
            }
            return;
          }
          if (newValue.inputValue) {
            const nombre = newValue.inputValue.trim();
            if (!nombre) return;
            try {
              const creado = await crearCategoria({ nombre });
              setEditValue(creado);
              setOptions((prev) => Array.from(new Set([creado, ...prev])));
            } catch {
              setEditValue(nombre);
            }
            return;
          }
          setEditValue(newValue);
        }}
        autoHighlight
        openOnFocus
        freeSolo
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
            inputRef={inputRef}
            placeholder="Seleccionar categoría"
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={14} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
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

  if (isEditing) {
    return renderEditor();
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Chip
        size="small"
        label={value}
        color="default"
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
