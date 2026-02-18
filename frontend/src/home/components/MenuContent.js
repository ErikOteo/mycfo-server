import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Popper,
  Paper,
  ClickAwayListener,
  Tooltip,
} from '@mui/material';
import { listItemTextClasses } from '@mui/material/ListItemText';
import { typographyClasses } from '@mui/material/Typography';
import { svgIconClasses } from '@mui/material/SvgIcon';
import { styled, keyframes, useTheme } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import routeConfig from '../../config/routes';
import usePermisos from '../../hooks/usePermisos';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  padding: theme.spacing(0.75, 2),
  marginBottom: theme.spacing(0.25),
  borderRadius: theme.shape.borderRadius,
  transition: 'background-color 0.3s, color 0.3s',
  color: '#000',
  '& .MuiListItemIcon-root': {
    minWidth: 'auto',
    marginRight: theme.spacing(2),
    color: 'inherit !important',
    transition: 'color 0.3s',
    [`& .${svgIconClasses.root}`]: {
      color: 'inherit !important',
    },
  },
  [`& .${listItemTextClasses.primary}`]: {
    fontSize: '0.95rem',
    fontWeight: 500,
    fontFamily: theme.typography.fontFamily,
    color: 'inherit !important',
  },
  [`& .${typographyClasses.root}`]: {
    color: 'inherit !important',
  },
  '&:hover': {
    backgroundColor: '#008375',
    color: '#fff',
  },
  '&.Mui-selected': {
    backgroundColor: '#008375 !important',
    color: '#fff !important',
    [`& .${listItemTextClasses.primary}`]: {
      fontWeight: 'bold',
      color: 'inherit !important',
    },
    '&:hover': {
      backgroundColor: '#008375',
      color: '#fff',
    },
  },
  ...(theme.applyStyles
    ? theme.applyStyles('dark', {
      color: '#fff',
      '&.Mui-selected': {
        backgroundColor: '#008375 !important',
        color: '#fff !important',
      },
      '&:hover': {
        backgroundColor: '#008375',
        color: '#000',
      },
    })
    : theme.palette.mode === 'dark'
      ? {
        color: '#fff',
        '&.Mui-selected': {
          backgroundColor: '#008375 !important',
          color: '#fff !important',
        },
        '&:hover': {
          backgroundColor: '#008375',
          color: '#000',
        },
      }
      : {}),
}));

export default function MenuContent({ onNavigate, collapsed = false }) {
  const theme = useTheme();
  const { tienePermiso } = usePermisos();
  const [openMenus, setOpenMenus] = React.useState({});
  const [collapsedMenuAnchor, setCollapsedMenuAnchor] = React.useState(null);
  const [collapsedMenuItems, setCollapsedMenuItems] = React.useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const closeCollapsedMenu = () => {
    setCollapsedMenuAnchor(null);
    setCollapsedMenuItems([]);
  };

  const handleItemClick = (event, item) => {
    // Si estamos en modo colapsado, abrir el popper si hay hijos
    if (collapsed) {
      if (item.filteredChildren && item.filteredChildren.length > 0) {
        const isSameAnchor = collapsedMenuAnchor === event.currentTarget;
        setCollapsedMenuAnchor(isSameAnchor ? null : event.currentTarget);
        setCollapsedMenuItems(isSameAnchor ? [] : item.filteredChildren);
        return;
      }
      // Si no hay hijos, navegar directamente
      closeCollapsedMenu();
      if (item.path) handleNavigate(item.path);
      return;
    }

    closeCollapsedMenu();

    // En modo expandido, si hay hijos, colapsar/expandir
    if (item.filteredChildren && item.filteredChildren.length > 0) {
      handleToggle(item.label);
      return;
    }

    // Si no tiene hijos visibles (o no tiene hijos), navegar
    if (item.path) {
      handleNavigate(item.path);
    }
  };

  // Función recursiva para filtrar rutas según permisos
  const filterRoutesRecursive = React.useCallback((items) => {
    if (!items) return [];

    return items
      .filter((item) => {
        // Ocultar si está marcado expresamente como hidden
        if (item.hidden) return false;

        // Verificar permiso si el item tiene un módulo asociado
        if (item.modulo && !tienePermiso(item.modulo, item.accion || 'view')) {
          return false;
        }
        return true;
      })
      .map((item) => {
        // Clonar el item para evitar mutaciones accidentales en routeConfig
        const newItem = { ...item };

        if (newItem.children) {
          const visibleChildren = filterRoutesRecursive(newItem.children);

          // CASO ESPECIAL: Si es un item contenedor (no tiene path propio)
          // y después del filtrado se quedó sin hijos visibles, lo descartamos.
          if (visibleChildren.length === 0 && !newItem.path) {
            return null;
          }

          // Solo adjuntamos filteredChildren si hay algo que mostrar
          if (visibleChildren.length > 0) {
            newItem.filteredChildren = visibleChildren;
          } else {
            // Limpiar si existía previamente por algún render anterior
            delete newItem.filteredChildren;
          }
        }
        return newItem;
      })
      .filter(Boolean); // Limpiar nulos (contenedores vacíos)
  }, [tienePermiso]);

  // Filtrar rutas según permisos
  const filteredRoutes = React.useMemo(() => {
    return filterRoutesRecursive(routeConfig);
  }, [filterRoutesRecursive]);

  const getMenuTextSx = React.useCallback(
    (label) => {
      const base = {
        color: 'inherit',
        fontSize: '0.95rem',
        fontWeight: 500,
        fontFamily: theme.typography.fontFamily,
      };

      if (label === 'Notificaciones') {
        return {
          ...base,
          fontSize: theme.typography.h4.fontSize,
          fontWeight: theme.typography.h4.fontWeight,
        };
      }

      return base;
    },
    [theme.typography.fontFamily, theme.typography.h4.fontSize, theme.typography.h4.fontWeight],
  );

  const handleNavigate = (path) => {
    navigate(path);
    if (typeof onNavigate === 'function') {
      onNavigate();
    }
  };

  const handleToggle = (label) => {
    setOpenMenus((prev) => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      [label]: !prev[label],
    }));
  };

  React.useEffect(() => {
    if (collapsed) {
      setOpenMenus({});
    } else {
      setCollapsedMenuAnchor(null);
      setCollapsedMenuItems([]);
    }
  }, [collapsed]);

  const isActive = (path) => location.pathname === path;

  return (
    <Stack sx={{ flexGrow: 1, p: collapsed ? 0.25 : 1, justifyContent: 'space-between' }}>
      <Box sx={{ animation: `${fadeIn} 0.5s ease-out` }}>
        <List
          dense
          sx={{
            py: collapsed ? 0.25 : 0.5,
            px: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: collapsed ? 'center' : 'stretch',
            width: '100%',
          }}
        >
          {filteredRoutes
            .map((item, index) => {
              const isParentActive =
                (item.path && isActive(item.path)) ||
                item.children?.some((child) => isActive(child.path));

              const menuButton = (
                <StyledListItemButton
                  onClick={(event) => handleItemClick(event, item)}
                  selected={isParentActive}
                  sx={{
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    textAlign: collapsed ? 'center' : 'left',
                    minHeight: collapsed ? 34 : 42,
                    px: collapsed ? 0.75 : 1.5,
                    py: collapsed ? 0.5 : 0.75,
                    mb: collapsed ? 0.1 : 0.35,
                    width: collapsed ? '92%' : '100%',
                    mx: collapsed ? 'auto' : 0,
                    '& .MuiListItemIcon-root': {
                      marginRight: collapsed ? 0 : undefined,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 0 : undefined,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: collapsed ? 0 : undefined,
                      ml: collapsed ? 0 : undefined,
                      width: collapsed ? 'auto' : 'auto',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ sx: getMenuTextSx(item.label) }}
                    />
                  )}
                  {!collapsed && item.filteredChildren && item.filteredChildren.length > 0 ? (
                    openMenus[item.label] ? (
                      <ExpandLess />
                    ) : (
                      <ExpandMore />
                    )
                  ) : null}
                </StyledListItemButton>
              );

              return (
                <React.Fragment key={index}>
                  <ListItem
                    disablePadding
                    sx={{
                      display: 'flex',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      width: '100%',
                    }}
                  >
                    {collapsed ? (
                      <Tooltip title={item.label} placement="right" arrow>
                        {menuButton}
                      </Tooltip>
                    ) : (
                      menuButton
                    )}
                  </ListItem>

                  {item.filteredChildren && !collapsed && (
                    <Collapse
                      in={openMenus[item.label]}
                      timeout="auto"
                      unmountOnExit
                    >
                      <List component="div" disablePadding sx={{ pl: 2 }}>
                        {item.filteredChildren.map((child, childIndex) => (
                          <ListItem
                            key={childIndex}
                            disablePadding
                            sx={{ display: 'block' }}
                          >
                            <StyledListItemButton
                              sx={{ pl: 4 }}
                              onClick={() => handleNavigate(child.path)}
                              selected={isActive(child.path)}
                            >
                              <ListItemIcon>{child.icon}</ListItemIcon>
                              <ListItemText
                                primary={child.label}
                                primaryTypographyProps={{ sx: getMenuTextSx(child.label) }}
                              />
                            </StyledListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </React.Fragment>
              );
            })}
        </List>
      </Box>
      {collapsed && (
        <Popper
          open={Boolean(collapsedMenuAnchor)}
          anchorEl={collapsedMenuAnchor}
          placement="right"
          modifiers={[
            { name: 'offset', options: { offset: [8, 0] } },
            { name: 'preventOverflow', options: { padding: 8 } },
          ]}
          sx={{ zIndex: (theme) => theme.zIndex.tooltip + 1 }}
        >
          <ClickAwayListener onClickAway={closeCollapsedMenu}>
            <Paper
              elevation={3}
              sx={{
                minWidth: 200,
                py: 0.5,
                transformOrigin: 'left center',
              }}
            >
              <List dense sx={{ py: 0.25 }}>
                {collapsedMenuItems.map((child, idx) => (
                  <ListItem key={idx} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        handleNavigate(child.path);
                        closeCollapsedMenu();
                      }}
                      selected={isActive(child.path)}
                    >
                      <ListItemIcon>{child.icon}</ListItemIcon>
                      <ListItemText
                        primary={child.label}
                        primaryTypographyProps={{ sx: getMenuTextSx(child.label) }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </ClickAwayListener>
        </Popper>
      )}
    </Stack>
  );
}
