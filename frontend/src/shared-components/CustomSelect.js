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
  width = "100%",
  disabled = false,
}) {
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        displayEmpty
        size="small"
        input={<OutlinedInput />}
        sx={{ width: "100%" }}
        disabled={disabled}
      >
        <MenuItem value="" disabled>
          Elegir...
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
