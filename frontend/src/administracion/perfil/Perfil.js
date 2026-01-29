import React, { useState, useEffect } from "react";

import { Box, Typography, CircularProgress, Stack, Avatar } from "@mui/material";
import CampoEditable from "../../shared-components/CampoEditable";
import BotonConsolidar from "../../shared-components/CustomButton";
import { sessionService } from "../../shared-services/sessionService";
import API_CONFIG from "../../config/api-config";
import axios from "axios";
import { useChatbotScreenContext } from "../../shared-components/useChatbotScreenContext";

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
  const colors = ['#008375', '#1976d2', '#7b1fa2', '#ed6c02', '#c2185b', '#2e7d32', '#757575', '#d32f2f', '#fbc02d'];

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

  const chatbotContext = React.useMemo(
    () => ({
      screen: "perfil",
      perfil: {
        nombre: perfil.nombre,
        email: perfil.email,
        telefono: perfil.telefono,
      },
    }),
    [perfil]
  );

  useChatbotScreenContext(chatbotContext);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

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

        <Stack direction="row" alignItems="center" spacing={3}>
          {/* Previsualización */}
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: avatarColor,
              fontSize: '1.5rem'
            }}
          >
            {(perfil.nombre || 'U').charAt(0).toUpperCase()}
          </Avatar>

          {/* Selector de colores */}
          <Stack direction="row" spacing={1.5}>
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
                  border: avatarColor === color ? '3px solid #fff' : 'none',
                  boxShadow: avatarColor === color
                    ? `0 0 0 2px ${color}` // Anillo exterior simulando selección
                    : 'none',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              />
            ))}
          </Stack>
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
