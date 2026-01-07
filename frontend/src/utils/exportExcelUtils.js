import * as XLSX from 'xlsx';

/**
 * Exporta datos a un archivo Excel (.xlsx) con formato avanzado.
 * Permite definir encabezados, subtotales y aplicar estilos.
 * @param {Array<Array<any>>} data Las filas de datos a exportar. Cada sub-array es una fila.
 * @param {string} fileName El nombre del archivo sin extensión.
 * @param {string} sheetName El nombre de la hoja dentro del libro de Excel.
 * @param {Array<Object>} colsConfig Configuración de las columnas para anchos y formatos.
 *   Ej: [{ wch: 25 }, { wch: 25 }, { wch: 15, z: '$ #,##0.00' }]
 * @param {Array<Object>} mergesConfig Configuración para combinar celdas.
 *   Ej: [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }] // Combina A1:C1
 * @param {Array<string>} currencyColumns Opcional. Un array de letras de columna (ej. ['C', 'D']) para aplicar formato de moneda.
 */
export const exportToExcel = (data, fileName, sheetName = "Sheet1", colsConfig = [], mergesConfig = [], currencyColumns = []) => {
    let ws;

    if (!data || data.length === 0) {
        // Si no hay datos, crear una hoja simple con un mensaje
        ws = XLSX.utils.aoa_to_sheet([["No hay datos para exportar."]]);
        ws["!cols"] = [{ wch: 30 }]; // Ancho para la columna del mensaje
    } else {
        ws = XLSX.utils.aoa_to_sheet(data);

        // Asegurarse de que !ref esté definido si hay datos, incluso si aoa_to_sheet no lo hizo por alguna razón
        if (!ws['!ref']) {
            const maxRow = data.length - 1;
            const maxCol = data.reduce((max, row) => Math.max(max, row.length - 1), 0);
            if (maxRow >= 0 && maxCol >= 0) {
                ws['!ref'] = XLSX.utils.encode_range({s: {r:0, c:0}, e: {r:maxRow, c:maxCol}});
            }
        }

        // Aplicar anchos de columna
        if (colsConfig.length > 0) {
            ws["!cols"] = colsConfig;
        }

        // Aplicar combinaciones de celdas SOLO SI LA HOJA TIENE UN RANGO DEFINIDO
        if (mergesConfig.length > 0 && ws['!ref']) {
            ws["!merges"] = mergesConfig;
        }

        // Aplicar formato de moneda a las columnas especificadas SOLO SI LA HOJA TIENE UN RANGO DEFINIDO
        if (currencyColumns.length > 0 && ws['!ref']) {
            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (const colLetter of currencyColumns) {
                    const C = XLSX.utils.decode_col(colLetter);
                    const cellAddress = XLSX.utils.encode_cell({r:R, c:C});
                    if (ws[cellAddress] && ws[cellAddress].t === 'n') { // Si es un número
                        ws[cellAddress].z = '$ #,##0.00'; // Formato de moneda
                    }
                }
            }
        }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};
