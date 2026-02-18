import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Stack,
    Divider
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import http from '../../api/http';
import API_CONFIG from '../../config/api-config';

export default function SolicitudesPendientes({ empresaId, onSolicitudResuelta }) {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // id of request being processed

    const cargarSolicitudes = async () => {
        setLoading(true);
        try {
            const response = await http.get(`${API_CONFIG.ADMINISTRACION}/api/solicitudes/pendientes`, {
                params: { empresaId }
            });
            setSolicitudes(response.data);
            setError(null);
        } catch (err) {
            console.error("Error cargando solicitudes", err);
            setError("No se pudieron cargar las solicitudes pendientes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (empresaId) {
            cargarSolicitudes();
        }
    }, [empresaId]);

    const handleResolver = async (id, aprobar) => {
        setActionLoading(id);
        try {
            await http.post(`${API_CONFIG.ADMINISTRACION}/api/solicitudes/${id}/resolver`, {
                aprobar,
                rol: "COLABORADOR" // Por defecto entra con rol de colaborador
            });

            // Recargar lista y notificar al padre para que recargue empleados si se aprobó
            await cargarSolicitudes();
            if (aprobar && onSolicitudResuelta) {
                onSolicitudResuelta();
            }
        } catch (err) {
            console.error("Error resolviendo solicitud", err);
            alert("Ocurrió un error al procesar la solicitud.");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading && solicitudes.length === 0) return null; // O un spinner pequeño
    if (solicitudes.length === 0) return null; // No mostrar nada si no hay pendientes

    return (
        <Paper elevation={2} sx={{
            p: 3,
            mb: 4,
            border: '1px solid',
            borderColor: 'warning.main',
            bgcolor: '#fff3e0',
            '[data-mui-color-scheme="dark"] &': {
                bgcolor: 'background.paper',
            },
            // Fallback for html selector level
            'html[data-mui-color-scheme="dark"] &': {
                bgcolor: 'background.paper',
            }
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{
                    flexGrow: 1,
                    color: 'warning.dark',
                    '[data-mui-color-scheme="dark"] &': {
                        color: 'warning.light'
                    },
                    'html[data-mui-color-scheme="dark"] &': {
                        color: 'warning.light'
                    }
                }}>
                    Solicitudes de Acceso Pendientes
                </Typography>
                <Chip label={solicitudes.length} color="warning" size="small" />
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <List disablePadding>
                {solicitudes.map((solicitud, index) => (
                    <Box key={solicitud.id}>
                        <ListItem
                            alignItems="flex-start"
                            secondaryAction={
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        startIcon={<CancelIcon />}
                                        onClick={() => handleResolver(solicitud.id, false)}
                                        disabled={actionLoading === solicitud.id}
                                    >
                                        Rechazar
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        size="small"
                                        startIcon={<CheckCircleIcon />}
                                        onClick={() => handleResolver(solicitud.id, true)}
                                        disabled={actionLoading === solicitud.id}
                                    >
                                        {actionLoading === solicitud.id ? <CircularProgress size={20} /> : "Aceptar"}
                                    </Button>
                                </Stack>
                            }
                            sx={{ px: 0 }}
                        >
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'warning.main' }}>
                                    <PersonIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {solicitud.usuarioNombre || "Usuario Desconocido"}
                                    </Typography>
                                }
                                secondary={
                                    <>
                                        <Typography component="span" variant="body2" color="text.primary">
                                            {solicitud.usuarioEmail}
                                        </Typography>
                                        <br />
                                        <Typography component="span" variant="caption" color="text.secondary">
                                            Solicitado el: {new Date(solicitud.fechaSolicitud).toLocaleDateString()}
                                        </Typography>
                                    </>
                                }
                            />
                        </ListItem>
                        {index < solicitudes.length - 1 && <Divider component="li" />}
                    </Box>
                ))}
            </List>
        </Paper>
    );
}
