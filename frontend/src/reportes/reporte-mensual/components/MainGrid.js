import * as React from 'react';
import {
    Box, Typography, Grid, Paper
} from '@mui/material';
import TablaDetalle from './TablaDetalle';
import Filtros from './Filtros';
import ExportadorSimple from '../../../shared-components/ExportadorSimple';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { exportToExcel } from '../../../utils/exportExcelUtils'; // Importando la utilidad de Excel
import API_CONFIG from '../../../config/api-config';
import LoadingSpinner from '../../../shared-components/LoadingSpinner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919', '#19C9FF'];

export default function MainGrid() {
    const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
    const [selectedCategoria, setSelectedCategoria] = React.useState([]);
    const [data, setData] = React.useState({ detalleIngresos: [], detalleEgresos: [] });
    const chartRefIngresos = React.useRef(null);
    const chartRefEgresos = React.useRef(null);
    const [loading, setLoading] = React.useState(false);

    // Formateo de moneda para tooltips de tortas
    const currency = (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(v) || 0);

    React.useEffect(() => {
        const baseUrl = API_CONFIG.REPORTE;
        if (!baseUrl || !(selectedYear && selectedMonth !== '')) return;

        const params = new URLSearchParams();
        params.set('anio', Number(selectedYear));
        params.set('mes', Number(selectedMonth) + 1);

        if (Array.isArray(selectedCategoria) && selectedCategoria.length > 0) {
            selectedCategoria.forEach((c) => params.append('categoria', c));
        }

        const headers = {};
        const sub = sessionStorage.getItem('sub');
        const token = sessionStorage.getItem('accessToken');
        if (sub) headers['X-Usuario-Sub'] = sub;
        if (token) headers['Authorization'] = `Bearer ${token}`;

        setLoading(true);
        fetch(`${baseUrl}/resumen?${params.toString()}`, { headers })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const json = await r.json();
                setData({ detalleIngresos: json?.detalleIngresos ?? [], detalleEgresos: json?.detalleEgresos ?? [] });
            })
            .catch((error) => {
                console.error('Error al obtener los datos del backend:', error);
                setData({ detalleIngresos: [], detalleEgresos: [] });
            })
            .finally(() => {
                setLoading(false);
            });
    }, [selectedYear, selectedMonth, selectedCategoria]);

    const getNombreMes = (mesIndex) => {
        if (mesIndex === '' || mesIndex === null) return '';
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return meses[mesIndex];
    };

    const handleExportExcel = () => {
        const { detalleIngresos, detalleEgresos } = data;
        const mesNombre = getNombreMes(selectedMonth);

        const excelData = [
            ["Resumen Mensual", `${mesNombre} ${selectedYear}`],
            [], // Fila vacía
        ];

        if (detalleIngresos.length > 0) {
            const totalIngresos = detalleIngresos.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
            excelData.push(["Ingresos", "", {v: totalIngresos, t: 'n'}]);
            detalleIngresos.forEach(item => {
                excelData.push(["", (item.categoria ?? 'Sin categoría'), {v: (Number(item.total) || 0), t: 'n'}]);
            });
        }

        if (detalleEgresos.length > 0) {
            excelData.push([]); // Fila vacía
            const totalEgresos = detalleEgresos.reduce((sum, item) => sum + Math.abs(Number(item.total) || 0), 0);
            excelData.push(["Egresos", "", {v: totalEgresos, t: 'n'}]);
            detalleEgresos.forEach(item => {
                excelData.push(["", (item.categoria ?? 'Sin categoría'), {v: Math.abs(Number(item.total) || 0), t: 'n'}]);
            });
        }

        const colsConfig = [{ wch: 25 }, { wch: 25 }, { wch: 15 }]; // Ancho para las columnas A, B, C
        const mergesConfig = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Título principal
            { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }, // Encabezado Ingresos
            { s: { r: 2 + detalleIngresos.length + 1, c: 0 }, e: { r: 2 + detalleIngresos.length + 1, c: 1 } }, // Encabezado Egresos
        ];
        const currencyColumns = ['C']; // Columna C para formato de moneda

        exportToExcel(excelData, `reporte-mensual-${mesNombre}-${selectedYear}`, "Resumen Mensual", colsConfig, mergesConfig, currencyColumns);
    };

    const handleExportPdf = async () => {
        const doc = new jsPDF();
        const mesNombre = getNombreMes(selectedMonth);
        doc.text(`Resumen Mensual - ${mesNombre} ${selectedYear}`, 14, 22);

        // Forzar fondo blanco y texto negro en las capturas para que la guía sea visible en el PDF
        const nodes = [chartRefIngresos.current, chartRefEgresos.current].filter(Boolean);
        const prev = nodes.map(n => ({
            node: n,
            bg: n.style.backgroundColor,
            color: n.style.color,
        }));
        nodes.forEach(n => {
            n.style.backgroundColor = '#ffffff';
            n.style.color = '#000000';
        });

        try {
            const canvasIngresos = await html2canvas(chartRefIngresos.current, { backgroundColor: '#ffffff', scale: 2 });
            const canvasEgresos = await html2canvas(chartRefEgresos.current, { backgroundColor: '#ffffff', scale: 2 });
            const imgDataIngresos = canvasIngresos.toDataURL('image/png');
            const imgDataEgresos = canvasEgresos.toDataURL('image/png');

            const pdfWidth = doc.internal.pageSize.getWidth();
            const chartWidth = (pdfWidth / 2) - 20;

            doc.addImage(imgDataIngresos, 'PNG', 14, 30, chartWidth, chartWidth * 0.75);
            doc.addImage(imgDataEgresos, 'PNG', pdfWidth / 2, 30, chartWidth, chartWidth * 0.75);

            const { detalleIngresos, detalleEgresos } = data;
            const head = [["Tipo", "Categoría", "Total"]];
            const body = [];

            if (detalleIngresos.length > 0) {
                const totalIngresos = detalleIngresos.reduce((sum, item) => sum + item.total, 0);
                body.push(["Ingresos", "", totalIngresos.toFixed(2)]);
                detalleIngresos.forEach(item => {
                    body.push(["", item.categoria, item.total.toFixed(2)]);
                });
            }
            if (detalleEgresos.length > 0) {
                const totalEgresos = detalleEgresos.reduce((sum, item) => sum + item.total, 0);
                body.push(["Egresos", "", totalEgresos.toFixed(2)]);
                detalleEgresos.forEach(item => {
                    body.push(["", item.categoria, item.total.toFixed(2)]);
                });
            }

            autoTable(doc, { head, body, startY: 30 + chartWidth * 0.75 + 10 });
            doc.save(`reporte-mensual-${mesNombre}-${selectedYear}.pdf`);

        } catch (error) {
            console.error("Error al generar el PDF:", error);
            alert("No se pudo generar el PDF. Intente nuevamente.");
        } finally {
            // Restaurar estilos originales
            prev.forEach(p => {
                if (!p.node) return;
                p.node.style.backgroundColor = p.bg;
                p.node.style.color = p.color;
            });
        }
    };
    
    const handleMonthChange = (e) => setSelectedMonth(e.target.value);
    const handleYearChange = (e) => setSelectedYear(e.target.value);
    const handleCategoriaChange = (e) => {
        const v = e.target.value;
        const arr = Array.isArray(v) ? v : (typeof v === 'string' ? (v ? v.split(',') : []) : []);
        setSelectedCategoria(arr);
    };

    const normalizeCategoria = (c) => {
        const s = (c ?? '').toString().trim();
        return s.length ? s : 'Sin categoría';
    };

    const dataIngresosPie = data.detalleIngresos.map(item => ({ name: normalizeCategoria(item.categoria), value: item.total }));
    const dataEgresosPie = data.detalleEgresos.map(item => ({ name: normalizeCategoria(item.categoria), value: Math.abs(item.total) }));

    // Cálculo para placeholder y guía
    const totalIngresosPie = dataIngresosPie.reduce((sum, d) => sum + (d.value || 0), 0);
    const totalEgresosPie = dataEgresosPie.reduce((sum, d) => sum + (d.value || 0), 0);
    const ingresosDisplayData = totalIngresosPie > 0 ? dataIngresosPie : [{ name: 'Sin datos', value: 1 }];
    const egresosDisplayData = totalEgresosPie > 0 ? dataEgresosPie : [{ name: 'Sin datos', value: 1 }];

    if (loading) {
        return (
            <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, p: 3 }}>
                <LoadingSpinner message={`Cargando resumen mensual ${getNombreMes(selectedMonth)} ${selectedYear}...`} />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography component="h2" variant="h4">
                    Resumen mensual
                </Typography>
                <ExportadorSimple onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} />
            </Box>

            <Filtros
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onMonthChange={handleMonthChange}
                onYearChange={handleYearChange}
                selectedCategoria={selectedCategoria}
                onCategoriaChange={handleCategoriaChange}
            />

            <Typography component="h3" variant="h5" sx={{ mb: 2, mt: 2 }}>
                {getNombreMes(selectedMonth) && selectedYear ? `${getNombreMes(selectedMonth)} ${selectedYear}` : 'Resumen mensual'}
            </Typography>

            <TablaDetalle
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                ingresos={data.detalleIngresos}
                egresos={data.detalleEgresos}
            />

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                    <div ref={chartRefIngresos}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>Desglose de Ingresos</Typography>
                            <Box sx={{ width: 280, height: 280, mx: 'auto', display: 'flex', alignItems: 'center' }} ref={chartRefIngresos}>
                                {/* Guía de categorías (izquierda) */}
                                <Box sx={{ width: 100, height: 240, overflow: 'auto', pr: 1 }}>
                                    {ingresosDisplayData.map((item, i) => (
                                        <Box key={`ing-cat-${i}`} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <Box sx={{ width: 10, height: 10, borderRadius: '2px', mr: 1, bgcolor: totalIngresosPie > 0 ? COLORS[i % COLORS.length] : 'rgba(160,160,160,0.35)' }} />
                                            <Typography variant="caption" sx={{ lineHeight: 1.2 }} title={item.name}>{item.name}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                                {/* Torta (derecha) */}
                                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                    <PieChart width={180} height={180} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                        <Pie
                                            data={ingresosDisplayData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            labelLine={false}
                                            label={false}
                                        >
                                            {ingresosDisplayData.map((entry, index) => (
                                                <Cell key={`cell-ing-${index}`} fill={totalIngresosPie > 0 ? COLORS[index % COLORS.length] : 'rgba(160,160,160,0.35)'} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v, n) => [currency(v), n]} />
                                    </PieChart>
                                </Box>
                            </Box>
                        </Paper>
                    </div>
                </Grid>
                <Grid item xs={12} md={6}>
                    <div ref={chartRefEgresos}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>Desglose de Egresos</Typography>
                            <Box sx={{ width: 280, height: 280, mx: 'auto', display: 'flex', alignItems: 'center' }} ref={chartRefEgresos}>
                                {/* Guía de categorías (izquierda) */}
                                <Box sx={{ width: 100, height: 240, overflow: 'auto', pr: 1 }}>
                                    {egresosDisplayData.map((item, i) => (
                                        <Box key={`egr-cat-${i}`} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <Box sx={{ width: 10, height: 10, borderRadius: '2px', mr: 1, bgcolor: totalEgresosPie > 0 ? COLORS[i % COLORS.length] : 'rgba(160,160,160,0.35)' }} />
                                            <Typography variant="caption" sx={{ lineHeight: 1.2 }} title={item.name}>{item.name}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                                {/* Torta (derecha) */}
                                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                    <PieChart width={180} height={180} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                                        <Pie
                                            data={egresosDisplayData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            labelLine={false}
                                            label={false}
                                        >
                                            {egresosDisplayData.map((entry, index) => (
                                                <Cell key={`cell-egr-${index}`} fill={totalEgresosPie > 0 ? COLORS[index % COLORS.length] : 'rgba(160,160,160,0.35)'} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v, n) => [currency(v), n]} />
                                    </PieChart>
                                </Box>
                            </Box>
                        </Paper>
                    </div>
                </Grid>
            </Grid>
        </Box>
    );
}
