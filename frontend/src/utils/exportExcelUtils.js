import * as XLSX from 'xlsx';

/**
 * Exporta datos a un archivo Excel (.xlsx) con formato avanzado.
 * Permite definir encabezados, subtotales y aplicar estilos.
 * @param {Array<Array<any>>} data Las filas de datos a exportar. Cada sub-array es una fila.
 * @param {string} fileName El nombre del archivo sin extension.
 * @param {string} sheetName El nombre de la hoja dentro del libro de Excel.
 * @param {Array<Object>} colsConfig Configuracion de las columnas para anchos y formatos.
 *   Ej: [{ wch: 25 }, { wch: 25 }, { wch: 15, z: '$ #,##0.00' }]
 * @param {Array<Object>} mergesConfig Configuracion para combinar celdas.
 *   Ej: [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }] // Combina A1:C1
 * @param {Array<string>} currencyColumns Opcional. Un array de letras de columna (ej. ['C', 'D']) para aplicar formato de moneda.
 * @param {Object} options Opciones de estilo extra.
 *   - headerRows: indices de filas (0-based) que se estilizan como encabezado
 *   - totalRows: indices de filas (0-based) que se estilizan como totales/resumen
 *   - zebra: boolean, aplica fondo alternado en filas de datos
 *   - freezePane: { rowSplit, colSplit } para congelar panes
 *   - headerFill / totalFill / zebraFill: colores hex sin '#'
 */
export const exportToExcel = (
    data,
    fileName,
    sheetName = "Sheet1",
    colsConfig = [],
    mergesConfig = [],
    currencyColumns = [],
    options = {}
) => {
    let ws;

    const {
        headerRows = [],
        totalRows = [],
        zebra = false,
        freezePane = null,
        headerFill = "f5f5f5",
        totalFill = "e8f5e9",
        zebraFill = "fbfbfb",
    } = options || {};

    if (!data || data.length === 0) {
        // Si no hay datos, crear una hoja simple con un mensaje
        ws = XLSX.utils.aoa_to_sheet([["No hay datos para exportar."]]);
        ws["!cols"] = [{ wch: 30 }]; // Ancho para la columna del mensaje
    } else {
        ws = XLSX.utils.aoa_to_sheet(data);

        // Asegurar que !ref exista
        if (!ws['!ref']) {
            const maxRow = data.length - 1;
            const maxCol = data.reduce((max, row) => Math.max(max, row.length - 1), 0);
            if (maxRow >= 0 && maxCol >= 0) {
                ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxCol } });
            }
        }

        const range = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : null;

        // Anchos de columna
        if (colsConfig.length > 0) {
            ws["!cols"] = colsConfig;
        }

        // Merges
        if (mergesConfig.length > 0 && ws['!ref']) {
            ws["!merges"] = mergesConfig;
        }

        // Formato de moneda
        if (currencyColumns.length > 0 && range) {
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (const colLetter of currencyColumns) {
                    const C = XLSX.utils.decode_col(colLetter);
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (ws[cellAddress] && ws[cellAddress].t === 'n') {
                        ws[cellAddress].z = '$ #,##0.00';
                    }
                }
            }
        }

        // Estilos basicos
        const applyFillToRow = (rowIndex, fillColor, bold = false) => {
            if (!range) return;
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const addr = XLSX.utils.encode_cell({ r: rowIndex, c: C });
                if (!ws[addr]) continue;
                ws[addr].s = ws[addr].s || {};
                ws[addr].s.fill = { patternType: "solid", fgColor: { rgb: fillColor } };
                if (bold) {
                    ws[addr].s.font = { ...(ws[addr].s.font || {}), bold: true };
                }
            }
        };

        headerRows.forEach((r) => applyFillToRow(r, headerFill, true));
        totalRows.forEach((r) => applyFillToRow(r, totalFill, true));

        if (zebra && range) {
            for (let R = range.s.r; R <= range.e.r; ++R) {
                if (headerRows.includes(R) || totalRows.includes(R)) continue;
                if ((R - range.s.r) % 2 === 1) {
                    applyFillToRow(R, zebraFill, false);
                }
            }
        }

        // Congelar panes
        if (freezePane && (freezePane.rowSplit || freezePane.colSplit)) {
            ws['!freeze'] = {
                xSplit: freezePane.colSplit || 0,
                ySplit: freezePane.rowSplit || 0,
                topLeftCell: XLSX.utils.encode_cell({ r: freezePane.rowSplit || 0, c: freezePane.colSplit || 0 }),
                activePane: "topLeft",
                state: "frozen",
            };
        }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`, { cellStyles: true });
};
