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
  Chip
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

  const sub = sessionStorage.getItem("sub");
  const organizacionId = sessionStorage.getItem("organizacionId");

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatosEmpresaYEmpleados();
  }, []);

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

  // Eliminar empleado
  const handleEliminarEmpleado = async (empleadoSub) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este empleado?")) {
      return;
    }

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

  const esAdministrador = usuarioRol === "ADMINISTRADOR";

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
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#000' }}>
        Visualiza la información de tu empresa y empleados
      </Typography>

      {/* Información de la Empresa */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        {empresa ? (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
                Información de la Empresa
              </Typography>
              {esAdministrador && !editandoEmpresa && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleAbrirEdicionEmpresa}
                  color="primary"
                >
                  Editar
                </Button>
              )}
            </Box>

            {!editandoEmpresa ? (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Nombre de la Empresa
                  </Typography>
                  <Typography variant="h6">
                    {empresa.nombre}
                  </Typography>
                </Box>

                {empresa.cuit && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      CUIT
                    </Typography>
                    <Typography variant="body1">
                      {empresa.cuit}
                    </Typography>
                  </Box>
                )}

                {empresa.condicionIVA && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Condición IVA
                    </Typography>
                    <Typography variant="body1">
                      {empresa.condicionIVA}
                    </Typography>
                  </Box>
                )}

                {empresa.domicilio && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
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
                  <Typography variant="body2" color="text.secondary">
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
                  <Typography variant="body2" color="text.secondary">
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
                  <Typography variant="body2" color="text.secondary">
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
                  <Typography variant="body2" color="text.secondary">
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
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCerrarEdicionEmpresa}
                    color="secondary"
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
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Empleados de la Organización ({empleados.length})
        </Typography>
        
        {empleados.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
            No hay empleados registrados en la organización.
          </Typography>
        ) : (
          <Box>
            {empleados.map((empleado, index) => (
              <Box key={empleado.sub}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">
                        {editandoEmpleado === empleado.sub ? empleadoEditado.nombre : empleado.nombre}
                      </Typography>
                      {(editandoEmpleado === empleado.sub ? empleadoEditado.rol : empleado.rol) === "ADMINISTRADOR" && (
                        <Chip 
                          icon={<AdminIcon />} 
                          label="Admin" 
                          size="small" 
                          color="primary" 
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
                    {esAdministrador && (
                      <Box>
                        {editandoEmpleado === empleado.sub ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              startIcon={<SaveIcon />}
                              onClick={handleGuardarEmpleado}
                              size="small"
                              color="primary"
                            >
                              Guardar
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={handleCerrarEdicionEmpleado}
                              size="small"
                              color="secondary"
                            >
                              Cancelar
                            </Button>
                          </Box>
                        ) : (
                          <Box>
                            <IconButton 
                              aria-label="editar"
                              onClick={() => handleAbrirEdicionEmpleado(empleado)}
                              sx={{ mr: 1 }}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                            {/* Solo mostrar botón eliminar si no es el propio usuario */}
                            {empleado.sub !== sub && (
                              <IconButton 
                                aria-label="eliminar"
                                onClick={() => handleEliminarEmpleado(empleado.sub)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
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
                      <Typography variant="body2" color="text.secondary">
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
                      <Typography variant="body2" color="text.secondary">
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
                      <Typography variant="body2" color="text.secondary">
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
                      <Typography variant="body2" color="text.secondary">
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
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {empleado.email}
                      </Typography>
                    </Box>

                    {empleado.telefono && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Teléfono
                        </Typography>
                        <Typography variant="body1">
                          {empleado.telefono}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Rol
                      </Typography>
                      <Typography variant="body1">
                        {empleado.rol}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Estado
                      </Typography>
                      <Typography variant="body1">
                        {empleado.activo ? "Activo" : "Inactivo"}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {index < empleados.length - 1 && <Divider sx={{ my: 2 }} />}
              </Box>
            ))}
          </Box>
        )}

        {!esAdministrador && empleados.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Solo los administradores pueden modificar o eliminar empleados
          </Alert>
        )}
      </Paper>

      {/* Invitar Colaboradores */}
      <InvitarColaboradores 
        empresaNombre={empresa?.nombre} 
        esAdministrador={esAdministrador} 
      />

    </Box>
  );
}
