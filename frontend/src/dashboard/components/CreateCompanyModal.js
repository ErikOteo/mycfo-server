import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControlLabel,
    Checkbox,
    Typography,
    Box,
    Alert,
    CircularProgress
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import http from '../../api/http';
import API_CONFIG from '../../config/api-config';

export default function CreateCompanyModal({ open, onClose }) {
    const [nombre, setNombre] = useState('');
    const [isPersonal, setIsPersonal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        // Get user name from session for logic/display
        const storedName = sessionStorage.getItem('nombre') || sessionStorage.getItem('name') || '';
        setUserName(storedName);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const finalName = isPersonal ? (userName || 'Mi Organización Personal') : nombre;

        if (!finalName || finalName.trim().length < 3) {
            setError('El nombre debe tener al menos 3 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Create Company
            // POST /api/empresas/
            const { data: empresa } = await http.post(`${API_CONFIG.ADMINISTRACION}/api/empresas/`, {
                nombre: finalName,
                // Optional fields can be empty for now
                activo: true
            });

            console.log("Organización creada:", empresa);

            // 2. The backend should have assigned the creator as owner automatically 
            // (UsuarioService.crearEmpresa logic usually handles this, linking the creator sub)

            // 3. Force profile refresh to pick up the new role and empresaId
            // We can reload the page to ensure fresh start in Dashboard
            window.location.reload();

        } catch (err) {
            console.error("Error creando empresa:", err);
            setError(err.response?.data?.message || 'Error al crear la organización. Intenta nuevamente.');
            setLoading(false);
        }
    };

    const handleCheckboxChange = (e) => {
        const checked = e.target.checked;
        setIsPersonal(checked);
        if (checked) {
            // Optionally clear manual input or disable it
        }
    };

    const handleClose = () => {
        setNombre('');
        setIsPersonal(false);
        setError(null);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={!loading ? handleClose : undefined}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, p: 1 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="primary" />
                Configurar Nueva Organización
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Estás a un paso de comenzar. Define el nombre de tu espacio de trabajo.
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ mb: 3 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isPersonal}
                                    onChange={handleCheckboxChange}
                                    color="primary"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1" fontWeight={500}>
                                        Es una cuenta personal
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Usar mi nombre ({userName || 'Usuario'}) como nombre de la organización
                                    </Typography>
                                </Box>
                            }
                            sx={{ alignItems: 'flex-start', ml: 0 }}
                        />
                    </Box>

                    <TextField
                        autoFocus
                        margin="dense"
                        id="nombre"
                        label="Nombre de la Organización"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        disabled={isPersonal || loading}
                        required={!isPersonal}
                        placeholder="Ej: Mi Empresa S.A."
                        helperText={isPersonal ? "Se usará tu nombre personal" : "El nombre legal o fantasía de tu empresa"}
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} color="inherit" disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || (!isPersonal && nombre.trim().length < 3)}
                        startIcon={loading && <CircularProgress size={20} color="inherit" />}
                    >
                        {loading ? 'Creando...' : 'Crear y Comenzar'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
