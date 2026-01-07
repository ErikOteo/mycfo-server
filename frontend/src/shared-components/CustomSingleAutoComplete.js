import React, { useState, useEffect } from "react";
import { Autocomplete, TextField } from "@mui/material";

export default function CustomSingleAutoComplete({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = "Seleccioná o escribí una opción",
}) {
  const [internalValue, setInternalValue] = useState(value ?? null);

  useEffect(() => {
    setInternalValue(value ?? null);
  }, [value]);

  const handleChange = (_event, newValue) => {
    setInternalValue(newValue);
    if (onChange) onChange(newValue);
  };

  return (
    <Autocomplete
      freeSolo
      options={options}
      value={value !== undefined ? value : internalValue}
      onChange={handleChange}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          variant="outlined"
          size="small"
          disabled={disabled}
        />
      )}
    />
  );
}
