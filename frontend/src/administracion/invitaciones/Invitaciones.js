import * as React from 'react';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Container,
  Button,
  Stack,
  Divider,
  Card,
  CardContent,
  Avatar,
  Chip
} from '@mui/material';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';

import { useChatbotScreenContext } from "../../shared-components/useChatbotScreenContext";
import InvitarColaboradores from "./InvitarColaboradores";
import usePermisos from '../../hooks/usePermisos';

export default function Invitaciones(props) {
  const { tienePermiso, esAdminTotal } = usePermisos();
  const navigate = useNavigate();


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
      <Box sx={{ mb: 4, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/organizacion')}
          sx={{
            position: { xs: 'relative', sm: 'absolute' },
            left: { sm: 0 },
            mb: { xs: 2, sm: 0 },
            textTransform: 'none',
            fontWeight: 600,
            color: 'text.primary',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
          }}
        >
          Volver
        </Button>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 0 }}>
            Gestión de Invitaciones
          </Typography>
          <Typography variant="body2" color="text.primary">
            Administra los accesos de nuevos colaboradores a {empresaNombre}.
          </Typography>
        </Box>
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
