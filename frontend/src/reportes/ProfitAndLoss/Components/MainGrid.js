import * as React from 'react';
import {
    Box, Typography, Paper, CssBaseline
} from '@mui/material';
import Filtros from './Filtros';
import TablaDetalle from './TablaDetalle';
import ExportadorSimple from '../../../shared-components/ExportadorSimple';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToExcel } from '../../../utils/exportExcelUtils';
import { exportPdfReport } from '../../../utils/exportPdfUtils';
import API_CONFIG from '../../../config/api-config';
import LoadingSpinner from '../../../shared-components/LoadingSpinner';
import CurrencyTabs, { usePreferredCurrency } from '../../../shared-components/CurrencyTabs';
import { useChatbotScreenContext } from '../../../shared-components/useChatbotScreenContext';

export default function MainGrid() {
    const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
    const [data, setData] = React.useState({
        ingresosMensuales: Array(12).fill(0),
        egresosMensuales: Array(12).fill(0),
        detalleIngresos: [],
        detalleEgresos: [],
    });
    const [loading, setLoading] = React.useState(false);
    const [exportingPdf, setExportingPdf] = React.useState(false);
    const [logoDataUrl, setLogoDataUrl] = React.useState(null);
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

    // Cargar logo para la carátula
    React.useEffect(() => {
        const loadLogo = async () => {
            try {
                const res = await fetch('/logo512.png');
                const blob = await res.blob();
                const reader = new FileReader();
                reader.onloadend = () => setLogoDataUrl(reader.result);
                reader.readAsDataURL(blob);
            } catch {
                setLogoDataUrl(null);
            }
        };
        loadLogo();
    }, []);

    const normalizeCategoria = (c) => {
        const s = (c ?? '').toString().trim();
        return s.length ? s : 'Sin categoria';
    };

    const totalIngresos = React.useMemo(
        () => data.detalleIngresos.reduce((sum, item) => sum + (Number(item?.total) || 0), 0),
        [data.detalleIngresos]
    );

    const totalEgresos = React.useMemo(
        () => data.detalleEgresos.reduce((sum, item) => sum + Math.abs(Number(item?.total) || 0), 0),
        [data.detalleEgresos]
    );

    const topIngresos = React.useMemo(
        () =>
            [...data.detalleIngresos]
                .sort((a, b) => Number(b?.total ?? 0) - Number(a?.total ?? 0))
                .slice(0, 5),
        [data.detalleIngresos]
    );

    const topEgresos = React.useMemo(
        () =>
            [...data.detalleEgresos]
                .sort((a, b) => Math.abs(Number(b?.total ?? 0)) - Math.abs(Number(a?.total ?? 0)))
                .slice(0, 5),
        [data.detalleEgresos]
    );

    const chatbotContext = React.useMemo(
        () => ({
            screen: "estado-de-resultados",
            year: selectedYear,
            currency,
            ingresosMensuales: data.ingresosMensuales,
            egresosMensuales: data.egresosMensuales,
            totalIngresos,
            totalEgresos,
            resultadoEjercicio: totalIngresos - totalEgresos,
            topIngresos,
            topEgresos,
        }),
        [
            selectedYear,
            currency,
            data.ingresosMensuales,
            data.egresosMensuales,
            totalIngresos,
            totalEgresos,
            topIngresos,
            topEgresos,
        ]
    );

    useChatbotScreenContext(chatbotContext);

    const handleExportExcel = () => {
        const { detalleIngresos, detalleEgresos } = data;
        const totalIngresos = detalleIngresos.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        const totalEgresos = detalleEgresos.reduce((sum, item) => sum + Math.abs(Number(item.total) || 0), 0);
        const resultado = totalIngresos - totalEgresos;

        const excelData = [
            ["Estado de Resultados", `(${selectedYear})`],
            [],
            ["Ingresos", "", { v: totalIngresos, t: 'n' }],
            ...detalleIngresos.map(item => ["", normalizeCategoria(item.categoria), { v: Number(item.total) || 0, t: 'n' }]),
            [],
            ["Egresos", "", { v: totalEgresos, t: 'n' }],
            ...detalleEgresos.map(item => ["", normalizeCategoria(item.categoria), { v: Math.abs(Number(item.total) || 0), t: 'n' }]),
            [],
            ["Resultado del Ejercicio", "", { v: resultado, t: 'n' }]
        ];

        const ingresosHeaderRow = 2;
        const egresosHeaderRow = 4 + detalleIngresos.length;
        const resultadoRow = 6 + detalleIngresos.length + detalleEgresos.length;

        const colsConfig = [{ wch: 25 }, { wch: 25 }, { wch: 15 }];
        const mergesConfig = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
            { s: { r: ingresosHeaderRow, c: 0 }, e: { r: ingresosHeaderRow, c: 1 } },
            { s: { r: egresosHeaderRow, c: 0 }, e: { r: egresosHeaderRow, c: 1 } },
            { s: { r: resultadoRow, c: 0 }, e: { r: resultadoRow, c: 1 } },
        ];
        const currencyColumns = ['C'];

        exportToExcel(
            excelData,
            `estado-de-resultados-${selectedYear}-${(currency || 'ARS').toLowerCase()}`,
            "Estado de Resultados",
            colsConfig,
            mergesConfig,
            currencyColumns,
            {
                headerRows: [0, ingresosHeaderRow, egresosHeaderRow],
                totalRows: [resultadoRow],
                zebra: true,
                freezePane: { rowSplit: 2, colSplit: 1 },
            }
        );
    };

    const handleExportPdf = async () => {
        const chartElement = chartRef.current;
        if (!chartElement) {
            alert("No se pudo encontrar el grafico para exportar.");
            return;
        }

        setExportingPdf(true);
        try {
            const { detalleIngresos, detalleEgresos } = data;
            const totalIngresos = detalleIngresos.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
            const totalEgresos = detalleEgresos.reduce((sum, item) => sum + Math.abs(Number(item.total) || 0), 0);
            const resultado = totalIngresos - totalEgresos;

            const head = [["Tipo", "Categoria", "Total"]];
            const body = [];

            body.push(["Ingresos", "", formatCurrency(totalIngresos)]);
            detalleIngresos.forEach(item => {
                const val = Number(item.total) || 0;
                body.push(["", normalizeCategoria(item.categoria), formatCurrency(val)]);
            });

            body.push(["Egresos", "", formatCurrency(totalEgresos)]);
            detalleEgresos.forEach(item => {
                const val = Math.abs(Number(item.total) || 0);
                body.push(["", normalizeCategoria(item.categoria), formatCurrency(val)]);
            });

            body.push(["Resultado del Ejercicio", "", formatCurrency(resultado)]);

            await exportPdfReport({
                title: `Estado de Resultados`,
                subtitle: `Periodo ${selectedYear}`,
                charts: [{ element: chartElement }],
                table: { head, body },
                fileName: `estado-de-resultados-${selectedYear}-${(currency || 'ARS').toLowerCase()}`,
                cover: {
                    show: true,
                    subtitle: `Periodo ${selectedYear}`,
                    logo: logoDataUrl,
                    meta: [
                        { label: "Generado", value: new Date().toLocaleDateString('es-AR') },
                    ],
                    kpis: [
                        { label: "Ingresos", value: formatCurrency(totalIngresos) },
                        { label: "Egresos", value: formatCurrency(totalEgresos) },
                        { label: "Resultado", value: formatCurrency(resultado) },
                    ],
                },
            });
        } catch (e) {
            console.error("Error al exportar PDF de P&L:", e);
            alert("No se pudo generar el PDF. Intente nuevamente.");
        } finally {
            setExportingPdf(false);
        }
    };

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
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
                    <ExportadorSimple
                        onExportExcel={handleExportExcel}
                        onExportPdf={handleExportPdf}
                        exportingPdf={exportingPdf}
                    />
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
