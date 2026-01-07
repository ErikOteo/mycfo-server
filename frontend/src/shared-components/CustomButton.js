import React from "react";
import { Box, Button } from "@mui/material";

export default function BotonConsolidar({
  onClick,
  width = "100%",
  disabled = false,
  label = "Consolidar movimientos",
}) {
  return (
    <Box sx={{ mt: 2, width }}>
      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={disabled}
        onClick={onClick}
        sx={{
          height: 60,
          fontSize: "1rem",
          textTransform: "none",
        }}
      >
        {label}
      </Button>
    </Box>
  );
}
