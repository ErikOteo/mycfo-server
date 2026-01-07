import { useEffect, useRef } from 'react';

/**
 * Hook para evitar efectos secundarios innecesarios durante la navegación
 * Solo ejecuta el efecto si el componente está realmente visible
 */
export const useNavigationOptimized = (effect, deps = []) => {
  const isVisibleRef = useRef(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Pequeño delay para asegurar que la navegación se complete
    timeoutRef.current = setTimeout(() => {
      if (isVisibleRef.current) {
        effect();
      }
    }, 10);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, deps);

  useEffect(() => {
    return () => {
      isVisibleRef.current = false;
    };
  }, []);
};

export default useNavigationOptimized;
