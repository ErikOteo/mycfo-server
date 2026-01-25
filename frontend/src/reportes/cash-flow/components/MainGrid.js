import * as React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Filtros from './Filtros';
import TablaDetalle from './TablaDetalle';
import ExportadorSimple from '../../../shared-components/ExportadorSimple';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { exportToExcel } from '../../../utils/exportExcelUtils';
import { exportPdfReport } from '../../../utils/exportPdfUtils';
import API_CONFIG from '../../../config/api-config';
import LoadingSpinner from '../../../shared-components/LoadingSpinner';
import CurrencyTabs, { usePreferredCurrency } from '../../../shared-components/CurrencyTabs';

export default function MainGrid() {
    const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
    const [registros, setRegistros] = React.useState([]);
    const chartRef = React.useRef(null);
    const [loading, setLoading] = React.useState(false);
    const [exportingPdf, setExportingPdf] = React.useState(false);
    const [logoDataUrl, setLogoDataUrl] = React.useState(null);

    const [currency, setCurrency] = usePreferredCurrency("ARS");

    // Formateo de moneda para tooltips y ejes
    const formatCurrency = React.useCallback(
        (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'ARS' }).format(Number(v) || 0),
        [currency]
    );

    const handleYearChange = (e) => setSelectedYear(e.target.value);

    React.useEffect(() => {
        const baseUrl = API_CONFIG.REPORTE;
        if (!baseUrl || !selectedYear) return;

        const headers = {};
        const sub = sessionStorage.getItem('sub');
        const token = sessionStorage.getItem('accessToken');
        if (sub) headers['X-Usuario-Sub'] = sub;
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const params = new URLSearchParams();
        params.set('anio', selectedYear);
        if (currency) params.set('moneda', currency);

        setLoading(true);
        fetch(`${baseUrl}/cashflow?${params.toString()}`, { headers })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const json = await r.json();
                setRegistros(Array.isArray(json) ? json : []);
            })
            .catch((error) => {
                console.error('Error al obtener cashflow:', error);
                setRegistros([]);
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

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const ahora = new Date();
    const ultimoMes = (Number(selectedYear) === ahora.getFullYear()) ? ahora.getMonth() : 11;
    const mesesVisibles = meses.slice(0, ultimoMes + 1);

    const agruparYOrdenar = (dataArr) => {
        const map = {};
        dataArr.forEach((tx) => {
            const mes = new Date(tx.fechaEmision).getMonth();
            const val = tx.tipo === 'Egreso' ? Math.abs(Number(tx.montoTotal) || 0) : (Number(tx.montoTotal) || 0);
            if (!map[tx.categoria]) {
                map[tx.categoria] = Array(12).fill(0);
            }
            map[tx.categoria][mes] += val;
        });
        return Object.entries(map)
            .map(([categoria, valores]) => ({
                categoria,
                valores,
                total: valores.reduce((a, b) => a + b, 0),
            }))
            .sort((a, b) => b.total - a.total);
    };

    const ingresosFiltrados = registros.filter(r => r.tipo === 'Ingreso');
    const egresosFiltrados = registros.filter(r => r.tipo === 'Egreso');

    const ingresosPorCategoria = agruparYOrdenar(ingresosFiltrados);
    const egresosPorCategoria = agruparYOrdenar(egresosFiltrados);

    const totalIngresosMensual = Array(12).fill(0);
    const totalEgresosMensual = Array(12).fill(0);
    ingresosFiltrados.forEach((tx) => {
        const val = Number(tx.montoTotal) || 0;
        totalIngresosMensual[new Date(tx.fechaEmision).getMonth()] += val;
    });
    egresosFiltrados.forEach((tx) => {
        const val = Math.abs(Number(tx.montoTotal) || 0);
        totalEgresosMensual[new Date(tx.fechaEmision).getMonth()] += val;
    });

    const netosMensual = totalIngresosMensual.map((v, i) => v - totalEgresosMensual[i]);
    const saldoInicial = 0;
    const saldoFinalMensual = [];
    saldoFinalMensual[0] = saldoInicial + netosMensual[0];
    for (let i = 1; i < 12; i++) saldoFinalMensual[i] = saldoFinalMensual[i - 1] + netosMensual[i];

    const handleExportExcel = () => {
        const excelData = [];
        const numMesesVisibles = mesesVisibles.length;

        excelData.push([`Flujo de caja ${selectedYear}`]);
        excelData.push([]);

        const headerRow = ["Concepto", "Categoria", ...mesesVisibles];
        excelData.push(headerRow);

        const saldoInicialRow = ["Cash on hand (Inicio)", "", ...mesesVisibles.map((_, i) => (i === 0 ? saldoInicial : ""))];
        excelData.push(saldoInicialRow);

        excelData.push(["Ingresos", "", ...Array(numMesesVisibles).fill("")]);
        ingresosPorCategoria.forEach(({ categoria, valores }) => {
            const row = ["", categoria, ...mesesVisibles.map((_, i) => valores[i] || "")];
            excelData.push(row);
        });

        excelData.push(["Egresos", "", ...Array(numMesesVisibles).fill("")]);
        egresosPorCategoria.forEach(({ categoria, valores }) => {
            const row = ["", categoria, ...mesesVisibles.map((_, i) => valores[i] || "")];
            excelData.push(row);
        });

        excelData.push(["Total Ingresos", "", ...mesesVisibles.map((_, i) => totalIngresosMensual[i] || "")]);
        excelData.push(["Total Egresos", "", ...mesesVisibles.map((_, i) => totalEgresosMensual[i] || "")]);
        excelData.push(["Net Cash Flow", "", ...mesesVisibles.map((_, i) => netosMensual[i] || "")]);
        excelData.push(["Cash on hand (Fin)", "", ...mesesVisibles.map((_, i) => saldoFinalMensual[i] || "")]);

        const ingresosHeaderRow = 4;
        const egresosHeaderRow = 5 + ingresosPorCategoria.length;
        const totalIngresosRow = 5 + ingresosPorCategoria.length + egresosPorCategoria.length;
        const totalEgresosRow = totalIngresosRow + 1;
        const netoRow = totalIngresosRow + 2;
        const cashOnHandRow = totalIngresosRow + 3;

        const colsConfig = [
            { wch: 20 },
            { wch: 20 },
            ...Array(numMesesVisibles).fill({ wch: 12, z: '$ #,##0.00' })
        ];

        const mergesConfig = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: numMesesVisibles + 1 } },
            { s: { r: ingresosHeaderRow, c: 0 }, e: { r: ingresosHeaderRow, c: numMesesVisibles + 1 } },
            { s: { r: egresosHeaderRow, c: 0 }, e: { r: egresosHeaderRow, c: numMesesVisibles + 1 } },
        ];

        const currencyColumns = mesesVisibles.map((_, i) => String.fromCharCode(67 + i));

        exportToExcel(
            excelData,
            `flujo-caja-${selectedYear}-${(currency || 'ARS').toLowerCase()}`,
            "Flujo de caja",
            colsConfig,
            mergesConfig,
            currencyColumns,
            {
                headerRows: [0, 2, ingresosHeaderRow, egresosHeaderRow],
                totalRows: [totalIngresosRow, totalEgresosRow, netoRow, cashOnHandRow],
                zebra: true,
                freezePane: { rowSplit: 3, colSplit: 2 },
            }
        );
    };

    const handleExportPdf = async () => {
        const chartElement = chartRef.current;
        if (!chartElement) {
            alert("No se encontró el grafico para exportar.");
            return;
        }

        setExportingPdf(true);
        try {
            const head = [["Mes", "Ingresos", "Egresos", "Neto"]];
            const body = meses.map((mes, i) => [
                mes,
                formatCurrency(totalIngresosMensual[i] || 0),
                formatCurrency(totalEgresosMensual[i] || 0),
                formatCurrency(netosMensual[i] || 0),
            ]);

            const totalIngresos = totalIngresosMensual.reduce((a, b) => a + (b || 0), 0);
            const totalEgresos = totalEgresosMensual.reduce((a, b) => a + (b || 0), 0);
            const neto = totalIngresos - totalEgresos;
            const cashFinal = saldoFinalMensual[ultimoMes] ?? neto;

            await exportPdfReport({
                title: `Flujo de caja anual`,
                subtitle: `Periodo ${selectedYear}`,
                charts: [{ element: chartElement }],
                table: { head, body },
                fileName: `flujo-caja-${selectedYear}-${(currency || 'ARS').toLowerCase()}`,
                cover: {
                    show: true,
                    subtitle: `Periodo ${selectedYear}`,
                    logo: logoDataUrl,
                    meta: [{ label: "Generado", value: new Date().toLocaleDateString('es-AR') }],
                    kpis: [
                        { label: "Ingresos", value: formatCurrency(totalIngresos) },
                        { label: "Egresos", value: formatCurrency(totalEgresos) },
                        { label: "Cash final", value: formatCurrency(cashFinal) },
                    ],
                },
            });
        } catch (e) {
            console.error("Error al exportar PDF de cash flow:", e);
            alert("No se pudo generar el PDF. Intente nuevamente.");
        } finally {
            setExportingPdf(false);
        }
    };

    const dataGrafico = meses.map((mes, i) => ({ mes, Ingresos: totalIngresosMensual[i], Egresos: totalEgresosMensual[i] }));

    const ingresosTabla = registros.filter(r => r.tipo === 'Ingreso').map(r => ({ id: r.id, categoria: r.categoria, monto: r.montoTotal, fecha: r.fechaEmision }));
    const egresosTabla = registros.filter(r => r.tipo === 'Egreso').map(r => ({ id: r.id, categoria: r.categoria, monto: r.montoTotal, fecha: r.fechaEmision }));

    if (loading) {
        return (
            <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, p: 3 }}>
                <LoadingSpinner message={`Cargando flujo de caja ${selectedYear}...`} />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, px: { xs: 2, md: 3 }, pt: { xs: 1.5, md: 2 }, pb: 3 }}>
            <CurrencyTabs value={currency} onChange={setCurrency} sx={{ justifyContent: 'center', mb: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography component="h2" variant="h4">
                    Flujo de caja anual
                </Typography>
                <ExportadorSimple
                    onExportExcel={handleExportExcel}
                    onExportPdf={handleExportPdf}
                    exportingPdf={exportingPdf}
                />
            </Box>

            <Filtros selectedYear={selectedYear} onYearChange={handleYearChange} />

            <TablaDetalle
                year={selectedYear}
                ingresos={ingresosTabla}
                egresos={egresosTabla}
                saldoInicial={saldoInicial}
            />

            <div ref={chartRef}>
                <Paper variant="outlined" sx={{ mt: 4, p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>Comparativo mensual de Flujo de Caja</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dataGrafico} margin={{ top: 8, right: 16, bottom: 8, left: 56 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                            <XAxis dataKey="mes" />
                            <YAxis tickFormatter={(v) => formatCurrency(v)} width={80} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Legend />
                            <Bar dataKey="Ingresos" fill="#2e7d32" />
                            <Bar dataKey="Egresos" fill="#c62828" />
                        </BarChart>
                    </ResponsiveContainer>
                </Paper>
            </div>

        </Box>
    );
}
