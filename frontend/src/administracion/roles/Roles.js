import * as React from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Stack,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Checkbox,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { useChatbotScreenContext } from "../../shared-components/useChatbotScreenContext";
import { organizacionService } from "../../shared-services/organizacionService";

const PANTALLAS = [
  { id: 'carga', name: 'Carga de Datos' },
  { id: 'movs', name: 'Movimientos' },
  { id: 'banco', name: 'Gestión Bancaria' },
  { id: 'facts', name: 'Facturas' },
  { id: 'concil', name: 'Conciliación' },
  { id: 'reps', name: 'Reportes' },
  { id: 'pron', name: 'Pronóstico (IA)' },
  { id: 'pres', name: 'Presupuestos' },
];

export default function Roles(props) {
  const [empleados, setEmpleados] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [permisos, setPermisos] = React.useState({});
  const [guardando, setGuardando] = React.useState(false);
  const [mensajeExito, setMensajeExito] = React.useState(false);

  const chatbotContext = React.useMemo(
    () => ({
      screen: "roles-y-permisos-tabla-funcional",
      totalEmpleados: empleados.length,
      estado: loading ? "cargando" : "listo",
    }),
    [empleados.length, loading]
  );

  useChatbotScreenContext(chatbotContext);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await organizacionService.obtenerEmpleadosOrganizacion();
      if (!data) data = [];

      // Miembros maquetados para demostración (comentados para ver estado real)
      /*
      const mockMembers = [
        { sub: 'mock-1', nombre: 'Pancho', email: 'pancho@mycfo.com', rol: 'NORMAL', avatarColor: '#1976d2' },
        { sub: 'mock-2', nombre: 'Tincho', email: 'tincho@mycfo.com', rol: 'NORMAL', avatarColor: '#388e3c' },
        { sub: 'mock-3', nombre: 'Fede', email: 'fede@mycfo.com', rol: 'NORMAL', avatarColor: '#e64a19' },
      ];
      */

      const combinedData = [...data].map(emp => {
        let color = emp.avatarColor;
        let baseRol = 'NORMAL';

        if (emp.rol) {
          const parts = emp.rol.split('|');
          baseRol = parts[0];
          if (emp.rol.includes('|COLOR:')) {
            color = emp.rol.split('|COLOR:')[1];
          }
        }

        return {
          ...emp,
          avatarColor: color,
          isLocalAdmin: baseRol === 'ADMINISTRADOR'
        };
      });
      setEmpleados(combinedData);

      // Intentar cargar permisos desde los usuarios del backend
      const cached = localStorage.getItem('granular_permissions_final');
      let currentPermisos = cached ? JSON.parse(cached) : {};

      combinedData.forEach(emp => {
        if (emp.rol && emp.rol.includes('|PERM:')) {
          try {
            const parts = emp.rol.split('|PERM:');
            const permsJson = parts[1].split('|COLOR:')[0];
            currentPermisos[emp.sub] = JSON.parse(permsJson);
          } catch (e) {
            console.error("Error parseando permisos de", emp.nombre, e);
          }
        }

        // Inicializar si no hay nada definido
        if (!currentPermisos[emp.sub]) {
          const initial = {};
          // Si el rol es mock o real, chequeamos si "empieza" con ADMIN por seguridad
          const baseRol = emp.rol ? emp.rol.split('|')[0] : 'NORMAL';
          const isBaseAdmin = baseRol === 'ADMINISTRADOR';

          PANTALLAS.forEach(p => {
            initial[p.id] = { view: true, edit: isBaseAdmin };
          });
          currentPermisos[emp.sub] = initial;
        }
      });

      setPermisos(currentPermisos);
    } catch (err) {
      console.error(err);
      setError("Error al cargar la lista de miembros.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    cargarDatos();
  }, []);

  const togglePermiso = (sub, pantallaId, type) => {
    setPermisos(prev => {
      const userPerms = { ...(prev[sub] || {}) };
      const screenPerms = { ...(userPerms[pantallaId] || { view: false, edit: false }) };

      // Cambiar el valor del check clickeado
      screenPerms[type] = !screenPerms[type];

      // Lógica de cascada:
      // 1. Si activas Editar, se activa Ver automáticamente
      if (type === 'edit' && screenPerms.edit) {
        screenPerms.view = true;
      }
      // 2. Si desactivas Ver, se desactiva Editar automáticamente
      if (type === 'view' && !screenPerms.view) {
        screenPerms.edit = false;
      }

      return {
        ...prev,
        [sub]: {
          ...userPerms,
          [pantallaId]: screenPerms
        }
      };
    });
  };

  // --- Componente Premium para Nivel de Acceso ---
  const AccessLevelSelector = ({ value, onChange, disabled, pId }) => {
    const theme = useTheme();

    // Restricciones visuales según el módulo
    const canShowView = pId !== 'carga';
    const canShowEdit = pId !== 'reps';

    // Mapeo de niveles (Capping level based on canShowEdit)
    // 0: Ninguno, 1: Ver, 2: Editar
    const level = (value.edit && canShowEdit) ? 2 : (value.view ? 1 : 0);

    const handleSetLevel = (newLevel) => {
      if (disabled) return;
      if (newLevel === 0) onChange({ view: false, edit: false });
      if (newLevel === 1) onChange({ view: true, edit: false });
      if (newLevel === 2) onChange({ view: true, edit: true });
    };

    const getActiveColor = () => {
      if (level === 1) return theme.palette.primary.main;
      if (level === 2) return theme.palette.secondary.main;
      return theme.palette.text.disabled;
    };

    // Índice visual (0, 1, 2) ajustado según qué botones existen
    let visualIndex = level;
    if (!canShowView && level === 2) visualIndex = 1;

    const totalButtons = (canShowView && canShowEdit) ? 3 : 2;

    return (
      <Box
        sx={{
          display: 'inline-flex',
          bgcolor: 'rgba(0,0,0,0.06)',
          borderRadius: '24px',
          p: '2px', // Padding pequeño y constante
          position: 'relative',
          height: '26px',
          width: (canShowView && canShowEdit) ? '105px' : '72px',
          userSelect: 'none',
          border: '1px solid',
          borderColor: 'divider',
          ...(theme.palette.mode === 'dark' && {
            bgcolor: 'rgba(255,255,255,0.05)',
          })
        }}
      >
        {/* Contenedor relativo interno para coordinar slider e iconos en el mismo espacio */}
        <Box sx={{ position: 'relative', display: 'flex', width: '100%', height: '100%' }}>

          {/* Background slider animado */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${100 / totalButtons}%`,
              height: '100%',
              p: '1px', // Pequeño margen interno para la burbuja
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: `translateX(${visualIndex * 100}%)`,
              zIndex: 1,
            }}
          >
            <Box sx={{
              width: '100%',
              height: '100%',
              bgcolor: level === 0 ? 'rgba(0,0,0,0.1)' : getActiveColor(),
              borderRadius: '20px',
              boxShadow: level > 0 ? `0 2px 6px ${getActiveColor()}50` : 'none',
            }} />
          </Box>

          {/* Botón Bloqueado */}
          <Tooltip title="Sin acceso">
            <Box
              onClick={() => handleSetLevel(0)}
              sx={{
                flex: 1,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: disabled ? 'default' : 'pointer',
                color: level === 0 ? 'text.secondary' : 'text.disabled',
                transition: 'color 0.2s',
              }}
            >
              <LockRoundedIcon sx={{ fontSize: 13 }} />
            </Box>
          </Tooltip>

          {/* Botón Ver (Opcional) */}
          {canShowView && (
            <Tooltip title="Solo lectura">
              <Box
                onClick={() => handleSetLevel(1)}
                sx={{
                  flex: 1,
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: disabled ? 'default' : 'pointer',
                  color: level === 1 ? 'white' : 'text.disabled',
                  transition: 'color 0.2s',
                }}
              >
                <VisibilityRoundedIcon sx={{ fontSize: 14 }} />
              </Box>
            </Tooltip>
          )}

          {/* Botón Editar (Opcional) */}
          {canShowEdit && (
            <Tooltip title="Acceso total (Edición)">
              <Box
                onClick={() => handleSetLevel(2)}
                sx={{
                  flex: 1,
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: disabled ? 'default' : 'pointer',
                  color: level === 2 ? 'white' : 'text.disabled',
                  transition: 'color 0.2s',
                }}
              >
                <EditRoundedIcon sx={{ fontSize: 13 }} />
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  };

  // --- Componente para Selector de Rango (Admin vs Colaborador) ---
  const RoleSelector = ({ isAdmin, onToggle, disabled }) => {
    const theme = useTheme();

    return (
      <Tooltip title={disabled ? "No podés degradarte a vos mismo" : (isAdmin ? "Cambiar a Colaborador" : "Promover a Administrador")}>
        <Box
          onClick={disabled ? null : onToggle}
          sx={{
            display: 'inline-flex',
            bgcolor: 'rgba(0,0,0,0.06)',
            borderRadius: '24px',
            p: '2px',
            position: 'relative',
            height: '26px',
            width: '74px',
            userSelect: 'none',
            border: '1px solid',
            borderColor: isAdmin ? 'primary.main' : 'divider',
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.7 : 1,
            transition: 'all 0.3s ease',
            ...(theme.palette.mode === 'dark' && {
              bgcolor: 'rgba(255,255,255,0.05)',
            })
          }}
        >
          {/* Background slider animado */}
          <Box
            sx={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              width: 'calc(50% - 2px)',
              height: '20px',
              bgcolor: isAdmin ? 'primary.main' : 'rgba(0,0,0,0.15)',
              borderRadius: '20px',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: `translateX(${isAdmin ? '100%' : '0%'})`,
              boxShadow: isAdmin ? '0 2px 6px rgba(25, 118, 210, 0.4)' : 'none',
              zIndex: 1,
            }}
          />

          <Box sx={{ flex: 1, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PersonRoundedIcon sx={{ fontSize: 13, color: !isAdmin ? 'text.secondary' : 'text.disabled' }} />
          </Box>
          <Box sx={{ flex: 1, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SecurityRoundedIcon sx={{ fontSize: 13, color: isAdmin ? 'white' : 'text.disabled' }} />
          </Box>
        </Box>
      </Tooltip>
    );
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      // 1. Guardar en localStorage (respaldo local rápido)
      localStorage.setItem('granular_permissions_final', JSON.stringify(permisos));

      // 2. Persistencia en Backend (usando el campo rol: ROL|PERM:JSON)
      const realEmployees = empleados.filter(e => !e.sub.startsWith('mock-'));

      for (const emp of realEmployees) {
        const userPerms = permisos[emp.sub];
        // El nuevo rol base viene directamente de isLocalAdmin
        const newBaseRol = emp.isLocalAdmin ? 'ADMINISTRADOR' : 'COLABORADOR';

        if (userPerms || emp.isLocalAdmin !== undefined) {
          // Construir el nuevo string de rol preservando el color si existe
          let finalRol = `${newBaseRol}|PERM:${JSON.stringify(userPerms || {})}`;
          if (emp.avatarColor) {
            finalRol += `|COLOR:${emp.avatarColor}`;
          }

          const payload = {
            nombre: emp.nombre,
            email: emp.email,
            telefono: emp.telefono,
            rol: finalRol
          };
          console.log(`Guardando cambios para ${emp.nombre}...`);
          await organizacionService.actualizarEmpleado(emp.sub, payload);
        }
      }

      setMensajeExito(true);
      setTimeout(() => setMensajeExito(false), 3000);
    } catch (err) {
      console.error("Error al guardar en el servidor:", err);
      setError("Error al persistir los permisos en el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: isMobile ? 2 : 3 }}>
      <Box sx={{
        mb: 4,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'flex-end',
        gap: isMobile ? 2 : 0
      }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700 }}>
            Permisos de Miembros
          </Typography>
          <Typography variant="body2" color="text.primary">
            Configura individualmente quién puede Ver y quién puede Editar cada sección.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ width: isMobile ? '100%' : 'auto' }}>
          <IconButton onClick={cargarDatos} disabled={guardando}>
            <RefreshRoundedIcon />
          </IconButton>
          <Button
            variant="contained"
            fullWidth={isMobile}
            startIcon={guardando ? <CircularProgress size={20} color="inherit" /> : <SaveRoundedIcon />}
            onClick={handleGuardar}
            disabled={guardando}
            sx={{ borderRadius: 2, lineHeight: 1.2 }}
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </Stack>
      </Box>

      {mensajeExito && <Alert severity="success" sx={{ mb: 3 }}>¡Permisos guardados con éxito!</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!isMobile ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
          <TableContainer sx={{ maxHeight: '75vh' }}>
            <Table stickyHeader sx={{ tableLayout: 'fixed', minWidth: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{
                    fontWeight: 800,
                    bgcolor: 'background.paper',
                    zIndex: 3,
                    width: '180px',
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                    verticalAlign: 'middle',
                    py: 2
                  }}>
                    Miembro
                  </TableCell>
                  <TableCell align="center" sx={{
                    fontWeight: 800,
                    bgcolor: 'background.paper',
                    width: '110px',
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                    verticalAlign: 'middle',
                    py: 2
                  }}>
                    Rango
                  </TableCell>
                  {PANTALLAS.map(p => (
                    <TableCell key={p.id} align="center" sx={{
                      fontWeight: 800,
                      bgcolor: 'background.paper',
                      px: 0.5,
                      verticalAlign: 'middle',
                      py: 2,
                      borderBottom: '2px solid',
                      borderColor: 'divider'
                    }}>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          lineHeight: 1.1,
                          display: 'block',
                          whiteSpace: 'normal',
                          fontSize: '0.75rem',
                          color: 'text.primary',
                          fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        {p.name}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {empleados.map((emp) => {
                  const isAdmin = emp.isLocalAdmin;
                  const isSelf = emp.email === sessionStorage.getItem('email');
                  const isOwner = emp.esPropietario;

                  return (
                    <TableRow key={emp.sub} hover>
                      <TableCell sx={{ py: 1.5 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ position: 'relative' }}>
                            {isOwner && (
                              <Tooltip title="Propietario de la Empresa">
                                <Box sx={{
                                  position: 'absolute',
                                  top: -8,
                                  right: -8,
                                  zIndex: 1,
                                  fontSize: '14px',
                                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                                }}>
                                  👑
                                </Box>
                              </Tooltip>
                            )}
                            <Avatar sx={{
                              width: 32,
                              height: 32,
                              bgcolor: emp.avatarColor || '#9e9e9e',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              color: '#ffffff',
                              border: emp.avatarColor === '#ffffff' ? '1px solid #e0e0e0' : 'none'
                            }}>
                              {emp.nombre.charAt(0)}
                            </Avatar>
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'text.primary' }}>
                              {emp.nombre}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell align="center" sx={{ borderLeft: '1px solid', borderColor: 'divider', px: 0.5 }}>
                        <RoleSelector
                          isAdmin={isAdmin}
                          onToggle={() => {
                            setEmpleados(prev => prev.map(e =>
                              e.sub === emp.sub ? { ...e, isLocalAdmin: !isAdmin } : e
                            ));
                          }}
                          disabled={isSelf || isOwner}
                        />
                      </TableCell>
                      {PANTALLAS.map(p => {
                        const userPerms = permisos[emp.sub]?.[p.id] || { view: false, edit: false };
                        const viewActive = isAdmin || userPerms.view;
                        const editActive = isAdmin || userPerms.edit;

                        return (
                          <TableCell key={p.id} align="center" sx={{ px: 0.5, py: 0.75, borderLeft: '1px solid', borderColor: 'divider' }}>
                            <AccessLevelSelector
                              pId={p.id}
                              disabled={isAdmin}
                              value={{ view: viewActive, edit: editActive }}
                              onChange={(newVal) => {
                                if (!isAdmin) {
                                  setPermisos(prev => ({
                                    ...prev,
                                    [emp.sub]: {
                                      ...prev[emp.sub],
                                      [p.id]: newVal
                                    }
                                  }));
                                }
                              }}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {empleados.map((emp) => {
            const isAdmin = emp.isLocalAdmin;
            const isSelf = emp.email === sessionStorage.getItem('email');
            const isOwner = emp.esPropietario;

            return (
              <Paper
                key={emp.sub}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: isAdmin ? 'primary.main' : 'divider',
                  bgcolor: isAdmin ? 'rgba(255, 255, 255, 0.7)' : 'background.paper',
                  boxShadow: '0 2px 12px rgba(255, 255, 255, 0.05)'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ position: 'relative' }}>
                      {isOwner && (
                        <Box sx={{ position: 'absolute', top: -5, right: -5, fontSize: '12px', zIndex: 1 }}>👑</Box>
                      )}
                      <Avatar sx={{
                        width: 32,
                        height: 32,
                        bgcolor: emp.avatarColor || '#9e9e9e',
                        fontSize: '0.8rem',
                        color: '#fff'
                      }}>
                        {emp.nombre.charAt(0)}
                      </Avatar>
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {emp.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.primary">
                        {emp.email}
                      </Typography>
                    </Box>
                  </Stack>
                  <RoleSelector
                    isAdmin={isAdmin}
                    onToggle={() => {
                      setEmpleados(prev => prev.map(e =>
                        e.sub === emp.sub ? { ...e, isLocalAdmin: !isAdmin } : e
                      ));
                    }}
                    disabled={isSelf || isOwner}
                  />
                </Box>

                <Divider sx={{ mb: 2, opacity: 0.6 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {PANTALLAS.map(p => {
                    const userPerms = permisos[emp.sub]?.[p.id] || { view: false, edit: false };
                    const viewActive = isAdmin || userPerms.view;
                    const editActive = isAdmin || userPerms.edit;

                    return (
                      <Box key={p.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {p.name}
                        </Typography>
                        <AccessLevelSelector
                          pId={p.id}
                          disabled={isAdmin}
                          value={{ view: viewActive, edit: editActive }}
                          onChange={(newVal) => {
                            if (!isAdmin) {
                              setPermisos(prev => ({
                                ...prev,
                                [emp.sub]: {
                                  ...prev[emp.sub],
                                  [p.id]: newVal
                                }
                              }));
                            }
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoOutlinedIcon fontSize="small" />
          <strong>Nota:</strong> Los administradores tienen acceso total por defecto. Para los demás colaboradores, podés ajustar sus permisos aquí.
        </Typography>
      </Box>
    </Container>
  );
}
