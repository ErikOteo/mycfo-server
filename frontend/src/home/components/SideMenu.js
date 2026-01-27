import * as React from 'react';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import MenuContent from './MenuContent';
// LogoutButton ya no se usa aquí, la lógica se integró en el menú del usuario
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { LayoutPanelLeft } from 'lucide-react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
//import Divider from '@mui/material/Divider';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import { sessionService } from '../../shared-services/sessionService';

const expandedWidth = 320;
export const collapsedWidth = 76;

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: open ? expandedWidth : collapsedWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    position: 'fixed',
    zIndex: theme.zIndex.drawer + 2,
    [`& .${drawerClasses.paper}`]: {
      width: open ? expandedWidth : collapsedWidth,
      overflowX: 'hidden',
      boxSizing: 'border-box',
      backgroundColor: theme.palette.background.paper,
      borderRight: `1px solid ${theme.palette.divider}`,
      zIndex: theme.zIndex.drawer + 2,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.standard,
      }),
      display: 'flex',
      flexDirection: 'column',
      alignItems: open ? 'stretch' : 'center',
    },
  }),
);

const LogoImage = styled(Box)(({ theme }) => ({
  width: '2.4rem',
  height: '2.4rem',
  borderRadius: theme.shape.borderRadius,
  transition: 'transform 0.2s ease, opacity 0.2s ease',
  objectFit: 'contain',
  overflow: 'hidden',
}));

const IconOverlay = styled(Box)(() => ({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  transition: 'opacity 0.2s ease',
}));

const SideMenu = React.memo(function SideMenu({
  expanded,
  onToggleExpand,
  onNavigate,
}) {
  const navigate = useNavigate();
  const [userData, setUserData] = React.useState({
    nombre: '',
    email: '',
  });
  const [logoHovered, setLogoHovered] = React.useState(false);

  // Estado para el menú desplegable del usuario
  const [anchorEl, setAnchorEl] = React.useState(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();

    // Lógica de logout replicada de LogoutButton
    const poolData = {
      UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
    };
    const userPool = new CognitoUserPool(poolData);
    const cognitoUser = userPool.getCurrentUser();

    if (cognitoUser) {
      console.log("👉 Cerrando sesión local de Cognito...");
      cognitoUser.signOut();
    }

    sessionStorage.clear();
    sessionService.limpiarSesion();

    // Si hay dominio de Cognito configurado, usar logout de Hosted UI
    const cognitoDomain = process.env.REACT_APP_COGNITO_DOMAIN;
    const clientId = process.env.REACT_APP_COGNITO_CLIENT_ID;
    const logoutRedirectUri = `${window.location.origin}${process.env.PUBLIC_URL}/#/signin`;

    if (cognitoDomain) {
      const logoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(
        logoutRedirectUri
      )}`;
      window.location.href = logoutUrl;
    } else {
      navigate("/signin");
    }
  };

  React.useEffect(() => {
    const updateUserData = () => {
      const storedNombre = sessionStorage.getItem('nombre') || '';
      const storedEmail = sessionStorage.getItem('email') || '';
      setUserData({
        nombre: storedNombre,
        email: storedEmail,
      });
    };

    updateUserData();
    window.addEventListener('userDataUpdated', updateUserData);

    return () => {
      window.removeEventListener('userDataUpdated', updateUserData);
    };
  }, []);

  const handleLogoClick = () => {
    if (typeof onToggleExpand === 'function') {
      onToggleExpand();
    }
  };

  const handleMenuNavigate = React.useCallback(() => {
    if (typeof onNavigate === 'function') {
      onNavigate();
    }
  }, [onNavigate]);

  return (
    <Drawer
      anchor="left"
      variant="permanent"
      open={expanded}
      sx={{
        display: { xs: 'none', lg: 'block' },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: expanded ? 'space-between' : 'center',
          mt: 'calc(var(--template-frame-height, 0px) + 4px)',
          px: 1.5,
          pb: 1,
          gap: expanded ? 1 : 0,
        }}
      >
        <Tooltip placement="right">
          <Box
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            onClick={handleLogoClick}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              width: '2.4rem',
              height: '2.4rem',
              borderRadius: 2,
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <LogoImage
              component="img"
              src={`${process.env.PUBLIC_URL}/logo192.png`}
              alt="Logo MyCFO"
              sx={{ opacity: logoHovered ? 0 : 1 }}
            />
            <IconOverlay sx={{ opacity: logoHovered ? 1 : 0 }}>
              <LayoutPanelLeft size={20} />
            </IconOverlay>
          </Box>
        </Tooltip>
        {expanded && (
          <Box
            component={RouterLink}
            to="/"
            onClick={handleMenuNavigate}
            aria-label="Ir al inicio"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              flexGrow: 1,
            }}
          >
            <Typography
              variant="h5"
              component="h1"
              sx={{ color: 'text.primary', fontWeight: 700 }}
            >
              MyCFO
            </Typography>
          </Box>
        )}
      </Box>
      <Divider />
      <Box
        sx={{
          overflow: 'auto',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MenuContent
          collapsed={!expanded}
          onNavigate={handleMenuNavigate}
        />
      </Box>

      <Stack
        direction={expanded ? 'row' : 'column'}
        sx={{
          p: expanded ? 2 : 1,
          gap: expanded ? 1 : 0.5,
          alignItems: 'center',
          justifyContent: expanded ? 'space-between' : 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >

        <Tooltip
          title={
            <Stack>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Cuenta de MyCFO
              </Typography>
              <Typography variant="body2">
                {userData.nombre || 'Nombre Usuario'}
              </Typography>
            </Stack>
          }
          placement="right"
          arrow
        >
          <Box
            onClick={handleMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: expanded ? 1 : 0,
              cursor: 'pointer',
              flexGrow: 1, // Ocupar espacio disponible antes del logout
              minWidth: 0,  // Para que el texto trunque si es necesario
              '&:hover': {
                bgcolor: 'action.hover',
                borderRadius: 1,
              },
              p: 0.5, // Un poco de padding para el hover
              width: expanded ? 'auto' : '100%',
              justifyContent: expanded ? 'flex-start' : 'center',
            }}
          >
            <Avatar
              sizes="small"
              alt={userData.nombre}
              //src="/static/images/avatar/7.jpg"
              sx={{ width: 36, height: 36 }}
            />
            {expanded && (
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, lineHeight: '16px' }}
                >
                  {userData.nombre || 'Nombre Usuario'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {userData.email || 'correo@ejemplo.com'}
                </Typography>
              </Box>
            )}
          </Box>
        </Tooltip>
        {/* Menú desplegable */}
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={openMenu}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: -1.5, // Subirlo un poco para que no tape el avatar si es posible
                minWidth: 180,
                '&::before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  bottom: -10, // Flecha abajo
                  left: 20,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            },
          }}
        >
          <MenuItem onClick={() => navigate('/perfil')}>
            <ListItemIcon>
              <PersonRoundedIcon fontSize="small" />
            </ListItemIcon>
            Ver perfil
          </MenuItem>
          <MenuItem onClick={() => navigate('/organizacion')}>
            <ListItemIcon>
              <ApartmentIcon fontSize="small" />
            </ListItemIcon>
            Ver organización
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Stack>
    </Drawer>
  );
});

export default SideMenu;
