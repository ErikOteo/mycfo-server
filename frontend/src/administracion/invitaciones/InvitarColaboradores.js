import React, { useState } from "react";
import {
  Box,
  Typography,
  Alert,
  CircularProgress
} from "@mui/material";
import CustomMultiLine from "../../shared-components/CustomMultiLine";
import CustomButton from "../../shared-components/CustomButton";
import http from "../../api/http";
import API_CONFIG from "../../config/api-config";

const API_URL_NOTIFICACIONES = API_CONFIG.NOTIFICACION;

export default function InvitarColaboradores({ empresaNombre, esAdministrador }) {
  const [emailsInvitacion, setEmailsInvitacion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const sub = sessionStorage.getItem("sub");

  const handleEnviarInvitaciones = async () => {
    if (emailsInvitacion.length === 0) {
      setMensaje({ tipo: 'warning', texto: 'Por favor, agregá al menos un email' });
      return;
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      console.log('🚀 Iniciando envío de invitaciones...');
      console.log('📧 Emails a enviar:', emailsInvitacion);
      console.log('👤 Usuario invitador:', sub);
      console.log('🏢 Empresa:', empresaNombre);

      const response = await http.post(
        `${API_URL_NOTIFICACIONES}/api/invitaciones/enviar`,
        emailsInvitacion
      );

      console.log('✅ Respuesta del servidor:', response);
      console.log('📊 Status:', response.status);
      console.log('📄 Data:', response.data);

      if (response.status === 200) {
        setMensaje({
          tipo: 'success',
          texto: `¡Invitaciones enviadas exitosamente a ${emailsInvitacion.length} colaborador${emailsInvitacion.length > 1 ? 'es' : ''}!`
        });
        setEmailsInvitacion([]);

        // Limpiar mensaje después de 5 segundos
        setTimeout(() => {
          setMensaje({ tipo: '', texto: '' });
        }, 5000);
      }
    } catch (error) {
      console.error("❌ Error enviando invitaciones:", error);
      console.error("📊 Error response:", error.response);
      console.error("📄 Error data:", error.response?.data);
      console.error("🔢 Error status:", error.response?.status);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Error desconocido al enviar las invitaciones';

      setMensaje({
        tipo: 'error',
        texto: `Error al enviar las invitaciones: ${errorMessage}`
      });
    } finally {
      setLoading(false);
    }
  };

  if (!esAdministrador) {
    return null; // Solo los administradores pueden invitar
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mt: 6, mb: 2 }}>
        Invitar nuevos miembros
      </Typography>
      <Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
        Ingresa las direcciones de correo electrónico de las personas que deseas invitar a tu organización
      </Typography>

      <CustomMultiLine
        value={emailsInvitacion}
        onChange={setEmailsInvitacion}
        placeholder="Ingresa emails separados por coma o presiona Enter"
      />

      <CustomButton
        label={loading ? "Enviando..." : "Enviar Invitaciones"}
        width="100%"
        onClick={handleEnviarInvitaciones}
        disabled={loading || emailsInvitacion.length === 0}
        loading={loading}
      />

      {mensaje.texto && (
        <Alert severity={mensaje.tipo || 'info'} sx={{ mt: 2 }}>
          {mensaje.texto}
        </Alert>
      )}
    </Box>
  );
}
