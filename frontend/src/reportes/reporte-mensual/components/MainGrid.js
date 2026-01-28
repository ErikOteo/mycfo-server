import * as React from 'react';
import {
    Box, Typography, Grid, Paper
} from '@mui/material';
import TablaDetalle from './TablaDetalle';
import Filtros from './Filtros';
import ExportadorSimple from '../../../shared-components/ExportadorSimple';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToExcel } from '../../../utils/exportExcelUtils';
import { exportPdfReport } from '../../../utils/exportPdfUtils';
import API_CONFIG from '../../../config/api-config';
import LoadingSpinner from '../../../shared-components/LoadingSpinner';
import CurrencyTabs, { usePreferredCurrency } from '../../../shared-components/CurrencyTabs';
import { useChatbotScreenContext } from '../../../shared-components/useChatbotScreenContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919', '#19C9FF'];

export default function MainGrid() {
    const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
    const [selectedCategoria, setSelectedCategoria] = React.useState([]);
    const [data, setData] = React.useState({ detalleIngresos: [], detalleEgresos: [] });
    const chartRefIngresos = React.useRef(null);
    const chartRefEgresos = React.useRef(null);
    const [loading, setLoading] = React.useState(false);
    const [exportingPdf, setExportingPdf] = React.useState(false);
    const [logoDataUrl, setLogoDataUrl] = React.useState(null);

    const [currency, setCurrency] = usePreferredCurrency("ARS");

    const topIngresos = React.useMemo(() => {
        const items = Array.isArray(data.detalleIngresos) ? data.detalleIngresos : [];
        return [...items]
            .sort((a, b) => Number(b?.total ?? 0) - Number(a?.total ?? 0))
            .slice(0, 5);
    }, [data.detalleIngresos]);

    const topEgresos = React.useMemo(() => {
        const items = Array.isArray(data.detalleEgresos) ? data.detalleEgresos : [];
        return [...items]
            .sort((a, b) => Math.abs(Number(b?.total ?? 0)) - Math.abs(Number(a?.total ?? 0)))
            .slice(0, 5);
    }, [data.detalleEgresos]);

    const totalIngresos = React.useMemo(
        () => (Array.isArray(data.detalleIngresos)
            ? data.detalleIngresos.reduce((sum, item) => sum + (Number(item?.total) || 0), 0)
            : 0),
        [data.detalleIngresos]
    );

    const totalEgresos = React.useMemo(
        () => (Array.isArray(data.detalleEgresos)
            ? data.detalleEgresos.reduce((sum, item) => sum + Math.abs(Number(item?.total) || 0), 0)
            : 0),
        [data.detalleEgresos]
    );

    const chatbotContext = React.useMemo(
        () => ({
            screen: "reporte-mensual",
            year: selectedYear,
            month: selectedMonth + 1,
            currency,
            categoriasSeleccionadas: selectedCategoria,
            ingresos: {
                total: totalIngresos,
                topCategorias: topIngresos,
            },
            egresos: {
                total: totalEgresos,
                topCategorias: topEgresos,
            },
        }),
        [
            selectedYear,
            selectedMonth,
            currency,
            selectedCategoria,
            totalIngresos,
            totalEgresos,
            topIngresos,
            topEgresos,
        ]
    );

    useChatbotScreenContext(chatbotContext);

    // Formateo de moneda dependiente de la preferencia seleccionada
    const formatCurrency = React.useCallback(
        (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'ARS' }).format(Number(v) || 0),
        [currency]
    );

    React.useEffect(() => {
        const baseUrl = API_CONFIG.REPORTE;
        if (!baseUrl || !(selectedYear && selectedMonth !== '')) return;

        const params = new URLSearchParams();
        params.set('anio', Number(selectedYear));
        params.set('mes', Number(selectedMonth) + 1);
        if (currency) params.set('moneda', currency);

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
    }, [currency, selectedYear, selectedMonth, selectedCategoria]);

    // Cargar logo para la carátula del PDF
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

    const getNombreMes = (mesIndex) => {
        if (mesIndex === '' || mesIndex === null || mesIndex === undefined) return '';
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return meses[mesIndex];
    };

    const handleExportExcel = () => {
        const { detalleIngresos, detalleEgresos } = data;
        const mesNombre = getNombreMes(selectedMonth);

        const excelData = [
            ["Resumen Mensual", `${mesNombre} ${selectedYear}`],
            [],
        ];

        let ingresosHeaderRow = null;
        let egresosHeaderRow = null;

        if (detalleIngresos.length > 0) {
            ingresosHeaderRow = excelData.length;
            const totalIngresos = detalleIngresos.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
            excelData.push(["Ingresos", "", { v: totalIngresos, t: 'n' }]);
            detalleIngresos.forEach(item => {
                excelData.push(["", (item.categoria ?? 'Sin categoria'), { v: (Number(item.total) || 0), t: 'n' }]);
            });
        }

        if (detalleEgresos.length > 0) {
            excelData.push([]);
            egresosHeaderRow = excelData.length;
            const totalEgresos = detalleEgresos.reduce((sum, item) => sum + Math.abs(Number(item.total) || 0), 0);
            excelData.push(["Egresos", "", { v: totalEgresos, t: 'n' }]);
            detalleEgresos.forEach(item => {
                excelData.push(["", (item.categoria ?? 'Sin categoria'), { v: Math.abs(Number(item.total) || 0), t: 'n' }]);
            });
        }

        const colsConfig = [{ wch: 25 }, { wch: 25 }, { wch: 15 }];
        const mergesConfig = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
        ];
        if (ingresosHeaderRow !== null) {
            mergesConfig.push({ s: { r: ingresosHeaderRow, c: 0 }, e: { r: ingresosHeaderRow, c: 1 } });
        }
        if (egresosHeaderRow !== null) {
            mergesConfig.push({ s: { r: egresosHeaderRow, c: 0 }, e: { r: egresosHeaderRow, c: 1 } });
        }
        const currencyColumns = ['C'];

        const totalRows = [];
        if (ingresosHeaderRow !== null) totalRows.push(ingresosHeaderRow);
        if (egresosHeaderRow !== null) totalRows.push(egresosHeaderRow);

        exportToExcel(
            excelData,
            `reporte-mensual-${mesNombre}-${selectedYear}-${(currency || 'ARS').toLowerCase()}`,
            "Resumen Mensual",
            colsConfig,
            mergesConfig,
            currencyColumns,
            {
                headerRows: [0].concat(ingresosHeaderRow !== null ? [ingresosHeaderRow] : []).concat(egresosHeaderRow !== null ? [egresosHeaderRow] : []),
                totalRows,
                zebra: true,
                freezePane: { rowSplit: 2, colSplit: 1 },
            }
        );
    };

    const handleExportPdf = async () => {
        const charts = [chartRefIngresos.current, chartRefEgresos.current].filter(Boolean);
        if (!charts.length) {
            alert("No se encontraron graficos para exportar.");
            return;
        }

        setExportingPdf(true);
        try {
            const { detalleIngresos, detalleEgresos } = data;
            const head = [["Tipo", "Categoria", "Total"]];
            const body = [];

            const totalIngresos = detalleIngresos.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
            const totalEgresos = detalleEgresos.reduce((sum, item) => sum + Math.abs(Number(item.total) || 0), 0);

            if (detalleIngresos.length > 0) {
                body.push(["Ingresos", "", formatCurrency(totalIngresos)]);
                detalleIngresos.forEach(item => {
                    body.push(["", item.categoria ?? 'Sin categoria', formatCurrency(Number(item.total) || 0)]);
                });
            }
            if (detalleEgresos.length > 0) {
                body.push(["Egresos", "", formatCurrency(totalEgresos)]);
                detalleEgresos.forEach(item => {
                    body.push(["", item.categoria ?? 'Sin categoria', formatCurrency(Math.abs(Number(item.total) || 0))]);
                });
            }

            await exportPdfReport({
                title: `Resumen Mensual`,
                subtitle: `${getNombreMes(selectedMonth)} ${selectedYear}`,
                charts: charts.map((element, idx) => ({
                    element,
                    forcePageBreakBefore: false, // mantener el primer grafico en la pagina del titulo
                    forcePageBreakAfter: true, // cada grafica en su propia pagina
                })),
                table: { head, body },
                fileName: `reporte-mensual-${getNombreMes(selectedMonth)}-${selectedYear}-${(currency || 'ARS').toLowerCase()}`,
                cover: {
                    show: true,
                    subtitle: `${getNombreMes(selectedMonth)} ${selectedYear}`,
                    logo: logoDataUrl,
                    meta: [{ label: "Generado", value: new Date().toLocaleDateString('es-AR') }],
                    kpis: [
                        { label: "Ingresos", value: formatCurrency(totalIngresos) },
                        { label: "Egresos", value: formatCurrency(totalEgresos) },
                        { label: "Neto", value: formatCurrency(totalIngresos - totalEgresos) },
                    ],
                },
            });
        } catch (e) {
            console.error("Error al generar el PDF:", e);
            alert("No se pudo generar el PDF. Intente nuevamente.");
        } finally {
            setExportingPdf(false);
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
        return s.length ? s : 'Sin categoria';
    };

    const dataIngresosPie = data.detalleIngresos.map(item => ({ name: normalizeCategoria(item.categoria), value: item.total }));
    const dataEgresosPie = data.detalleEgresos.map(item => ({ name: normalizeCategoria(item.categoria), value: Math.abs(item.total) }));

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
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, px: { xs: 2, md: 3 }, pt: { xs: 1.5, md: 2 }, pb: 3 }}>
            <CurrencyTabs value={currency} onChange={setCurrency} sx={{ justifyContent: 'center', mb: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography component="h2" variant="h4">
                    Resumen mensual
                </Typography>
                <ExportadorSimple
                    onExportExcel={handleExportExcel}
                    onExportPdf={handleExportPdf}
                    exportingPdf={exportingPdf}
                />
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
                            <Box sx={{ width: 280, height: 280, mx: 'auto', display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ width: 100, height: 240, overflow: 'auto', pr: 1 }}>
                                    {ingresosDisplayData.map((item, i) => (
                                        <Box key={`ing-cat-${i}`} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <Box sx={{ width: 10, height: 10, borderRadius: '2px', mr: 1, bgcolor: totalIngresosPie > 0 ? COLORS[i % COLORS.length] : 'rgba(160,160,160,0.35)' }} />
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.name}</Typography>
                                        </Box>
                                    ))}
                                </Box>

                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={ingresosDisplayData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {ingresosDisplayData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={totalIngresosPie > 0 ? COLORS[index % COLORS.length] : 'rgba(160,160,160,0.35)'} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v, n) => [formatCurrency(v), n]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </div>
                </Grid>

                <Grid item xs={12} md={6}>
                    <div ref={chartRefEgresos}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>Desglose de Egresos</Typography>
                            <Box sx={{ width: 280, height: 280, mx: 'auto', display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ width: 100, height: 240, overflow: 'auto', pr: 1 }}>
                                    {egresosDisplayData.map((item, i) => (
                                        <Box key={`egr-cat-${i}`} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <Box sx={{ width: 10, height: 10, borderRadius: '2px', mr: 1, bgcolor: totalEgresosPie > 0 ? COLORS[i % COLORS.length] : 'rgba(160,160,160,0.35)' }} />
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.name}</Typography>
                                        </Box>
                                    ))}
                                </Box>

                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={egresosDisplayData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {egresosDisplayData.map((_, index) => (
                                                <Cell key={`cell-egr-${index}`} fill={totalEgresosPie > 0 ? COLORS[index % COLORS.length] : 'rgba(160,160,160,0.35)'} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v, n) => [formatCurrency(v), n]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </div>
                </Grid>
            </Grid>
        </Box>
    );
}
