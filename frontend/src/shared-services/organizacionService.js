// Servicio para manejar datos de organización y empleados
import http from '../api/http';
import API_CONFIG from '../config/api-config';

const API_BASE_URL = API_CONFIG.ADMINISTRACION;

export const organizacionService = {
  // Obtener perfil, empresa y empleados en una sola llamada
  async obtenerInfoCompletaOrganizacion() {
    try {
      const sub = sessionStorage.getItem('sub');
      if (!sub) {
        throw new Error('No hay usuario autenticado');
      }

      const response = await http.get(`${API_BASE_URL}/api/organizacion/info-completa`);

      return response.data;
    } catch (error) {
      console.error('Error al obtener info completa de organización:', error);
      throw error;
    }
  },

  // Obtener datos de la organización del usuario actual
  async obtenerOrganizacionUsuario() {
    try {
      const sub = sessionStorage.getItem('sub');
      if (!sub) {
        throw new Error('No hay usuario autenticado');
      }

      const response = await http.get(`${API_BASE_URL}/api/usuarios/perfil`);

      console.log('🔍 [ORGANIZACION-SERVICE] Perfil response:', response.data);
      console.log('🔍 [ORGANIZACION-SERVICE] EmpresaId:', response.data?.empresaId);

      if (response.data && response.data.empresaId) {
        console.log('🔍 [ORGANIZACION-SERVICE] Obteniendo datos de empresa con ID:', response.data.empresaId);

        // Obtener datos completos de la empresa
        const empresaResponse = await http.get(`${API_BASE_URL}/api/empresas/${response.data.empresaId}`);

        console.log('🔍 [ORGANIZACION-SERVICE] Empresa response:', empresaResponse.data);

        const empresaData = {
          id: response.data.empresaId,
          nombre: empresaResponse.data.nombre || response.data.empresaNombre,
          descripcion: empresaResponse.data.descripcion,
          cuit: empresaResponse.data.cuit,
          condicionIVA: empresaResponse.data.condicionIVA,
          domicilio: empresaResponse.data.domicilio
        };

        console.log('🔍 [ORGANIZACION-SERVICE] Empresa data final:', empresaData);
        return empresaData;
      }

      console.log('⚠️ [ORGANIZACION-SERVICE] No se encontró empresaId en el perfil');
      return null;
    } catch (error) {
      console.error('Error al obtener datos de la organización:', error);
      return null;
    }
  },

  // Obtener empleados de la organización del usuario actual
  async obtenerEmpleadosOrganizacion() {
    try {
      const sub = sessionStorage.getItem('sub');
      if (!sub) {
        throw new Error('No hay usuario autenticado');
      }

      // Primero obtener el ID de la organización del usuario
      const perfilResponse = await http.get(`${API_BASE_URL}/api/usuarios/perfil`);

      if (perfilResponse.data && perfilResponse.data.empresaId) {
        // Obtener empleados de la organización
        const empleadosResponse = await http.get(`${API_BASE_URL}/api/usuarios/empresa/${perfilResponse.data.empresaId}`);

        return empleadosResponse.data;
      }
      return [];
    } catch (error) {
      console.error('Error al obtener empleados de la organización:', error);
      return [];
    }
  },

  // Actualizar datos de la organización (solo admin)
  async actualizarOrganizacion(datosOrganizacion) {
    try {
      const sub = sessionStorage.getItem('sub');
      if (!sub) {
        throw new Error('No hay usuario autenticado');
      }

      // Obtener el ID de la organización
      const perfilResponse = await http.get(`${API_BASE_URL}/api/usuarios/perfil`);

      if (perfilResponse.data && perfilResponse.data.empresaId) {
        const response = await http.put(`${API_BASE_URL}/api/empresas/${perfilResponse.data.empresaId}`, datosOrganizacion);

        return response.data;
      }
      throw new Error('No se encontró la organización del usuario');
    } catch (error) {
      console.error('Error al actualizar organización:', error);
      throw error;
    }
  },

  // Actualizar empleado (solo admin)
  async actualizarEmpleado(empleadoSub, datosEmpleado) {
    try {
      const sub = sessionStorage.getItem('sub');
      if (!sub) {
        throw new Error('No hay usuario autenticado');
      }

      const response = await http.put(`${API_BASE_URL}/api/usuarios/${empleadoSub}`, datosEmpleado);

      return response.data;
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      throw error;
    }
  },

  // Eliminar empleado (solo admin)
  async eliminarEmpleado(empleadoSub) {
    try {
      const sub = sessionStorage.getItem('sub');
      if (!sub) {
        throw new Error('No hay usuario autenticado');
      }

      const response = await http.delete(`${API_BASE_URL}/api/usuarios/${empleadoSub}`);

      return response.data;
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      throw error;
    }
  },

  // Abandonar empresa (para usuarios no propietarios)
  async abandonarEmpresa() {
    try {
      const sub = sessionStorage.getItem('sub');
      if (!sub) {
        throw new Error('No hay usuario autenticado');
      }

      const response = await http.post(`${API_BASE_URL}/api/usuarios/abandonar`, {});

      return response.data;
    } catch (error) {
      console.error('Error al abandonar empresa:', error);
      throw error;
    }
  },

  // Eliminar empresa completa (solo propietario)
  async eliminarEmpresa(empresaId) {
    try {
      const sub = sessionStorage.getItem('sub');
      if (!sub) {
        throw new Error('No hay usuario autenticado');
      }

      const response = await http.delete(`${API_BASE_URL}/api/empresas/${empresaId}`);

      return response.data;
    } catch (error) {
      console.error('Error al eliminar empresa:', error);
      throw error;
    }
  }
};
