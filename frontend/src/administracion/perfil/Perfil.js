import React, { useState, useEffect } from "react";

import { Box, Typography, CircularProgress, Stack, Avatar } from "@mui/material";
import CampoEditable from "../../shared-components/CampoEditable";
import BotonConsolidar from "../../shared-components/CustomButton";
import { sessionService } from "../../shared-services/sessionService";
import API_CONFIG from "../../config/api-config";
import axios from "axios";

export default function Perfil() {
  const [perfil, setPerfil] = useState({
    nombre: "",
    telefono: "",
    email: "",
  });
  const [editados, setEditados] = useState({}); // campos editados
  const [loading, setLoading] = useState(true);

  // Estado para el color del avatar
  const [avatarColor, setAvatarColor] = useState(localStorage.getItem('avatarColor') || '#008375');
  const colors = ['#008375', '#2e7d32', '#29B6F6', '#1976d2', '#7b1fa2', '#c2185b', '#d32f2f', '#ed6c02', '#fbc02d', '#757575'];

  // Manejo del cambio de color
  const handleColorChange = (color) => {
    setAvatarColor(color);
    localStorage.setItem('avatarColor', color);
    window.dispatchEvent(new Event('avatarUpdated'));
  };

  // 🔹 Cargar datos desde la sesión al montar el componente
  useEffect(() => {
    const cargarDatos = () => {
      // Cargar datos del usuario desde sesión
      const usuario = sessionService.getUsuario();
      setPerfil({
        nombre: usuario.nombre || "",
        telefono: usuario.telefono || "",
        email: usuario.email || "",
      });

      setLoading(false);
    };

    cargarDatos();
  }, []);

  const handleChange = (campo, valor) => {
    setPerfil((prev) => ({ ...prev, [campo]: valor }));
    setEditados((prev) => ({ ...prev, [campo]: true }));
  };

  const handleConsolidar = async () => {
    console.log("Datos enviados:", perfil);

    try {
      const sub = sessionStorage.getItem("sub");

      // 🔹 Actualizar datos del usuario en BD y Cognito mediante el backend
      await axios.put(`${API_CONFIG.ADMINISTRACION}/api/usuarios/perfil`, {
        nombre: perfil.nombre,
        email: perfil.email,
        telefono: perfil.telefono,
      }, {
        headers: {
          "X-Usuario-Sub": sub
        }
      });

      // 🔹 Actualizar sessionStorage del usuario
      sessionStorage.setItem("nombre", perfil.nombre);
      sessionStorage.setItem("email", perfil.email);
      sessionStorage.setItem("telefono", perfil.telefono);

      alert("Cambios guardados con éxito ✅");
      setEditados({});
      window.dispatchEvent(new Event("userDataUpdated"));
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      alert("Hubo un error al actualizar el perfil.");
    }
  };

  const hayCambios = Object.keys(editados).length > 0;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Helper para determinar si es un color claro
  const isLightColor = (c) => ['#ffffff'].includes(c);

  return (
    <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", mt: 4, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Perfil de Usuario
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        Actualiza tu información personal
      </Typography>

      <CampoEditable
        label="Nombre Completo"
        value={perfil.nombre}
        onChange={(v) => handleChange("nombre", v)}
      />
      <CampoEditable
        label="Email"
        value={perfil.email}
        onChange={(v) => handleChange("email", v)}
      />
      <CampoEditable
        label="Número de Teléfono"
        value={perfil.telefono}

        onChange={(v) => handleChange("telefono", v)}
      />

      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Personalización de Avatar
        </Typography>
        <Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
          Elige un color de fondo para tu inicial.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={3}>
          {/* Previsualización */}
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: avatarColor,
              fontSize: '1.5rem',
              color: isLightColor(avatarColor) ? '#000000' : '#ffffff', // Texto negro si el fondo es claro
              border: isLightColor(avatarColor) ? '1px solid #e0e0e0' : 'none' // Borde suave si es claro
            }}
          >
            {(perfil.nombre || 'U').charAt(0).toUpperCase()}
          </Avatar>

          {/* Selector de colores */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(5, auto)', sm: 'repeat(10, auto)' },
            gap: 1.5,
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}>
            {colors.map((color) => (
              <Box
                key={color}
                onClick={() => handleColorChange(color)}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: color,
                  cursor: 'pointer',
                  border: avatarColor === color
                    ? '3px solid #fff'
                    : (isLightColor(color) ? '1px solid #bdbdbd' : 'none'),
                  boxShadow: avatarColor === color
                    ? `0 0 0 2px ${isLightColor(color) ? '#9e9e9e' : color}`
                    : 'none',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              />
            ))}
          </Box>
        </Stack>
      </Box>

      {hayCambios && (
        <BotonConsolidar
          label="Guardar Cambios"
          onClick={handleConsolidar}
          width="100%"
        />
      )}
    </Box>
  );
}
