import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Stack,
    useTheme,
    alpha
} from '@mui/material';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

import JoinOrganizationModal from './JoinOrganizationModal';
import CreateCompanyModal from './CreateCompanyModal';

export default function WelcomeChoice() {
    const theme = useTheme();
    const [openJoinModal, setOpenJoinModal] = React.useState(false);
    const [openCreateModal, setOpenCreateModal] = React.useState(false);

    const choices = [
        {
            title: "Crear una Organización",
            description: "Soy dueño o administrador y quiero empezar a gestionar mis finanzas.",
            icon: <BusinessRoundedIcon sx={{ fontSize: 40 }} />,
            color: theme.palette.primary.main,
            action: () => setOpenCreateModal(true),
            buttonText: "Configurar Empresa"
        },
        {
            title: "Unirme a una existente",
            description: "Ya existe una cuenta corporativa y quiero solicitar acceso.",
            icon: <GroupAddRoundedIcon sx={{ fontSize: 40 }} />,
            color: theme.palette.secondary.main || '#008476',
            action: () => setOpenJoinModal(true),
            buttonText: "Buscar Organización"
        }
    ];

    return (
        <Box sx={{
            width: '100%',
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            px: { xs: 2, md: 4 },
            animation: 'fadeIn 0.8s ease-out'
        }}>
            <Box sx={{ width: '100%', maxWidth: 900 }}>
                <Stack spacing={2} sx={{ mb: 6, textAlign: 'center', alignItems: 'center', width: '100%' }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        ¡Te damos la bienvenida a MyCFO!
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                        Para comenzar a potenciar tu gestión financiera, primero necesitamos establecer tu espacio de trabajo.
                    </Typography>
                </Stack>

                <Grid container spacing={4} justifyContent="center" sx={{ width: '100%' }}>
                    {choices.map((choice, index) => (
                        <Grid size={{ xs: 12, md: 6 }} key={index}>
                            <Card
                                elevation={0}
                                sx={{
                                    height: '100%',
                                    borderRadius: 4,
                                    border: `1px solid ${theme.palette.divider}`,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: `0 20px 40px ${alpha(choice.color, 0.12)}`,
                                        borderColor: choice.color,
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 3,
                                        backgroundColor: alpha(choice.color, 0.1),
                                        color: choice.color
                                    }}>
                                        {choice.icon}
                                    </Box>

                                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                                        {choice.title}
                                    </Typography>

                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, flexGrow: 1 }}>
                                        {choice.description}
                                    </Typography>

                                    <Button
                                        variant="contained"
                                        fullWidth
                                        endIcon={<ArrowForwardRoundedIcon />}
                                        onClick={choice.action}
                                        sx={{
                                            py: 1.5,
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                            backgroundColor: choice.color,
                                            '&:hover': {
                                                backgroundColor: theme.palette.mode === 'dark' ? alpha(choice.color, 0.8) : choice.color,
                                                boxShadow: `0 8px 20px ${alpha(choice.color, 0.3)}`,
                                            }
                                        }}
                                    >
                                        {choice.buttonText}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            <JoinOrganizationModal
                open={openJoinModal}
                onClose={() => setOpenJoinModal(false)}
            />

            <CreateCompanyModal
                open={openCreateModal}
                onClose={() => setOpenCreateModal(false)}
            />

            <style>
                {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
            </style>
        </Box>
    );
}
