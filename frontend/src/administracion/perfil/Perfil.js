import React, { useState, useEffect } from "react";

import { Box, Typography, CircularProgress, Stack, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Divider, Snackbar, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
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
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Estado para el color del avatar
  const [avatarColor, setAvatarColor] = useState(localStorage.getItem('avatarColor') || '#008375');
  const colors = ['#008375', '#2e7d32', '#29B6F6', '#1976d2', '#7b1fa2', '#c2185b', '#d32f2f', '#ed6c02', '#fbc02d', '#757575'];

  // Manejo del cambio de color
  const handleColorChange = (color) => {
    setAvatarColor(color);
    // Ya no guardamos en localStorage aquí, se guardará al apretar "Consolidar"
    setEditados((prev) => ({ ...prev, avatarColor: true }));
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

      // El color inicial viene de sessionStorage (sincronizado en Home.js)
      const cachedColor = sessionStorage.getItem('avatarColor');
      if (cachedColor) setAvatarColor(cachedColor);

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
      // Recuperamos el rol actual para no perder los permisos al guardar el color
      const currentRol = sessionStorage.getItem("rol") || "COLABORADOR";
      let baseRol = currentRol.split('|PERM:')[0];
      let permsPart = currentRol.includes('|PERM:') ? currentRol.split('|PERM:')[1].split('|COLOR:')[0] : "{}";

      // Formato: ROL_BASE|PERM:JSON|COLOR:#HEX
      const finalRol = `${baseRol}|PERM:${permsPart}|COLOR:${avatarColor}`;

      await axios.put(`${API_CONFIG.ADMINISTRACION}/api/usuarios/perfil`, {
        nombre: perfil.nombre,
        email: perfil.email,
        telefono: perfil.telefono,
        rol: finalRol
      }, {
        headers: {
          "X-Usuario-Sub": sub
        }
      });

      // 🔹 Actualizar sessionStorage del usuario
      sessionStorage.setItem("nombre", perfil.nombre);
      sessionStorage.setItem("email", perfil.email);
      sessionStorage.setItem("telefono", perfil.telefono);
      sessionStorage.setItem("rol", finalRol);
      sessionStorage.setItem("avatarColor", avatarColor);

      setSnackbar({ open: true, message: "Cambios guardados con éxito ✅", severity: "success" });
      setEditados({});
      window.dispatchEvent(new Event("userDataUpdated"));
      window.dispatchEvent(new Event("avatarUpdated"));
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      setSnackbar({ open: true, message: "Hubo un error al actualizar el perfil.", severity: "error" });
    }
  };

  const hayCambios = Object.keys(editados).length > 0;

  /* Nuevo estado para cambio de contraseña */
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [passError, setPassError] = useState('');

  const navigate = useNavigate();

  // Helper para determinar si es un color claro
  // (Movelos el helper isLightColor aquí arriba o dejarlo donde estaba, pero mejor agrupar lógica)
  const isLightColor = (c) => ['#ffffff'].includes(c);

  const handleDownloadData = () => {
    const data = {
      ...perfil,
      avatarColor,
      fechaDescarga: new Date().toISOString()
    };
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "mis_datos_mycfo.json";
    link.click();
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      setPassError("Las contraseñas nuevas no coinciden");
      return;
    }
    if (passwords.new.length < 6) { // Validación básica
      setPassError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const token = sessionStorage.getItem("accessToken");
      await axios.post(`${API_CONFIG.ADMINISTRACION}/api/usuarios/cambiar-password`, {
        oldPassword: passwords.old,
        newPassword: passwords.new
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbar({ open: true, message: "Contraseña actualizada con éxito ✅", severity: "success" });
      setOpenPasswordDialog(false);
      setPasswords({ old: '', new: '', confirm: '' });
      setPassError('');
    } catch (error) {
      console.error("Error cambiando password:", error);
      setPassError("Error al cambiar contraseña. Verifica tu contraseña actual.");
    }
  };

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

      <Divider sx={{ my: 4 }} />

      {/* Seguridad */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Seguridad</Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle2">Contraseña</Typography>
            <Typography variant="body2" color="text.primary">
              Se recomienda cambiarla periódicamente
            </Typography>
          </Box>
          <Button variant="contained" sx={{ lineHeight: 1.2 }} onClick={() => setOpenPasswordDialog(true)}>
            Cambiar Contraseña
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Preferencias */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Preferencias</Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle2">Notificaciones</Typography>
            <Typography variant="body2" color="text.primary">
              Gestiona qué alertas y correos quieres recibir
            </Typography>
          </Box>
          <Button variant="contained" sx={{ lineHeight: 1.2 }} onClick={() => navigate('/configuracion-notificaciones')}>
            Configurar
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Gestión de Datos */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Gestión de Datos</Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle2">Mis Datos</Typography>
            <Typography variant="body2" color="text.primary">
              Descarga una copia de tu información personal
            </Typography>
          </Box>
          <Button variant="contained" color="primary" sx={{ lineHeight: 1.2 }} onClick={handleDownloadData}>
            Descargar mis datos
          </Button>
        </Stack>
      </Box>

      {/* Dialogo Cambio Password */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
        <DialogTitle>Cambiar Contraseña</DialogTitle>
        <DialogContent sx={{ pt: 2, minWidth: 300 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Contraseña Actual"
              type="password"
              fullWidth
              value={passwords.old}
              onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
            />
            <TextField
              label="Nueva Contraseña"
              type="password"
              fullWidth
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
            />
            <TextField
              label="Confirmar Nueva Contraseña"
              type="password"
              fullWidth
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            />
            {passError && (
              <Typography color="error" variant="caption">
                {passError}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleChangePassword}>Actualizar</Button>
        </DialogActions>
      </Dialog>

      {hayCambios && (
        <BotonConsolidar
          label="Guardar Cambios"
          onClick={handleConsolidar}
          width="100%"
        />
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
