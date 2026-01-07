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
import LogoutButton from './LogoutButton';
import { Link as RouterLink } from 'react-router-dom';
import { LayoutPanelLeft } from 'lucide-react';

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
  const [userData, setUserData] = React.useState({
    nombre: '',
    email: '',
  });
  const [logoHovered, setLogoHovered] = React.useState(false);

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
        <Tooltip  placement="right">
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
        <Avatar
          sizes="small"
          alt={userData.nombre}
          src="/static/images/avatar/7.jpg"
          sx={{ width: 36, height: 36 }}
        />
        {expanded && (
          <>
            <Box sx={{ flexGrow: 1, minWidth: 0, mr: 2 }}>
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
            <LogoutButton />
          </>
        )}
      </Stack>
    </Drawer>
  );
});

export default SideMenu;
