export const numberFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value, { allowEmpty = false } = {}) => {
  if (value === '' || value === null || typeof value === 'undefined') {
    return allowEmpty ? '' : '$ 0';
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    return allowEmpty ? '' : '$ 0';
  }
  const sign = num < 0 ? '-' : '';
  return `${sign}$ ${numberFormatter.format(Math.abs(num))}`;
};

export const formatCurrencyInput = (value) => formatCurrency(value, { allowEmpty: true });

export const parseCurrency = (raw, { returnEmpty = false } = {}) => {
  if (raw == null) return returnEmpty ? '' : 0;
  const str = raw.toString().trim();
  if (!str) return returnEmpty ? '' : 0;
  const cleaned = str.replace(/\s+/g, '').replace(/\$/g, '');
  const negative = cleaned.startsWith('-');
  const numeric = cleaned.replace(/[^0-9,.-]/g, '');
  if (!numeric || numeric === '-') return returnEmpty ? '' : 0;
  const normalized = numeric
    .replace(/-/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = Number(normalized);
  if (Number.isNaN(num)) return returnEmpty ? '' : 0;
  return negative ? -num : num;
};
