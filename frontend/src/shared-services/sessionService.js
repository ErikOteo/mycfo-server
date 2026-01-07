// Servicio para manejar datos de sesión del usuario y empresa
export const sessionService = {
  // Obtener datos del usuario desde sessionStorage
  getUsuario() {
    return {
      sub: sessionStorage.getItem('sub'),
      nombre: sessionStorage.getItem('nombre'),
      email: sessionStorage.getItem('email'),
      telefono: sessionStorage.getItem('telefono')
    };
  },

  // Obtener datos de la empresa desde sessionStorage
  getEmpresa() {
    const nombre = sessionStorage.getItem('empresaNombre');
    if (!nombre) return null;

    return {
      nombre: nombre,
      cuit: sessionStorage.getItem('empresaCuit') || '',
      condicionIVA: sessionStorage.getItem('empresaCondicionIVA') || '',
      domicilio: sessionStorage.getItem('empresaDomicilio') || ''
    };
  },

  // Verificar si hay datos de empresa disponibles
  tieneEmpresa() {
    return !!sessionStorage.getItem('empresaNombre');
  },

  // Actualizar datos de la empresa en sessionStorage
  actualizarEmpresa(datosEmpresa) {
    if (datosEmpresa) {
      sessionStorage.setItem('empresaNombre', datosEmpresa.nombre || '');
      sessionStorage.setItem('empresaCuit', datosEmpresa.cuit || '');
      sessionStorage.setItem('empresaCondicionIVA', datosEmpresa.condicionIVA || '');
      sessionStorage.setItem('empresaDomicilio', datosEmpresa.domicilio || '');
    }
  },

  // Limpiar datos de sesión
  limpiarSesion() {
    sessionStorage.removeItem('empresaNombre');
    sessionStorage.removeItem('empresaCuit');
    sessionStorage.removeItem('empresaCondicionIVA');
    sessionStorage.removeItem('empresaDomicilio');
  }
};
