// usePermisos.js
import React, { useMemo, useState, useEffect } from 'react';

/**
 * Hook para manejar permisos granulares en el frontend
 */
const usePermisos = () => {
    // Usar un trigger para forzar re-renderizado cuando cambia la sesión
    const [trigger, setTrigger] = useState(0);

    // Función interna para detectar si el rol es administrativo
    const checkIsAdmin = () => {
        const rol = sessionStorage.getItem('rol');
        if (!rol) return false;
        const upperRol = rol.toUpperCase();
        // Es admin si comienza con ADMINISTRADOR
        return upperRol.startsWith('ADMINISTRADOR');
    };

    useEffect(() => {
        const handleUpdate = () => setTrigger(t => t + 1);
        window.addEventListener('userDataUpdated', handleUpdate);
        return () => window.removeEventListener('userDataUpdated', handleUpdate);
    }, []);

    const actualPermisos = useMemo(() => {
        const stored = sessionStorage.getItem('permisos');
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error("Error al parsear permisos de la sesión", e);
            return null;
        }
    }, [trigger]);


    /**
     * Verifica si el usuario tiene un permiso específico
     * @param {string} modulo - Nombre del módulo
     * @param {string} accion - Acción requerida ('view' o 'edit')
     * @returns {boolean}
     */
    const tienePermiso = (modulo, accion = 'view') => {
        // GOD MODE: Si es administrador total, siempre tiene permiso
        if (checkIsAdmin()) return true;

        if (!actualPermisos) return false;

        // Si el módulo no existe en el JSON, denegamos
        if (!actualPermisos[modulo]) return false;

        // Si pide 'view' y tiene 'edit', concedemos (edit implica view)
        if (accion === 'view' && actualPermisos[modulo].edit) return true;

        return !!actualPermisos[modulo][accion];
    };

    /**
     * Helper para verificar si es un administrador total
     */
    const esAdminTotal = () => {
        return checkIsAdmin();
    };

    return { tienePermiso, esAdminTotal, permisos: actualPermisos };
};

export default usePermisos;
