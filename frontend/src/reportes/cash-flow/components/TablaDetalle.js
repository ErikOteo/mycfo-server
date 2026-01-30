import React from 'react';
import { Box, Typography, Paper, useTheme, IconButton, useMediaQuery } from '@mui/material';
import { NavigateBefore, NavigateNext } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import CustomNoRowsOverlay from '../../../shared-components/CustomNoRowsOverlay';

const TablaDetalle = ({ year, ingresos, egresos, saldoInicial, mobileMonthIndex, onMonthChange }) => {
    const theme = useTheme();
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // const ahora = new Date();
    // const ultimoMes = (year === ahora.getFullYear()) ? ahora.getMonth() : 11;
    // const mesesVisibles = meses.slice(0, ultimoMes + 1);
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handlePrevMonth = () => {
        const newIndex = mobileMonthIndex > 0 ? mobileMonthIndex - 1 : 11;
        onMonthChange(newIndex);
    };

    const handleNextMonth = () => {
        const newIndex = mobileMonthIndex < 11 ? mobileMonthIndex + 1 : 0;
        onMonthChange(newIndex);
    };

    const mesesVisibles = meses; // Show all months always (filtered in columns for mobile)

    const formatCurrency = (value) => {
        const num = Number(value);
        if (Number.isNaN(num) || num === 0) return '-';

        const isInteger = Number.isInteger(num);

        return num.toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: isInteger ? 0 : 2,
            maximumFractionDigits: 2
        });
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
    // --- Dynamic Columns Configuration ---
    const monthColumns = mesesVisibles.map((monthName, index) => ({
        field: `month_${index}`,
        headerName: monthName,
        flex: 1,
        minWidth: 85,
        align: 'center',
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

    // Mobile: Show only selected month
    // Desktop: Show all months
    const visibleMonthColumns = isMobile
        ? [monthColumns[mobileMonthIndex]]
        : monthColumns;

    const columns = [
        {
            field: 'concepto',
            headerName: 'Concepto',
            width: 150, // Compact width
            headerAlign: 'center',
            frozen: !isMobile, // Only freeze on desktop ideally, or keep it. Sticky + filtered might be odd but fine.
            flex: isMobile ? 1 : 0, // Expand to fill space on mobile
            renderCell: (params) => (
                <Box sx={{
                    pl: params.row.isTotal ? 0 : 2,
                    fontWeight: (params.row.isBold || params.row.isTotal) ? 'bold' : 'normal',
                    whiteSpace: isMobile ? 'normal' : 'nowrap',
                    wordBreak: 'break-word',
                    lineHeight: isMobile ? 1.2 : 'inherit',
                    py: isMobile ? 1 : 0
                }}>
                    {params.value}
                </Box>
            )
        },
        ...visibleMonthColumns
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
            fontSize: "0.75rem", // Compact font size (12px)
            padding: "0 8px", // Reduced padding
        },
        "& .MuiDataGrid-columnHeaders": {
            backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "#f5f5f5",
            color: "text.primary",
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            fontSize: "0.75rem", // Compact header font
            fontWeight: "bold",
        },
        "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: "bold",
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

            {isMobile && (
                <Paper variant="outlined" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, p: 1, borderRadius: 2 }}>
                    <IconButton onClick={handlePrevMonth} color="primary">
                        <NavigateBefore />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', minWidth: 100, textAlign: 'center' }}>
                        {meses[mobileMonthIndex]}
                    </Typography>
                    <IconButton onClick={handleNextMonth} color="primary">
                        <NavigateNext />
                    </IconButton>
                </Paper>
            )}

            {/* Ingresos Grid */}
            <Typography variant="h6" gutterBottom>Ingresos</Typography>
            <Box sx={{ width: '100%', mb: 4 }}>
                <DataGrid
                    rows={rowsIngresos}
                    columns={columns}
                    density="standard"
                    autoHeight
                    getRowHeight={() => isMobile ? 'auto' : null}
                    hideFooter
                    disableColumnMenu
                    disableColumnResize
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                    slots={{
                        noRowsOverlay: () => <CustomNoRowsOverlay message="No hay ingresos registrados este año" />,
                    }}
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
                    getRowHeight={() => isMobile ? 'auto' : null}
                    hideFooter
                    disableColumnMenu
                    disableColumnResize
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                    slots={{
                        noRowsOverlay: () => <CustomNoRowsOverlay message="No hay egresos registrados este año" />,
                    }}
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
                    getRowHeight={() => isMobile ? 'auto' : null}
                    hideFooter
                    disableColumnMenu
                    disableColumnResize
                    disableRowSelectionOnClick
                    sx={dataGridStyles}
                    slots={{
                        noRowsOverlay: () => <CustomNoRowsOverlay message="No hay datos para el resumen financiero" />,
                    }}
                />
            </Box>
        </Box>
    );
};

export default TablaDetalle;
