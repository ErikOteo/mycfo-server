import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Box,
    CircularProgress,
    Alert
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import API_CONFIG from '../../config/api-config';
import http from '../../api/http';

export default function JoinOrganizationModal({ open, onClose, onSuccess }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [requestStatus, setRequestStatus] = useState(null); // 'idle', 'sending', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!open) {
            setSearchTerm('');
            setResults([]);
            setSelectedCompany(null);
            setRequestStatus('idle');
            setErrorMessage('');
        }
    }, [open]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length >= 3) {
                searchCompanies();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const searchCompanies = async () => {
        setLoading(true);
        try {
            const response = await http.get(`${API_CONFIG.ADMINISTRACION}/api/empresas/buscar`, {
                params: { nombre: searchTerm }
            });
            setResults(response.data);
        } catch (error) {
            console.error("Error buscando empresas", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async () => {
        if (!selectedCompany) return;
        setRequestStatus('sending');
        try {
            // Obtener perfil para enviar nombre/email (aunque el backend podría sacarlo, lo enviamos por si acaso)
            const perfilResponse = await http.get(`${API_CONFIG.ADMINISTRACION}/api/usuarios/perfil`);
            const userProfile = perfilResponse.data;

            await http.post(`${API_CONFIG.ADMINISTRACION}/api/solicitudes/`, {
                empresaId: selectedCompany.id,
                nombre: userProfile.nombre,
                email: userProfile.email
            });

            setRequestStatus('success');
            setTimeout(() => {
                onClose();
                if (onSuccess) onSuccess();
            }, 2000);
        } catch (error) {
            console.error("Error enviando solicitud", error);
            setRequestStatus('error');
            setErrorMessage(error.response?.data || "Error al enviar la solicitud.");
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Unirse a una Organización</DialogTitle>
            <DialogContent dividers>
                {requestStatus === 'success' ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h5" color="success.main" gutterBottom>
                            ¡Solicitud Enviada!
                        </Typography>
                        <Typography color="text.secondary">
                            Notificaremos al administrador de <strong>{selectedCompany?.nombre}</strong>.
                            <br />
                            Te avisaremos por email cuando respondan.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Busca la empresa por su nombre. Debes solicitar acceso y el administrador deberá aprobarte.
                        </Typography>

                        <TextField
                            autoFocus
                            margin="dense"
                            label="Nombre de la empresa"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                                endAdornment: loading && <CircularProgress size={20} />
                            }}
                            placeholder="Ej: Google, Microsoft..."
                        />

                        {requestStatus === 'error' && (
                            <Alert severity="error" sx={{ mt: 2 }}>{errorMessage}</Alert>
                        )}

                        <List sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
                            {results.map((empresa) => (
                                <ListItem
                                    button
                                    key={empresa.id}
                                    selected={selectedCompany?.id === empresa.id}
                                    onClick={() => setSelectedCompany(empresa)}
                                    sx={{
                                        borderRadius: 1,
                                        mb: 1,
                                        border: selectedCompany?.id === empresa.id ? '2px solid #1976d2' : '1px solid #eee'
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar>
                                            <BusinessIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={empresa.nombre}
                                        secondary={empresa.descripcion || "Sin descripción"}
                                    />
                                </ListItem>
                            ))}
                            {searchTerm.length >= 3 && results.length === 0 && !loading && (
                                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                                    No se encontraron empresas con ese nombre.
                                </Typography>
                            )}
                        </List>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                {requestStatus !== 'success' && (
                    <>
                        <Button onClick={onClose} color="inherit">Cancelar</Button>
                        <Button
                            onClick={handleSendRequest}
                            variant="contained"
                            disabled={!selectedCompany || requestStatus === 'sending'}
                            endIcon={requestStatus === 'sending' ? <CircularProgress size={16} /> : <SendIcon />}
                        >
                            Enviar Solicitud
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}
