// src/components/Logo.js
import React from "react";
import { Box } from "@mui/material";

export default function Logo({ size = 32, mobile = false }) {
  const defaultLogo = `${process.env.PUBLIC_URL}/logo192.png`;
  const logoSrc = mobile ? defaultLogo : defaultLogo;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 0,
        overflow: "visible",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        border: "none",
        boxShadow: "none",
        backgroundColor: "transparent",
      }}
    >
      <img
        src={logoSrc}
        alt="Logo MyCFO"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          backgroundColor: "transparent",
          display: "block",
        }}
        onError={(e) => {
          if (e?.target?.src !== defaultLogo) {
            e.target.src = defaultLogo; // fallback a logo existente
          }
        }}
      />
    </Box>
  );
}
