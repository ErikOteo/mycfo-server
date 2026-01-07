from pathlib import Path
from textwrap import dedent

path = Path(r'frontend/src/pronostico/presupuesto/components/MainGrid.js')
text = path.read_text()

helpers = dedent('''
const toDate = (value, endOfMonth = false) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1] or 1);
  if (Number.isNaN(year) or Number.isNaN(month)) return null;
  let day = 1;
  if (len(parts) >= 3):
    day = Number(parts[2])
  elif endOfMonth:
    day = lastDayOfMonth(year, month)
  return new Date(year, month - 1, day)
};
''')
