import * as React from 'react';
import {
    Box, Typography, Paper, Container, CssBaseline, CircularProgress
} from '@mui/material';
import Filtros from './Filtros';
import TablaDetalle from './TablaDetalle';
import ExportadorSimple from '../../../shared-components/ExportadorSimple';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { exportToExcel } from '../../../utils/exportExcelUtils'; // Importando la utilidad de Excel
import API_CONFIG from '../../../config/api-config';
import LoadingSpinner from '../../../shared-components/LoadingSpinner';
import CurrencyTabs, { usePreferredCurrency } from '../../../shared-components/CurrencyTabs';

export default function MainGrid() {
    const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
    const [data, setData] = React.useState({
        ingresosMensuales: Array(12).fill(0),
        egresosMensuales: Array(12).fill(0),
        detalleIngresos: [],
        detalleEgresos: [],
    });
    const [loading, setLoading] = React.useState(false);
    const chartRef = React.useRef(null);
    const [currency, setCurrency] = usePreferredCurrency("ARS");

    // Formateador de moneda para tooltips del gráfico
    const formatCurrency = React.useCallback(
        (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'ARS' }).format(Number(v) || 0),
        [currency]
    );

    const handleYearChange = (e) => setSelectedYear(Number(e.target.value));

    React.useEffect(() => {
        const baseUrl = API_CONFIG.REPORTE;
        if (!baseUrl || !selectedYear) return;

        const params = new URLSearchParams();
        params.set('anio', Number(selectedYear));
        if (currency) params.set('moneda', currency);

        const headers = {};
        const sub = sessionStorage.getItem('sub');
        const token = sessionStorage.getItem('accessToken');
        if (sub) headers['X-Usuario-Sub'] = sub;
        if (token) headers['Authorization'] = `Bearer ${token}`;

        setLoading(true);
        fetch(`${baseUrl}/pyl?${params.toString()}`, { headers })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const json = await r.json();
                setData({
                    ingresosMensuales: json.ingresosMensuales ?? Array(12).fill(0),
                    egresosMensuales: json.egresosMensuales ?? Array(12).fill(0),
                    detalleIngresos: json.detalleIngresos ?? [],
                    detalleEgresos: json.detalleEgresos ?? [],
                });
            })
            .catch((error) => {
                console.error('Error al obtener los datos del backend P&L:', error);
                setData({ ingresosMensuales: Array(12).fill(0), egresosMensuales: Array(12).fill(0), detalleIngresos: [], detalleEgresos: [] });
            })
            .finally(() => {
                setLoading(false);
            });
    }, [currency, selectedYear]);

    const normalizeCategoria = (c) => {
        const s = (c ?? '').toString().trim();
        return s.length ? s : 'Sin categoría';
    };

    const handleExportExcel = () => {
        const { detalleIngresos, detalleEgresos } = data;
        const totalIngresos = detalleIngresos.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        const totalEgresos = detalleEgresos.reduce((sum, item) => sum + Math.abs(Number(item.total) || 0), 0);
        const resultado = totalIngresos - totalEgresos;

        const excelData = [
            ["Estado de Resultados", `(${selectedYear})`],
            [], // Fila vacía
            ["Ingresos", "", {v: totalIngresos, t: 'n'}],
            ...detalleIngresos.map(item => ["", normalizeCategoria(item.categoria), {v: Number(item.total) || 0, t: 'n'}]),
            [], // Fila vacía
            ["Egresos", "", {v: totalEgresos, t: 'n'}],
            ...detalleEgresos.map(item => ["", normalizeCategoria(item.categoria), {v: Math.abs(Number(item.total) || 0), t: 'n'}]),
            [], // Fila vacía
            ["Resultado del Ejercicio", "", {v: resultado, t: 'n'}]
        ];

        const colsConfig = [{ wch: 25 }, { wch: 25 }, { wch: 15 }]; // Ancho para las columnas A, B, C
        const mergesConfig = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Título principal
            { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }, // Encabezado Ingresos
            { s: { r: 2 + detalleIngresos.length + 1, c: 0 }, e: { r: 2 + detalleIngresos.length + 1, c: 1 } }, // Encabezado Egresos
            { s: { r: 2 + detalleIngresos.length + 1 + detalleEgresos.length + 2, c: 0 }, e: { r: 2 + detalleIngresos.length + 1 + detalleEgresos.length + 2, c: 1 } }, // Encabezado Resultado
        ];
        const currencyColumns = ['C']; // Columna C para formato de moneda

        exportToExcel(excelData, `estado-de-resultados-${selectedYear}-${(currency || 'ARS').toLowerCase()}`, "Estado de Resultados", colsConfig, mergesConfig, currencyColumns);
    };

    const handleExportPdf = () => {
        const chartElement = chartRef.current;
        if (!chartElement) {
            alert("No se pudo encontrar el gráfico para exportar.");
            return;
        }

        html2canvas(chartElement).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const doc = new jsPDF();

            doc.text(`Estado de Resultados (${selectedYear})`, 14, 22);

            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            doc.addImage(imgData, 'PNG', 14, 30, pdfWidth - 28, pdfHeight);

            const { detalleIngresos, detalleEgresos } = data;
            const totalIngresos = detalleIngresos.reduce((sum, item) => sum + item.total, 0);
            const totalEgresos = detalleEgresos.reduce((sum, item) => sum + item.total, 0);
            const resultado = totalIngresos - totalEgresos;

            const head = [["Tipo", "Categoría", "Total"]];
            const body = [];

            body.push(["Ingresos", "", totalIngresos.toFixed(2)]);
            detalleIngresos.forEach(item => {
                const val = Number(item.total) || 0;
                body.push(["", normalizeCategoria(item.categoria), val.toFixed(2)]);
            });

            body.push(["Egresos", "", totalEgresos.toFixed(2)]);
            detalleEgresos.forEach(item => {
                const val = Math.abs(Number(item.total) || 0);
                body.push(["", normalizeCategoria(item.categoria), val.toFixed(2)]);
            });

            body.push(["Resultado del Ejercicio", "", resultado.toFixed(2)]);

            autoTable(doc, { head: head, body: body, startY: pdfHeight + 40 });
            doc.save(`estado-de-resultados-${selectedYear}-${(currency || 'ARS').toLowerCase()}.pdf`);
        });
    };

    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const dataGrafico = meses.map((mes, i) => ({ mes, Ingresos: data.ingresosMensuales[i], Egresos: data.egresosMensuales[i] }));

    if (loading) {
        return (
            <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, mx: 'auto', p: 3 }}>
                <LoadingSpinner message={`Cargando estado de resultados ${selectedYear}...`} />
            </Box>
        );
    }

    return (
        <React.Fragment>
            <CssBaseline />
            <Box
                sx={{
                    width: '100%',
                    maxWidth: { sm: '100%', md: '1700px' },
                    px: { xs: 2, md: 3 },
                    pt: { xs: 1.5, md: 2 },
                    pb: 3,
                    mx: 'auto',
                }}
            >
            <CurrencyTabs value={currency} onChange={setCurrency} sx={{ justifyContent: 'center', mb: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography component="h2" variant="h4">
                        Estado de Resultados
                    </Typography>
                    <ExportadorSimple onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} />
                </Box>

            <Filtros selectedYear={selectedYear} onYearChange={handleYearChange} />
                <TablaDetalle year={selectedYear} ingresos={data.detalleIngresos} egresos={data.detalleEgresos} />

                <div ref={chartRef}>
                    <Paper variant="outlined" sx={{ mt: 4, p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>Comparativo mensual de Ingresos vs Egresos</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dataGrafico}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                                <XAxis dataKey="mes" />
                                <YAxis />
                                <Tooltip formatter={(v) => formatCurrency(v)} />
                                <Legend />
                                <Bar dataKey="Ingresos" fill="#2e7d32" />
                                <Bar dataKey="Egresos" fill="#c62828" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </div>

            </Box>
        </React.Fragment>
    );
}
