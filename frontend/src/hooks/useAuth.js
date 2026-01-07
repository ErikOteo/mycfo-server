import { useState, useEffect } from 'react';

// Hook personalizado para manejar el estado de autenticación
export function useAuth() {
  const [userId, setUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Función para obtener datos de autenticación del sessionStorage
  const getAuthData = () => {
    try {
      const accessToken = sessionStorage.getItem('accessToken');
      const sub = sessionStorage.getItem('sub'); // Este es el userId
      
      return {
        userId: sub,
        isAuthenticated: !!accessToken
      };
    } catch (error) {
      console.warn('Error leyendo sessionStorage:', error);
      return {
        userId: null,
        isAuthenticated: false
      };
    }
  };

  // Actualizar estado cuando cambia el storage (logout en otra pestaña)
  const handleStorageChange = (event) => {
    if (event.key === 'accessToken' || event.key === 'sub' || event.key === null) {
      const authData = getAuthData();
      setUserId(authData.userId);
      setIsAuthenticated(authData.isAuthenticated);
    }
  };

  // Inicializar y configurar listeners
  useEffect(() => {
    // Obtener estado inicial
    const authData = getAuthData();
    setUserId(authData.userId);
    setIsAuthenticated(authData.isAuthenticated);

    // Escuchar cambios en el storage (para logout en otras pestañas)
    window.addEventListener('storage', handleStorageChange);

    // También escuchar evento personalizado de logout
    window.addEventListener('auth-logout', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-logout', handleStorageChange);
    };
  }, []);

  return {
    userId,
    isAuthenticated
  };
}
