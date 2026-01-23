import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

/**
 * Captura un elemento del DOM como imagen (PNG base64) usando html2canvas.
 * @param {HTMLElement} element
 * @param {object} options Opciones de html2canvas
 * @returns {Promise<string>} dataURL de la imagen
 */
export const captureElementAsImage = async (element, options = {}) => {
  if (!element) throw new Error("Elemento no encontrado para la captura");
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
    ...options,
  });
  return canvas.toDataURL("image/png");
};

/**
 * Exporta un PDF con uno o varios charts (capturados del DOM) y una tabla.
 * Uso típico en reportes:
 *   await exportPdfReport({
 *     title: "Estado de Resultados (2024)",
 *     charts: [{ element: chartRef.current }],
 *     table: { head: [...], body: [...] },
 *     fileName: "estado-de-resultados-2024",
 *   });
 */
export const exportPdfReport = async ({
  title,
  subtitle = "",
  charts = [],
  table,
  fileName = "reporte",
  orientation = "portrait",
  margin = 14,
}) => {
  const doc = new jsPDF({ orientation });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let cursorY = margin;
  doc.setFontSize(14);
  doc.text(title || "Reporte", margin, cursorY);
  if (subtitle) {
    doc.setFontSize(11);
    doc.text(subtitle, margin, cursorY + 6);
    cursorY += 10;
  } else {
    cursorY += 6;
  }

  // Agregar charts capturando los elementos del DOM
  for (const chart of charts) {
    const { element, maxWidthRatio = 1, afterGap = 8, ...captureOpts } =
      chart || {};
    if (!element) continue;
    const imgData = await captureElementAsImage(element, captureOpts);
    const img = doc.getImageProperties(imgData);
    const availableWidth = (pageWidth - margin * 2) * maxWidthRatio;
    const drawWidth = Math.min(availableWidth, pageWidth - margin * 2);
    const drawHeight = (img.height * drawWidth) / img.width;

    if (cursorY + drawHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
    doc.addImage(imgData, "PNG", margin, cursorY, drawWidth, drawHeight);
    cursorY += drawHeight + afterGap;
  }

  // Agregar tabla si se provee
  if (table && table.head && table.body) {
    if (cursorY > pageHeight - margin - 20) {
      doc.addPage();
      cursorY = margin;
    }
    autoTable(doc, {
      ...table,
      head: table.head,
      body: table.body,
      startY: cursorY,
      styles: { fontSize: 9, cellPadding: 2, ...table.styles },
      headStyles: { fillColor: [230, 230, 230], ...table.headStyles },
    });
  }

  doc.save(`${fileName}.pdf`);
};

export default {
  exportPdfReport,
  captureElementAsImage,
};
