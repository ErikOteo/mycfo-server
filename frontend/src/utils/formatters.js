const currencyFormatterAR = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Devuelve una cadena formateada en pesos argentinos.
 * Se asegura de manejar valores nulos, indefinidos o no numéricos.
 */
export const formatCurrencyAR = (value, { fallback = '$ 0' } = {}) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return fallback;
  }

  return currencyFormatterAR.format(numericValue);
};

export const formatPercentage = (value, { fractionDigits = 0, fallback = '0%' } = {}) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return fallback;
  }

  return `${numericValue.toFixed(fractionDigits)}%`;
};
