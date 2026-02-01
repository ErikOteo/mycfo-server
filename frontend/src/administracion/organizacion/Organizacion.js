import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Pagination,
  useMediaQuery,
  Tooltip
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  PersonAdd as PersonAddIcon,
  Business as BusinessIcon,
  AdminPanelSettings as AdminIcon
} from "@mui/icons-material";
import CampoEditable from "../../shared-components/CustomButton";
import { sessionService } from "../../shared-services/sessionService";
import { organizacionService } from "../../shared-services/organizacionService";
import InvitarColaboradores from "../invitaciones/InvitarColaboradores";
import API_CONFIG from "../../config/api-config";
import { useChatbotScreenContext } from "../../shared-components/useChatbotScreenContext";
import usePermisos from "../../hooks/usePermisos";

export default function Organizacion() {
  const [empresa, setEmpresa] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editandoEmpleado, setEditandoEmpleado] = useState(null);
  const [empleadoEditado, setEmpleadoEditado] = useState({});
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [usuarioRol, setUsuarioRol] = useState(null);
  const [editandoEmpresa, setEditandoEmpresa] = useState(false);
  const [empresaEditada, setEmpresaEditada] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [empleadoToDelete, setEmpleadoToDelete] = useState(null);
  const { esAdminTotal } = usePermisos();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  const totalPages = Math.ceil(empleados.length / ITEMS_PER_PAGE);
  const paginatedEmployees = empleados.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const chatbotContext = React.useMemo(
    () => ({
      screen: "organizacion",
      empresa: empresa
        ? {
          nombre: empresa.nombre,
          cuit: empresa.cuit,
          condicionIVA: empresa.condicionIVA,
          domicilio: empresa.domicilio,
        }
        : null,
      empleadosTotal: empleados.length,
      empleados: paginatedEmployees.map((empleado) => ({
        nombre: empleado.nombre,
        email: empleado.email,
        rol: empleado.rol,
        activo: empleado.activo,
      })),
      paginacion: {
        paginaActual: page,
        totalPaginas: totalPages,
        totalEmpleados: empleados.length,
        itemsPorPagina: ITEMS_PER_PAGE
      },
      usuarioRol,
      editandoEmpresa,
      editandoEmpleado: Boolean(editandoEmpleado),
      loading,
    }),
    [
      empresa,
      empleados,
      usuarioRol,
      editandoEmpresa,
      editandoEmpleado,
      loading,
    ]
  );

  useChatbotScreenContext(chatbotContext);

  const sub = sessionStorage.getItem("sub");
  const organizacionId = sessionStorage.getItem("organizacionId");

  useEffect(() => {
    cargarDatosEmpresaYEmpleados();
  }, []);

  // Ajustar página si la lista cambia (ej. al eliminar)
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [empleados.length, totalPages, page]);

  const cargarDatosEmpresaYEmpleados = async () => {
    setLoading(true);
    try {
      console.log('Cargando datos completos de organización...');
      console.log('Sub del usuario:', sub);

      const info = await organizacionService.obtenerInfoCompletaOrganizacion();
      console.log('Info completa de organización:', info);

      if (info?.perfil) {
        setUsuarioRol(info.perfil.rol);
      }

      if (info?.empresa) {
        setEmpresa(info.empresa);
      } else {
        setEmpresa(null);
      }

      if (Array.isArray(info?.empleados)) {
        setEmpleados(info.empleados);
      } else {
        setEmpleados([]);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar los datos de la organización' });
    } finally {
      setLoading(false);
    }
  };

  // Abrir edición inline de empleado
  const handleAbrirEdicionEmpleado = (empleado) => {
    setEditandoEmpleado(empleado.sub);
    setEmpleadoEditado({ ...empleado });
  };

  // Cerrar edición de empleado
  const handleCerrarEdicionEmpleado = () => {
    setEditandoEmpleado(null);
    setEmpleadoEditado({});
  };

  // Guardar cambios del empleado
  const handleGuardarEmpleado = async () => {
    try {
      await organizacionService.actualizarEmpleado(editandoEmpleado, {
        nombre: empleadoEditado.nombre,
        email: empleadoEditado.email,
        telefono: empleadoEditado.telefono,
        rol: empleadoEditado.rol
      });

      setMensaje({ tipo: 'success', texto: 'Cambios del empleado guardados exitosamente' });
      handleCerrarEdicionEmpleado();

      // Recargar lista de empleados
      cargarDatosEmpresaYEmpleados();

      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (error) {
      console.error("Error guardando empleado:", error);

      // Mostrar mensaje específico según el tipo de error
      let mensajeError = 'Error al guardar los cambios del empleado';
      if (error.response?.status === 403) {
        mensajeError = 'Solo los administradores pueden actualizar empleados.';
      }

      setMensaje({ tipo: 'error', texto: mensajeError });
    }
  };

  // Eliminar empleado - Abrir diálogo
  const handleEliminarEmpleado = (empleado) => {
    setEmpleadoToDelete(empleado);
    setDeleteDialogOpen(true);
  };

  // Confirmar eliminación en el diálogo
  const handleConfirmarEliminar = async () => {
    if (!empleadoToDelete) return;

    const empleadoSub = empleadoToDelete.sub;
    setDeleteDialogOpen(false);

    try {
      await organizacionService.eliminarEmpleado(empleadoSub);

      setMensaje({ tipo: 'success', texto: 'Empleado eliminado exitosamente' });

      // Recargar lista de empleados
      cargarDatosEmpresaYEmpleados();

      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (error) {
      console.error("Error eliminando empleado:", error);

      // Mostrar mensaje específico según el tipo de error
      let mensajeError = 'Error al eliminar el empleado';
      if (error.response?.status === 403) {
        if (empleadoSub === sub) {
          mensajeError = 'No puedes eliminar tu propia cuenta. Debe hacerlo otro administrador.';
        } else {
          mensajeError = 'Solo los administradores pueden eliminar empleados.';
        }
      }

      setMensaje({ tipo: 'error', texto: mensajeError });
    } finally {
      setEmpleadoToDelete(null);
    }
  };

  // Manejar cambios en el formulario de edición
  const handleChangeEmpleado = (campo, valor) => {
    setEmpleadoEditado(prev => ({ ...prev, [campo]: valor }));
  };

  // Funciones para editar empresa
  const handleAbrirEdicionEmpresa = () => {
    setEmpresaEditada({ ...empresa });
    setEditandoEmpresa(true);
  };

  const handleCerrarEdicionEmpresa = () => {
    setEditandoEmpresa(false);
    setEmpresaEditada({});
  };

  const handleChangeEmpresa = (campo, valor) => {
    setEmpresaEditada(prev => ({ ...prev, [campo]: valor }));
  };

  const handleGuardarEmpresa = async () => {
    try {
      await organizacionService.actualizarOrganizacion(empresaEditada);

      setEmpresa(empresaEditada);
      setMensaje({ tipo: 'success', texto: 'Datos de la empresa actualizados exitosamente' });
      handleCerrarEdicionEmpresa();

      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (error) {
      console.error("Error actualizando empresa:", error);
      setMensaje({ tipo: 'error', texto: 'Error al actualizar los datos de la empresa' });
    }
  };

  const getRolFormateado = (rolRaw) => {
    if (!rolRaw) return "Colaborador";
    const base = rolRaw.split('|')[0].toUpperCase();
    if (base.startsWith("PROPIETARIO")) return "Propietario";
    if (base.startsWith("ADMINISTRADOR")) return "Administrador";
    return "Colaborador";
  };

  const esAdministrador = esAdminTotal();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1000, mx: "auto", mt: 4, p: 3 }}>
      {mensaje.texto && (
        <Alert severity={mensaje.tipo || 'info'} sx={{ mb: 2 }}>
          {mensaje.texto}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom>
        Gestión de Organización
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: 'text.primary' }}>
        Visualiza la información de tu empresa y empleados
      </Typography>

      {/* Información de la Empresa */}
      <Paper elevation={2} sx={{ p: isMobile ? 2 : 3, mb: 4 }}>
        {empresa ? (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
                Información de la Empresa
              </Typography>
              {esAdministrador && !editandoEmpresa && (
                <Tooltip title="Editar">
                  <IconButton
                    onClick={handleAbrirEdicionEmpresa}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {!editandoEmpresa ? (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.primary">
                    Nombre de la Empresa
                  </Typography>
                  <Typography variant="h6">
                    {empresa.nombre}
                  </Typography>
                </Box>

                {empresa.cuit && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.primary">
                      CUIT
                    </Typography>
                    <Typography variant="body1">
                      {empresa.cuit}
                    </Typography>
                  </Box>
                )}

                {empresa.condicionIVA && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.primary">
                      Condición IVA
                    </Typography>
                    <Typography variant="body1">
                      {empresa.condicionIVA}
                    </Typography>
                  </Box>
                )}

                {empresa.domicilio && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.primary">
                      Domicilio
                    </Typography>
                    <Typography variant="body1">
                      {empresa.domicilio}
                    </Typography>
                  </Box>
                )}

                {!esAdministrador && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Solo los administradores pueden modificar los datos de la empresa
                  </Alert>
                )}
              </Box>
            ) : (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.primary">
                    Nombre de la Empresa
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={empresaEditada.nombre || ''}
                    onChange={(e) => handleChangeEmpresa('nombre', e.target.value)}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.primary">
                    CUIT
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={empresaEditada.cuit || ''}
                    onChange={(e) => handleChangeEmpresa('cuit', e.target.value)}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.primary">
                    Condición IVA
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={empresaEditada.condicionIVA || ''}
                    onChange={(e) => handleChangeEmpresa('condicionIVA', e.target.value)}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.primary">
                    Domicilio
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={empresaEditada.domicilio || ''}
                    onChange={(e) => handleChangeEmpresa('domicilio', e.target.value)}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleGuardarEmpresa}
                    color="primary"
                    sx={{ lineHeight: 1.2 }}
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCerrarEdicionEmpresa}
                    color="secondary"
                    sx={{ lineHeight: 1.2 }}
                  >
                    Cancelar
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Alert severity="warning">
            No se encontraron datos de la empresa. Los datos se cargan automáticamente al iniciar sesión.
          </Alert>
        )}
      </Paper>

      {/* Empleados de la Organización */}
      <Paper elevation={2} sx={{ p: isMobile ? 2 : 3 }}>
        <Box sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 2,
          mb: 3
        }}>
          <Typography variant="h5" sx={{ mb: 0 }}>
            {isMobile ? "Empleados" : `Empleados de la Organización (${empleados.length})`}
          </Typography>
          {esAdministrador && (
            <Button
              variant="contained"
              onClick={() => window.location.hash = '/roles'}
              startIcon={<AdminIcon />}
              fullWidth={isMobile}
              sx={{ borderRadius: 2, lineHeight: 1.2 }}
            >
              Gestionar Roles
            </Button>
          )}
        </Box>

        {empleados.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
            No hay empleados registrados en la organización.
          </Typography>
        ) : (
          <Box>
            {paginatedEmployees.map((empleado, index) => (
              <Box key={empleado.sub}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    gap: 1
                  }}>
                    <Box sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 1,
                      width: '100%'
                    }}>
                      <Typography variant="h6" sx={{ mr: 1 }}>
                        {editandoEmpleado === empleado.sub ? empleadoEditado.nombre : empleado.nombre}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {((editandoEmpleado === empleado.sub ? empleadoEditado.rol : empleado.rol) || "").toUpperCase().includes("ADMINISTRADOR") && (
                          <Chip
                            icon={<AdminIcon />}
                            label="Admin"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {((editandoEmpleado === empleado.sub ? empleadoEditado.rol : empleado.rol) || "").toUpperCase().includes("PROPIETARIO") && (
                          <Chip
                            icon={<BusinessIcon />}
                            label="Dueño"
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        )}
                        {empleado.sub === sub && (
                          <Chip
                            label="Tú"
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                    {esAdministrador && (
                      <Box sx={{
                        display: 'flex',
                        mt: isMobile ? 1 : 0,
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: isMobile ? 'flex-end' : 'flex-start'
                      }}>
                        {editandoEmpleado === empleado.sub ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              startIcon={<SaveIcon />}
                              onClick={handleGuardarEmpleado}
                              size="small"
                              color="primary"
                              sx={{ lineHeight: 1.2 }}
                            >
                              Guardar
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={handleCerrarEdicionEmpleado}
                              size="small"
                              color="secondary"
                              sx={{ lineHeight: 1.2 }}
                            >
                              Cancelar
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Tooltip title="Editar">
                              <IconButton
                                aria-label="editar"
                                onClick={() => handleAbrirEdicionEmpleado(empleado)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            {/* Solo mostrar botón eliminar si no es el propio usuario */}
                            {empleado.sub !== sub && (
                              <Tooltip title="Eliminar">
                                <IconButton
                                  aria-label="eliminar"
                                  onClick={() => handleEliminarEmpleado(empleado)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>

                {editandoEmpleado === empleado.sub ? (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.primary">
                        Nombre
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={empleadoEditado.nombre || ''}
                        onChange={(e) => handleChangeEmpleado('nombre', e.target.value)}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.primary">
                        Email
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={empleadoEditado.email || ''}
                        onChange={(e) => handleChangeEmpleado('email', e.target.value)}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.primary">
                        Teléfono
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={empleadoEditado.telefono || ''}
                        onChange={(e) => handleChangeEmpleado('telefono', e.target.value)}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.primary">
                        Rol
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        select
                        SelectProps={{ native: true }}
                        value={empleadoEditado.rol || ''}
                        onChange={(e) => handleChangeEmpleado('rol', e.target.value)}
                      >
                        <option value="NORMAL">NORMAL</option>
                        <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                      </TextField>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.primary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {empleado.email}
                      </Typography>
                    </Box>

                    {empleado.telefono && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.primary">
                          Teléfono
                        </Typography>
                        <Typography variant="body1">
                          {empleado.telefono}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.primary">
                        Rol
                      </Typography>
                      <Typography variant="body1">
                        {getRolFormateado(empleado.rol)}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.primary">
                        Estado
                      </Typography>
                      <Typography variant="body1">
                        {empleado.activo ? "Activo" : "Inactivo"}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {index < paginatedEmployees.length - 1 && <Divider sx={{ my: 2 }} />}
              </Box>
            ))}

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 1 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, v) => setPage(v)}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        )}

        {!esAdministrador && empleados.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Solo los administradores pueden modificar o eliminar empleados
          </Alert>
        )}
      </Paper>

      {/* Gestión de Miembros e Invitaciones - Acceso rápido */}
      <Paper elevation={2} sx={{ p: isMobile ? 2 : 3, mt: 4, bgcolor: 'action.hover', border: '1px dashed', borderColor: 'primary.main' }}>
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={2}
          alignItems={isMobile ? "stretch" : "center"}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h6">¿Necesitas sumar a alguien más?</Typography>
            <Typography variant="body2" color="text.primary" sx={{ mb: isMobile ? 1 : 0 }}>
              Gestiona invitaciones y permisos desde la nueva sección.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => window.location.hash = '/invitaciones'}
            startIcon={<PersonAddIcon />}
            fullWidth={isMobile}
            sx={{ borderRadius: 2, lineHeight: 1.2 }}
          >
            Ir a Invitaciones
          </Button>
        </Stack>
      </Paper>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>⚠️ Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ¿Estás seguro que deseas eliminar a este empleado?
          </Alert>
          {empleadoToDelete && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>Nombre:</strong> {empleadoToDelete.nombre}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {empleadoToDelete.email}
              </Typography>
              <Typography variant="body2">
                <strong>Rol:</strong> {getRolFormateado(empleadoToDelete.rol)}
              </Typography>
            </Box>
          )}
          <Alert severity="error" sx={{ mt: 2 }}>
            Esta acción es definitiva y no se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmarEliminar}
            color="error"
            variant="contained"
          >
            Eliminar permanentemente
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
