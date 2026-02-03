import * as React from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Container,
  Stack,
  Divider,
  Card,
  CardContent,
  Avatar,
  Chip
} from '@mui/material';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import { useChatbotScreenContext } from "../../shared-components/useChatbotScreenContext";
import InvitarColaboradores from "./InvitarColaboradores";
import usePermisos from '../../hooks/usePermisos';

export default function Invitaciones(props) {
  const { tienePermiso, esAdminTotal } = usePermisos();


  const [empresaNombre, setEmpresaNombre] = React.useState(sessionStorage.getItem('empresaNombre') || 'Tu Organización');
  const esAdministrador = esAdminTotal();

  const chatbotContext = React.useMemo(
    () => ({
      screen: "invitaciones",
      empresa: empresaNombre,
      estado: "listo",
    }),
    [empresaNombre]
  );

  useChatbotScreenContext(chatbotContext);

  // Bloqueo de seguridad: Si no tiene permiso admin, redirigir al Dashboard
  if (!tienePermiso('admin', 'view')) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Gestión de Invitaciones
        </Typography>
        <Typography variant="body1" color="text.primary">
          Administra los accesos de nuevos colaboradores a {empresaNombre}.
        </Typography>
      </Box>

      <Grid container justifyContent="center">
        {/* Columna Única: Formulario de Invitación */}
        <Grid item xs={12} md={6} lg={5}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <GroupAddRoundedIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Nuevas Invitaciones
                </Typography>
              </Box>
              <Divider />
              <InvitarColaboradores
                empresaNombre={empresaNombre}
                esAdministrador={esAdministrador}
              />
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
