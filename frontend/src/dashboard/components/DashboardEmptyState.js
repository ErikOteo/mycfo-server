import * as React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Stack,
    Avatar,
    useTheme,
    Fade
} from '@mui/material';
import LockPersonRoundedIcon from '@mui/icons-material/LockPersonRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import useResolvedColorTokens from '../useResolvedColorTokens';
import http from '../../api/http';
import API_CONFIG from '../../config/api-config';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function DashboardEmptyState({ userDisplayName, onRetry }) {
    const { resolvedMode } = useResolvedColorTokens();
    const isDark = resolvedMode === 'dark';
    const [loadingNotify, setLoadingNotify] = React.useState(false);
    const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });

    const handleNotifyOwner = async () => {
        setLoadingNotify(true);
        try {
            await http.post(`${API_CONFIG.NOTIFICACION}/api/notificaciones/solicitar-acceso`, {
                nombre: userDisplayName,
                email: sessionStorage.getItem('email') || 'Usuario MyCFO'
            });
            setSnackbar({
                open: true,
                message: '¡Notificación enviada con éxito al propietario!',
                severity: 'success'
            });
        } catch (error) {
            console.error("Error al notificar al propietario:", error);
            setSnackbar({
                open: true,
                message: 'No se pudo enviar la notificación. Intenta de nuevo más tarde.',
                severity: 'error'
            });
        } finally {
            setLoadingNotify(false);
        }
    };

    return (
        <Fade in={true} timeout={800}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '70vh',
                    textAlign: 'center',
                    px: 3,
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 4, md: 6 },
                        borderRadius: 6,
                        maxWidth: 600,
                        width: '100%',
                        bgcolor: isDark ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.7)',
                        backdropFilter: 'blur(25px)',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        boxShadow: isDark
                            ? '0 25px 60px rgba(0,0,0,0.8)'
                            : '0 20px 50px rgba(0,132,118,0.08)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* Decoración de fondo */}
                    <Box sx={{
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 150,
                        height: 150,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(0,132,118,0.1) 0%, rgba(0,132,118,0) 70%)',
                        zIndex: 0
                    }} />

                    <Stack spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ position: 'relative' }}>
                            <Avatar
                                sx={{
                                    width: 80,
                                    height: 80,
                                    bgcolor: isDark ? 'rgba(0,132,118,0.2)' : 'rgba(0,132,118,0.1)',
                                    color: 'primary.main',
                                    mb: 1
                                }}
                            >
                                <LockPersonRoundedIcon sx={{ fontSize: 40 }} />
                            </Avatar>
                            <Box sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: -5,
                                bgcolor: 'secondary.main',
                                borderRadius: '50%',
                                p: 0.5,
                                display: 'flex',
                                border: '3px solid',
                                borderColor: isDark ? '#1e1e1e' : '#fff'
                            }}>
                                <SecurityRoundedIcon sx={{ fontSize: 16, color: '#fff' }} />
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: -0.5, color: isDark ? '#fff' : '#000' }}>
                                ¡Hola, {userDisplayName}!
                            </Typography>
                            <Typography variant="h6" sx={{ color: isDark ? '#fff' : '#000', fontWeight: 500, lineHeight: 1.3 }}>
                                Parece que tu cuenta aún está en proceso de configuración.
                            </Typography>
                        </Box>

                        <Typography variant="body1" sx={{ color: isDark ? '#fff' : '#000', maxWidth: 450, fontSize: '1.1rem' }}>
                            Para empezar a ver las finanzas de tu organización, el <strong>Propietario</strong> debe asignarte permisos específicos desde el panel de Gestión de Permisos.
                        </Typography>

                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 3,
                                bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,132,118,0.05)',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                border: '1px dashed',
                                borderColor: 'primary.light'
                            }}
                        >
                            <VerifiedUserRoundedIcon color="primary" />
                            <Typography variant="body2" sx={{ textAlign: 'left', fontWeight: 500 }}>
                                Una vez que te asignen los permisos, podrás gestionar movimientos, ver bancos, facturas y reportes de IA automáticamente.
                            </Typography>
                        </Box>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%', pt: 2 }}>
                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                endIcon={<ArrowForwardRoundedIcon />}
                                onClick={onRetry}
                                sx={{
                                    borderRadius: 3,
                                    py: 1.5,
                                    boxShadow: '0 8px 20px rgba(0,132,118,0.3)',
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 600
                                }}
                            >
                                Verificar permisos ahora
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                fullWidth
                                onClick={handleNotifyOwner}
                                disabled={loadingNotify}
                                startIcon={loadingNotify ? <CircularProgress size={20} color="inherit" /> : null}
                                sx={{
                                    borderRadius: 3,
                                    py: 1.5,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 600
                                }}
                            >
                                {loadingNotify ? 'Enviando...' : 'Notificar al Propietario'}
                            </Button>
                        </Stack>

                    </Stack>
                </Paper>
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Fade>
    );
}
