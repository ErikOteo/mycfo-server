# coding: ascii
import pathlib,re
path = pathlib.Path('frontend/src/pronostico/presupuesto/components/MesDetalle.js')
text = path.read_text(errors='replace')
new = '''// ===== Export =====
  const handleExportExcel = () => {
    const excelData = [
      ["Categoria", "Tipo", "Monto Estimado", "Monto Registrado", "Desvio"],
      ...lineasCompleto.map((item) => {
        const estimado = Number(item.montoEstimado) || 0;
        const real = Number(item.real) || 0;
        const desvio = item.tipo === "Egreso" ? estimado - real : real - estimado;
        return [item.categoria, item.tipo, estimado, real, desvio];
      }),
      ["", "", "", "", ""],
      ["Resultado", "", "", "", resultado],
      ["Cumplimiento", "", "", "", `${(cumplimiento * 100).toFixed(0)}%`],
    ];

    const colsConfig = [
      { wch: 28 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
    ];
    const mergesConfig = [];
    const currencyColumns = ["C", "D", "E"];

    exportToExcel(
      excelData,
      `Mes_${nombreMes}_${presupuestoNombre || ''}`,
      "Detalle Mes",
      colsConfig,
      mergesConfig,
      currencyColumns,
      {
        headerRows: [0],
        totalRows: [excelData.length - 2],
        zebra: true,
        freezePane: { rowSplit: 1, colSplit: 1 },
      }
    );
  };

  const handleExportPdf = async () => {
    try {
      const tableHead = [["Categoria", "Tipo", "Estimado", "Real", "Desvio"]];
      const tableBody = lineasCompleto.map((item) => {
        const estimado = Number(item.montoEstimado) || 0;
        const real = Number(item.real) || 0;
        const desvio = item.tipo === "Egreso" ? estimado - real : real - estimado;
        return [
          item.categoria,
          item.tipo,
          formatCurrency(estimado),
          formatCurrency(real),
          formatCurrency(desvio),
        ];
      });
      tableBody.append(["", "", "", "", ""]);
      tableBody.append(["Resultado", "", "", "", formatCurrency(resultado)]);

      const charts = [];
      if (pieDataIngresos.length and ingresosPieRef.current): charts.append({ "element": ingresosPieRef.current })
      if (barDataIngresos.length and ingresosBarsRef.current): charts.append({ "element": ingresosBarsRef.current })
      if (pieDataEgresos.length and egresosPieRef.current): charts.append({ "element": egresosPieRef.current })
      if (barDataEgresos.length and egresosBarsRef.current): charts.append({ "element": egresosBarsRef.current })

      await exportPdfReport({
        title: `Detalle de ${nombreMes}`,
        subtitle: presupuestoNombre,
        charts,
        table: { head: tableHead, body: tableBody },
        fileName: `Mes_${nombreMes}_${presupuestoNombre || ''}`,
        footerOnFirstPage: false,
        cover: {
          show: true,
          subtitle: nombreMes,
          logo: logoDataUrl,
          meta: [
            { label: "Presupuesto", value: presupuestoNombre || '-' },
            { label: "Generado", value: new Date().toLocaleDateString('es-AR') },
          ],
          kpis: [
            { label: "Ingresos", value: formatCurrency(totalIngresos) },
            { label: "Egresos", value: formatCurrency(totalEgresos) },
            { label: "Resultado", value: formatCurrency(resultado) },
          ],
          summary: [
            `Cumplimiento: ${(cumplimiento * 100).toFixed(0)}%`,
            `Estimados sin registrar: ${vencidosEstimados}`,
          ],
        },
      });
    } catch (e) {
      console.error('Error al exportar PDF de mes:', e);
      alert('No se pudo generar el PDF. Intente nuevamente.');
    }
  };
'''
text = re.sub(r'// ===== Export =====[\s\S]*?// ===== CRUD =====', new + '\n// ===== CRUD =====', text, flags=re.S)
path.write_text(text, encoding='utf-8')
