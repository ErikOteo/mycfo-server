/**
 * Categorías unificadas para toda la aplicación
 * Estas categorías están sincronizadas con el backend
 */

// Categorías de EGRESOS
export const CATEGORIAS_EGRESO = [
  "Alimentos y Bebidas",
  "Transporte",
  "Vivienda",
  "Servicios Básicos",
  "Ocio y Entretenimiento",
  "Compras Personales",
  "Salud",
  "Educación",
  "Impuestos y Tasas",
  "Servicios Financieros",
  "Compras de Negocio",
  "Otros Egresos",
];

// Categorías de INGRESOS
export const CATEGORIAS_INGRESO = [
  "Ventas de Productos",
  "Prestación de Servicios",
  "Cobranzas",
  "Transferencias Recibidas",
  "Inversiones y Rendimientos",
  "Otros Ingresos",
];

// Todas las categorías (para uso genérico)
export const TODAS_LAS_CATEGORIAS = [
  ...CATEGORIAS_EGRESO,
  ...CATEGORIAS_INGRESO,
];

/**
 * Obtiene las categorías según el tipo de registro
 * @param {string} tipo - 'Ingreso', 'Egreso', o null para todas
 * @returns {string[]} Array de categorías
 */
export function obtenerCategorias(tipo) {
  if (!tipo) return TODAS_LAS_CATEGORIAS;
  if (tipo === "Ingreso") return CATEGORIAS_INGRESO;
  if (tipo === "Egreso") return CATEGORIAS_EGRESO;
  return TODAS_LAS_CATEGORIAS;
}
