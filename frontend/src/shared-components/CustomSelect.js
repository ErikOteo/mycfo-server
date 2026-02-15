import React from "react";
import {
  Box,
  InputLabel,
  MenuItem,
  Select,
  OutlinedInput,
  FormHelperText,
} from "@mui/material";

export default function CustomSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  error = "",
  placeholder,
  width = "100%",
  disabled = false,
}) {
  const safeValue =
    typeof value === "string" && value.trim().toLowerCase() === "monto"
      ? ""
      : value ?? "";
  const displayPlaceholder = placeholder || "Seleccionar...";
  return (
    <Box sx={{ width }}>
      {label && (
        <InputLabel sx={{ mb: -0.01 }} id={`${name}-label`}>
          {label}
        </InputLabel>
      )}
      <Select
        labelId={`${name}-label`}
        id={name}
        name={name}
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        displayEmpty
        size="small"
        input={<OutlinedInput />}
        sx={{ width: "100%" }}
        disabled={disabled}
      >
        <MenuItem value="" disabled>
          {displayPlaceholder}
        </MenuItem>
        {options.map((opt, i) => (
          <MenuItem key={i} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
}
