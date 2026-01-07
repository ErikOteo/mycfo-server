import React, { useState } from "react";
import { Autocomplete, TextField, Chip, Box } from "@mui/material";

export default function CustomMultiAutoComplete({ options, onChange }) {
  const [values, setValues] = useState([]);

  const handleChange = (event, newValue) => {
    setValues(newValue);
    if (onChange) onChange(newValue); // callback al padre
  };

  return (
    <Box>
      <Autocomplete
        multiple
        freeSolo
        options={options}
        value={values}
        onChange={handleChange}
        renderTags={(selected, getTagProps) =>
          selected.map((option, index) => (
            <Chip
              variant="outlined"
              label={option}
              {...getTagProps({ index })}
              key={option}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Escribí y presioná Enter o seleccioná"
            variant="outlined"
          />
        )}
      />
    </Box>
  );
}
