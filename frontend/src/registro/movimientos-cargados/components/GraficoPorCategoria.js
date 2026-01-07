import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function GraficoPorCategoria({ data }) {
  const datosAgrupados = useMemo(() => {
    const mapa = {};

    data.forEach(item => {
      const monto = item.tipo === "Egreso" ? -Math.abs(item.monto) : Math.abs(item.monto);
      if (Array.isArray(item.categorias)) {
        item.categorias.forEach(cat => {
          if (!mapa[cat]) {
            mapa[cat] = 0;
          }
          mapa[cat] += monto;
        });
      }
    });

    return Object.entries(mapa).map(([categoria, total]) => ({
      categoria,
      monto: total
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={datosAgrupados}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="categoria" />
        <YAxis domain={['auto', dataMax => dataMax * 1.1]} />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="monto"
          fill="#1976d2"
          barSize={30}

        />
      </BarChart>
    </ResponsiveContainer>
  );
}
