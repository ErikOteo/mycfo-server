import React, { useState } from "react";
import { TextField, Chip, Box } from "@mui/material";

export default function CustomMultiLine({ value, onChange, placeholder }) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (event) => {
    if (['Enter', 'Tab', ','].includes(event.key)) {
      event.preventDefault();
      
      const newEmail = inputValue.trim();
      
      if (newEmail && isValidEmail(newEmail)) {
        onChange([...value, newEmail]);
        setInputValue("");
      }
    }
  };

  const handleChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleDelete = (itemToDelete) => {
    onChange(value.filter(item => item !== itemToDelete));
  };

  const isValidEmail = (email) => {
    // Expresión regular simple para validar email
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  return (
    <Box>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder || "Escribí y presioná Enter"}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        sx={{ mb: 1 }}
      />
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {value.map((item, index) => (
          <Chip
            key={index}
            variant="outlined"
            label={item}
            onDelete={() => handleDelete(item)}
          />
        ))}
      </Box>
    </Box>
  );
}