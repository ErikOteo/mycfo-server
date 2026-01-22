import React from "react";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { crearCategoria, fetchCategorias } from "../shared-services/categoriasService";

const filter = createFilterOptions();

/**
 * Autocomplete que mezcla categorías fijas + personalizadas
 * y permite crear una nueva cuando no existe.
 */
export default function CategoriaAutoComplete({
  tipo, // Ingreso | Egreso | null
  value,
  onChange,
  label = "Categoría",
  error = false,
  helperText = "",
  disabled = false,
}) {
  const [options, setOptions] = React.useState([]);
  const [inputValue, setInputValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef(null);
  const crearOpcion = React.useMemo(
    () => ({ label: "➕ Crear categoría", __createOption: true }),
    []
  );

  const cargar = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCategorias({ tipo });
      setOptions(data);
    } catch (e) {
      console.error("Error cargando categorías:", e);
    } finally {
      setLoading(false);
    }
  }, [tipo]);

  React.useEffect(() => {
    cargar();
  }, [cargar]);

  const handleCreate = async (nombre) => {
    try {
      const created = await crearCategoria({ nombre, tipo });
      await cargar();
      if (onChange) onChange(created);
    } catch (e) {
      console.error("No se pudo crear la categoría", e);
    }
  };

  const handleChange = (_event, newValue) => {
    if (newValue && newValue.__createOption) {
      // Mantener abierto y enfocar para que el usuario escriba la nueva categoría
      setInputValue("");
      setOpen(true);
      setTimeout(() => {
        inputRef.current?.querySelector("input")?.focus();
      }, 0);
      return;
    }
    if (typeof newValue === "string") {
      // Usuario tipea y presiona Enter
      const normalizada = newValue.trim();
      if (!normalizada) return;
      const yaExiste = options.some(
        (opt) => (opt || "").toString().trim().toLowerCase() === normalizada.toLowerCase()
      );
      if (yaExiste) {
        onChange?.(normalizada);
      } else {
        handleCreate(normalizada);
      }
      return;
    }
    if (newValue && newValue.inputValue) {
      handleCreate(newValue.inputValue);
      return;
    }
    onChange?.(newValue || "");
  };

  return (
    <Autocomplete
      freeSolo
      clearOnBlur
      selectOnFocus
      handleHomeEndKeys
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      disabled={disabled}
      value={value || ""}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={(_e, newInput) => setInputValue(newInput)}
      options={[crearOpcion, ...options]}
      filterOptions={(opts, params) => {
        const filtered = filter(
          opts.filter((o) => !o.__createOption),
          params
        );
        const { inputValue: current } = params;
        const normalizada = (current || "").trim();
        if (normalizada) {
          const exists = opts.some(
            (opt) => (opt || "").toString().trim().toLowerCase() === normalizada.toLowerCase()
          );
          if (!exists) {
            filtered.push({
              inputValue: normalizada,
              label: `Crear "${normalizada}"`,
            });
          }
        }
        return [crearOpcion, ...filtered];
      }}
      getOptionLabel={(option) => {
        // Option typed by user
        if (typeof option === "string") return option;
        if (option?.inputValue) return option.inputValue;
        if (option?.__createOption) return option.label;
        return option?.label || "";
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          size="small"
          error={error}
          helperText={helperText}
          inputRef={inputRef}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
