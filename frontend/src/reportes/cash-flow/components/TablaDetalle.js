import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const TablaDetalle = ({ year, ingresos, egresos, saldoInicial }) => {
    const theme = useTheme();
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const ahora = new Date();
    const ultimoMes = (year === ahora.getFullYear()) ? ahora.getMonth() : 11;
    const mesesVisibles = meses.slice(0, ultimoMes + 1);

    const formatCurrency = (value) => {
        const num = Number(value);
        if (Number.isNaN(num) || num === 0) return '-';
        return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    };

    const normalizeCategoria = (c) => {
        const s = (c ?? '').toString().trim();
        return s.length ? s : 'Sin categoría';
    };

    const agruparYOrdenar = (data) => {
        const map = {};
        data.forEach((tx) => {
            const mes = new Date(tx.fecha).getMonth();
            const cat = normalizeCategoria(tx.categoria);
            if (!map[cat]) {
                map[cat] = Array(12).fill(0);
            }
            map[cat][mes] += tx.monto;
        });
        return Object.entries(map)
            .map(([categoria, valores]) => ({
                categoria,
                valores,
                total: valores.reduce((a, b) => a + b, 0),
            }))
            .sort((a, b) => b.total - a.total);
    };

    const ingresosPorCategoria = agruparYOrdenar(ingresos);
    const egresosPorCategoria = agruparYOrdenar(egresos);

    const totalIngresos = Array(12).fill(0);
    const totalEgresos = Array(12).fill(0);
    ingresos.forEach((tx) => totalIngresos[new Date(tx.fecha).getMonth()] += Number(tx.monto) || 0);
    egresos.forEach((tx) => totalEgresos[new Date(tx.fecha).getMonth()] += Math.abs(Number(tx.monto) || 0));

    const netos = totalIngresos.map((v, i) => v - totalEgresos[i]);
    const saldoFinal = [];
    saldoFinal[0] = saldoInicial + netos[0];
    for (let i = 1; i < 12; i++) saldoFinal[i] = saldoFinal[i - 1] + netos[i];

    // --- Dynamic Columns Configuration ---
    const monthColumns = mesesVisibles.map((monthName, index) => ({
        field: `month_${index}`,
        headerName: monthName,
        width: 100, // Fixed width for months
        align: 'right',
        headerAlign: 'center',
        renderCell: (params) => {
            // Custom styling for Totals section colors
            const textColor = params.row.colorType === 'green' ? 'green'
                : params.row.colorType === 'red' ? 'red'
                    : params.row.colorType === 'dynamic' ? (params.value >= 0 ? 'green' : 'red')
                        : 'inherit';
            return (
                <Box sx={{ color: textColor, fontWeight: params.row.isBold ? 'bold' : 'normal' }}>
                    {params.value !== undefined ? formatCurrency(params.value) : '-'}
                </Box>
            );
        }
    }));

    const columns = [
        {
            field: 'concepto',
            headerName: 'Concepto',
            width: 250,
            frozen: true,
            renderCell: (params) => (
                <Box sx={{ pl: params.row.isTotal ? 0 : 2, fontWeight: (params.row.isBold || params.row.isTotal) ? 'bold' : 'normal' }}>
                    {params.value}
                </Box>
            )
        },
        ...monthColumns
    ];

    // --- Row Generation ---
    const generateRows = (data, prefix, colorType) => {
        return data.map((item, idx) => {
            const row = {
                id: `${prefix}-${idx}`,
                concepto: normalizeCategoria(item.categoria),
                colorType: colorType
            };
            item.valores.forEach((val, monthIdx) => {
                row[`month_${monthIdx}`] = val;
            });
            return row;
        });
    };

    const rowsIngresos = generateRows(ingresosPorCategoria, 'ing', 'green');
    const rowsEgresos = generateRows(egresosPorCategoria, 'egr', 'red');

    // Totals Rows
    const rowsSummary = [
        {
            id: 'total-ing',
            concepto: 'Total Ingresos',
            isBold: true,
            colorType: 'green',
            ...totalIngresos.reduce((acc, val, idx) => ({ ...acc, [`month_${idx}`]: val }), {})
        },
        {
            id: 'total-egr',
            concepto: 'Total Egresos',
            isBold: true,
            colorType: 'red',
            ...totalEgresos.reduce((acc, val, idx) => ({ ...acc, [`month_${idx}`]: val instanceof Error ? 0 : -val }), {}) // Showing negatives for egress
        },
        {
            id: 'net-cash',
            concepto: 'Net Cash Flow',
            isBold: true,
            colorType: 'dynamic',
            ...netos.reduce((acc, val, idx) => ({ ...acc, [`month_${idx}`]: val }), {})
        },
        {
            id: 'cash-hand',
            concepto: 'Cash on hand (Fin)',
            isBold: true,
            ...saldoFinal.reduce((acc, val, idx) => ({ ...acc, [`month_${idx}`]: val }), {})
        }
    ];

    // Styles copied EXACTLY from TablaRegistrosV2.js
    const dataGridStyles = {
        backgroundColor: "background.paper",
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        "& .MuiDataGrid-cell": {
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            display: "flex",
            alignItems: "center",
            fontSize: "0.875rem",
        },
        "& .MuiDataGrid-columnHeaders": {
            backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "#f5f5f5",
            color: "text.primary",
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        },
        "& .MuiDataGrid-columnHeader": {
            "&:focus": { outline: "none" },
        },
        "& .MuiDataGrid-sortIcon": {
            display: "none",
        },
        "& .MuiDataGrid-menuIcon": {
            display: "none",
        },
        "& .MuiDataGrid-iconButtonContainer": {
            display: "none",
        },
        "& .MuiDataGrid-row:hover": {
            backgroundColor: (theme) => theme.palette.action.hover,
        },
        "& .MuiDataGrid-footerContainer": {
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        },
        // To remove cell focus outline
        "& .MuiDataGrid-cell:focus": {
            outline: "none",
        }
    };

    return (
        <Box sx={{ width: '100%', py: 2 }}>

            {/* Ingresos Grid */}
            <Typography variant="h6" gutterBottom>Ingresos</Typography>
            <Box sx={{ width: '100%', mb: 4 }}>
                <DataGrid
                    rows={rowsIngresos}
                    columns={columns}
                    density="standard"
                    autoHeight
                    hideFooter
                    disableColumnMenu
                    disableColumnResize
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                />
            </Box>

            {/* Egresos Grid */}
            <Typography variant="h6" gutterBottom>Egresos</Typography>
            <Box sx={{ width: '100%', mb: 4 }}>
                <DataGrid
                    rows={rowsEgresos}
                    columns={columns}
                    density="standard"
                    autoHeight
                    hideFooter
                    disableColumnMenu
                    disableColumnResize
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                />
            </Box>

            {/* Summary Grid */}
            <Typography variant="h6" gutterBottom>Resumen Financiero</Typography>
            <Box sx={{ width: '100%' }}>
                <DataGrid
                    rows={rowsSummary}
                    columns={columns}
                    density="standard"
                    autoHeight
                    hideFooter
                    disableColumnMenu
                    disableColumnResize
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                />
            </Box>
        </Box>
    );
};

export default TablaDetalle;
