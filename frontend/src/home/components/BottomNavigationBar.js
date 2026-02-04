import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Paper, BottomNavigation, BottomNavigationAction, useTheme } from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import usePermisos from '../../hooks/usePermisos';

const BottomNavigationBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { tienePermiso } = usePermisos();
    const [value, setValue] = React.useState(0);

    // Definir las rutas principales para la barra inferior
    const navigationItems = React.useMemo(() => {
        const items = [
            {
                label: 'Dashboard',
                icon: <DashboardRoundedIcon />,
                path: '/dashboard',
                show: true, // Dashboard siempre visible
            },
            {
                label: 'Cargar',
                icon: <CloudUploadRoundedIcon />,
                path: '/carga',
                show: tienePermiso('carga', 'view'),
            },
            {
                label: 'Flujo de Caja',
                icon: <TimelineRoundedIcon />,
                path: '/flujo-de-caja',
                show: tienePermiso('reps', 'view'),
            },
            {
                label: 'Perfil',
                icon: <PersonRoundedIcon />,
                path: '/perfil',
                show: true, // Perfil siempre visible
            },
        ];

        return items.filter(item => item.show);
    }, [tienePermiso]);

    // Actualizar el valor seleccionado basado en la ruta actual
    React.useEffect(() => {
        const currentPath = location.pathname;
        const index = navigationItems.findIndex(item => {
            if (item.path === '/dashboard') {
                return currentPath === '/' || currentPath === '/dashboard';
            }
            return currentPath.startsWith(item.path);
        });

        if (index !== -1) {
            setValue(index);
        }
    }, [location.pathname, navigationItems]);

    const handleChange = (event, newValue) => {
        setValue(newValue);
        navigate(navigationItems[newValue].path);
    };

    return (
        <Paper
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: theme.zIndex.appBar,
                display: { xs: 'block', lg: 'none' }, // Solo visible en mobile/tablet
                borderTop: `1px solid ${theme.palette.divider}`,
                boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
                paddingBottom: 'max(18px, env(safe-area-inset-bottom))',
                backgroundColor: theme.palette.background.paper,
            }}
            elevation={3}
        >
            <BottomNavigation
                value={value}
                onChange={handleChange}
                showLabels
                sx={{
                    height: 64,
                    backgroundColor: theme.palette.background.paper,
                    '& .MuiBottomNavigationAction-root': {
                        minWidth: 'auto',
                        padding: '6px 12px 8px',
                        color: theme.palette.text.secondary,
                        '&.Mui-selected': {
                            color: '#008375',
                            fontWeight: 600,
                        },
                    },
                    '& .MuiBottomNavigationAction-label': {
                        fontSize: '0.75rem',
                        marginTop: '4px',
                        '&.Mui-selected': {
                            fontSize: '0.75rem',
                        },
                    },
                }}
            >
                {navigationItems.map((item, index) => (
                    <BottomNavigationAction
                        key={index}
                        label={item.label}
                        icon={item.icon}
                    />
                ))}
            </BottomNavigation>
        </Paper>
    );
};

export default BottomNavigationBar;
