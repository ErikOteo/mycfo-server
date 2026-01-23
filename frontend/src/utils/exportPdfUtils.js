import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

const DEFAULT_COLORS = {
  headerFill: [242, 242, 242],
  kpiFill: [46, 125, 50], // verde MyCFO
  kpiText: [255, 255, 255],
  text: [44, 44, 44],
};

/**
 * Captura un elemento del DOM como imagen (PNG base64) usando html2canvas.
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

const drawCover = (
  doc,
  {
    title,
    subtitle,
    meta = [],
    kpis = [],
    summary = [],
    logo,
    logoWidth = 60,
    logoHeight = null,
    border = true,
  },
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentMargin = 16;
  const centerX = pageWidth / 2;
  let y = 40;

  // Marco de la carátula
  if (border) {
    const pad = 10;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.roundedRect(pad, pad, pageWidth - pad * 2, pageHeight - pad * 2, 4, 4);
  }

  if (logo) {
    // logo es un dataURL (PNG/JPEG)
    const w = logoWidth;
    const h = logoHeight || logoWidth; // si no se especifica, usar cuadrado para no deformar
    doc.addImage(logo, "PNG", centerX - w / 2, y, w, h);
    y += h + 20;
  }

  doc.setFontSize(20);
  doc.text(title || "Reporte", centerX, y, { align: "center" });
  y += 10;

  if (subtitle) {
    doc.setFontSize(13);
    doc.text(subtitle, centerX, y, { align: "center" });
    y += 12;
  }

  if (meta.length) {
    doc.setFontSize(10);
    meta.forEach((m) => {
      y += 6;
      doc.text(`${m.label}: ${m.value}`, centerX, y, { align: "center" });
    });
    y += 6;
  }

  if (kpis.length) {
    y += 10;
    const boxWidth = 40;
    const baseHeight = 12;
    const gap = 8;
    const available = pageWidth - contentMargin * 2;
    const totalWidth = kpis.length * boxWidth + (kpis.length - 1) * gap;
    const startXBase =
      contentMargin + Math.max(0, (available - totalWidth) / 2);
    let startX = startXBase;
    let maxBoxHeight = baseHeight;
    const measured = [];

    kpis.forEach((kpi) => {
      const paddingX = 3;
      const paddingY = 4;
      const maxTextWidth = boxWidth - paddingX * 2;
      const labelLines = doc.splitTextToSize(kpi.label || "", maxTextWidth);
      const valueLines = doc.splitTextToSize(kpi.value || "", maxTextWidth);
      const textHeight =
        paddingY * 2 + labelLines.length * 9 + valueLines.length * 11 + 4; // pequeño gap entre bloques
      const boxHeight = Math.max(baseHeight, textHeight);
      measured.push({ labelLines, valueLines, boxHeight });
      if (boxHeight > maxBoxHeight) maxBoxHeight = boxHeight;
    });

    startX = startXBase;
    measured.forEach(({ labelLines, valueLines, boxHeight }, idx) => {
      doc.setFillColor(...DEFAULT_COLORS.kpiFill);
      doc.roundedRect(startX, y, boxWidth, boxHeight, 3, 3, "F");

      doc.setTextColor(...DEFAULT_COLORS.kpiText);
      doc.setFontSize(9);
      doc.text(labelLines, startX + 3, y + 6);
      doc.setFontSize(11);
      doc.text(valueLines, startX + 3, y + 6 + labelLines.length * 10);
      doc.setTextColor(...DEFAULT_COLORS.text);

      startX += boxWidth + gap;
    });
    y += maxBoxHeight + 16;
  }

  if (summary && summary.length) {
    doc.setFontSize(11);
    doc.text("Resumen ejecutivo:", centerX, y, { align: "center" });
    y += 8;
    doc.setFontSize(10);
    summary.forEach((line) => {
      doc.text(`• ${line}`, centerX, y, { align: "center" });
      y += 6;
    });
  }
};

const addHeaderFooter = (doc, { title, footerOnFirstPage = true }) => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Footer con numeracion
    if (footerOnFirstPage || i > 1) {
      doc.text(`Pag ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 8, {
        align: "right",
      });
    }
  }
};

/**
 * Exporta un PDF con caratula opcional, charts y tabla.
 * cover: { show, logo, subtitle, meta: [{label,value}], kpis: [{label,value}] }
 */
export const exportPdfReport = async ({
  title,
  subtitle = "",
  charts = [],
  table,
  fileName = "reporte",
  orientation = "portrait",
  margin = 14,
  cover = null,
  footerOnFirstPage = false,
}) => {
  const doc = new jsPDF({ orientation });
  doc.setTextColor(...DEFAULT_COLORS.text);
  let cursorY = margin;

  // Caratula
  if (cover && cover.show) {
    drawCover(doc, {
      title,
      subtitle: cover.subtitle || subtitle,
      meta: cover.meta || [],
      kpis: cover.kpis || [],
      summary: cover.summary || [],
      logo: cover.logo,
      logoWidth: cover.logoWidth,
      logoHeight: cover.logoHeight,
    });
    doc.addPage();
    cursorY = margin;
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(18);
  doc.text(title || "Reporte", margin, cursorY);
  if (subtitle) {
    doc.setFontSize(12);
    doc.text(subtitle, margin, cursorY + 6);
    cursorY += 12;
  } else {
    cursorY += 10;
  }

  // Charts
  for (const chart of charts) {
    const {
      element,
      maxWidthRatio = 1,
      afterGap = 8,
      ...captureOpts
    } = chart || {};
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

  // Tabla
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
      styles: {
        fontSize: 10,
        cellPadding: 2.5,
        textColor: DEFAULT_COLORS.text,
        lineWidth: 0.15,
        lineColor: [200, 200, 200],
        ...table.styles,
      },
      headStyles: {
        fillColor: DEFAULT_COLORS.headerFill,
        textColor: DEFAULT_COLORS.text,
        halign: "center",
        lineWidth: 0.2,
        lineColor: [180, 180, 180],
        ...table.headStyles,
      },
      tableLineWidth: 0.2,
      tableLineColor: [180, 180, 180],
      alternateRowStyles: { fillColor: [250, 250, 250] },
      bodyStyles: { textColor: DEFAULT_COLORS.text },
    });
  }

  addHeaderFooter(doc, { title, footerOnFirstPage });
  doc.save(`${fileName}.pdf`);
};

export default {
  exportPdfReport,
  captureElementAsImage,
};
