import React, { useState } from "react";
import { Box, IconButton, FormLabel, OutlinedInput } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

export default function CampoEditable({ label, value, onChange }) {
  const [tempValue, setTempValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setTempValue(value);
    setIsEditing(true);
  };

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempValue(value);
  };

  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      <FormLabel sx={{ color: 'text.primary' }}>{label}</FormLabel>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
        <OutlinedInput
          value={isEditing ? tempValue : value}
          onChange={(e) => setTempValue(e.target.value)}
          size="small"
          fullWidth
          disabled={!isEditing}
        />
        {!isEditing ? (
          <IconButton size="small" onClick={handleEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
        ) : (
          <>
            <IconButton size="small" color="success" onClick={handleSave}>
              <CheckIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={handleCancel}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>
    </Box>
  );
}
