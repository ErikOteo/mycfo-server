import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import PublishedWithChangesRoundedIcon from "@mui/icons-material/PublishedWithChangesRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";

import QuickActions from "./components/QuickActions";
import KpiCard from "./components/KpiCard";
import BudgetWidget from "./components/BudgetWidget";
import CashflowWidget from "./components/CashflowWidget";
import LiquidityGapWidget from "./components/LiquidityGapWidget";
import RecentMovementsWidget from "./components/RecentMovementsWidget";
import RecentInvoicesWidget from "./components/RecentInvoicesWidget";
import ReconciliationWidget from "./components/ReconciliationWidget";
import SalesTrendWidget from "./components/SalesTrendWidget";
import SalesByCategoryWidget from "./components/SalesByCategoryWidget";
import InsightsWidget from "./components/InsightsWidget";
import DashboardEmptyState from "./components/DashboardEmptyState";
import WelcomeChoice from "./components/WelcomeChoice";
// import BillingWidget from "./components/BillingWidget";
import { fetchDashboardSummary } from "./services/dashboardSummaryService";
import useResolvedColorTokens from "./useResolvedColorTokens";
import { formatCurrencyByCode } from "../utils/formatters";
import CurrencyTabs, {
  usePreferredCurrency,
} from "../shared-components/CurrencyTabs";
import { useChatbotScreenContext } from "../shared-components/useChatbotScreenContext";
import usePermisos from "../hooks/usePermisos";
import http from "../api/http";
import API_CONFIG from "../config/api-config";

const mockKpis = {
  totalIncomes: 820000,
  totalExpenses: 540000,
  netResult: 280000,
  cashBalance: 1250000,
  cashRunwayDays: 46,
  pendingReceivables: 420000,
  receivablesDueSoon: 160000,
  pendingPayables: 210000,
  payablesOverdue: 65000,
};

const mockKpiTrends = {
  totalIncomes: [620000, 680000, 750000, 820000],
  totalExpenses: [430000, 480000, 510000, 540000],
  netResult: [190000, 205000, 240000, 280000],
  cashBalance: [980000, 1080000, 1190000, 1250000],
  pendingReceivables: [360000, 395000, 410000, 420000],
  pendingPayables: [260000, 235000, 215000, 210000],
};

const mockSalesTrend = {
  title: "Ingresos durante el período",
  average: 185000,
  max: { value: 215000, label: "abr 2025" },
  min: { value: 142000, label: "ene 2025" },
  points: [
    { month: "ene", value: 142000 },
    { month: "feb", value: 168000 },
    { month: "mar", value: 178500 },
    { month: "abr", value: 215000 },
    { month: "may", value: 204000 },
    { month: "jun", value: 198000 },
    { month: "jul", value: 191000 },
    { month: "ago", value: 199500 },
    { month: "sep", value: 188000 },
    { month: "oct", value: 194500 },
    { month: "nov", value: 187000 },
    { month: "dic", value: 181500 },
  ],
};

const mockExpensesTrend = {
  title: "Egresos durante el período",
  average: 142000,
  max: { value: 168000, label: "mar 2025" },
  min: { value: 118000, label: "ene 2025" },
  points: [
    { month: "ene", value: 125000 },
    { month: "feb", value: 132000 },
    { month: "mar", value: 168000 },
    { month: "abr", value: 154000 },
    { month: "may", value: 149000 },
    { month: "jun", value: 138000 },
    { month: "jul", value: 146000 },
    { month: "ago", value: 152000 },
    { month: "sep", value: 139000 },
    { month: "oct", value: 145000 },
    { month: "nov", value: 141000 },
    { month: "dic", value: 134000 },
  ],
};

const mockExpensesByCategory = [
  { category: "Servicios Básicos", value: 54000 },
  { category: "Vivienda", value: 76000 },
  { category: "Transporte", value: 42000 },
  { category: "Servicios Financieros", value: 35500 },
  { category: "Impuestos y Tasas", value: 68000 },
  { category: "Alimentos y Bebidas", value: 38500 },
  { category: "Educación", value: 29500 },
  { category: "Salud", value: 31800 },
];

const mockCategoryPerformance = [
  { category: "Ventas", value: 385188 },
  { category: "Servicios", value: 353625 },
  { category: "Produccion", value: 272799 },
  { category: "Logistica", value: 199511 },
  { category: "Marketing", value: 194480 },
  { category: "Tecnologia", value: 193511 },
  { category: "RRHH", value: 91909 },
  { category: "Administracion", value: 77346 },
];

const mockBudget = {
  name: "Presupuesto anual 2025",
  slug: "presupuesto-anual-2025",
  period: {
    label: "Octubre 2025",
    routeParam: "octubre-2025",
  },
  categories: [
    { name: "Ventas", planned: 850000, actual: 640000 },
    { name: "Marketing", planned: 250000, actual: 210000 },
    { name: "Operaciones", planned: 300000, actual: 320000 },
    { name: "RRHH", planned: 180000, actual: 150000 },
  ],
};

const mockCashflow = {
  labels: ["Hoy", "+5d", "+10d", "+15d", "+20d", "+25d", "+30d"],
  incomes: [220000, 180000, 210000, 190000, 230000, 200000, 250000],
  expenses: [150000, 160000, 170000, 165000, 175000, 160000, 185000],
  net: [70000, 20000, 40000, 25000, 55000, 40000, 65000],
};

const mockDueDates = [
  {
    id: "afip-01",
    date: new Date().toISOString(),
    type: "AFIP",
    name: "IVA mensual",
    amount: 155000,
  },
  {
    id: "prov-02",
    date: new Date(Date.now() + 3 * 86400000).toISOString(),
    type: "Proveedor",
    name: "Servicios Cloud",
    amount: 98000,
  },
  {
    id: "cli-03",
    date: new Date(Date.now() + 7 * 86400000).toISOString(),
    type: "Cliente",
    name: "Cobranza Grupo Litoral",
    amount: 210000,
  },
];

const mockTasks = [
  {
    id: "task-1",
    title: "Conciliar Banco Nación",
    description: "Tenés 4 movimientos pendientes de revisar.",
    severity: "high",
  },
  {
    id: "task-2",
    title: "Subir comprobantes de AFIP",
    description: "Faltan adjuntar comprobantes del último pago.",
    severity: "medium",
  },
  {
    id: "task-3",
    title: "categoriar movimientos",
    description: "3 ingresos sin categoría asignada.",
    severity: "low",
  },
];

const mockMovements = [
  {
    id: "mov-1",
    tipo: "Egreso",
    montoTotal: -125000,
    moneda: "ARS",
    fechaEmision: new Date().toISOString(),
    categoria: "Logistica",
  },
  {
    id: "mov-2",
    tipo: "Ingreso",
    montoTotal: 185000,
    moneda: "ARS",
    fechaEmision: new Date(Date.now() - 86400000).toISOString(),
    categoria: "Ventas",
  },
  {
    id: "mov-3",
    tipo: "Egreso",
    montoTotal: -78000,
    moneda: "ARS",
    fechaEmision: new Date(Date.now() - 2 * 86400000).toISOString(),
    categoria: "Marketing",
  },
  {
    id: "mov-4",
    tipo: "Transferencia",
    montoTotal: -45000,
    moneda: "ARS",
    fechaEmision: new Date(Date.now() - 3 * 86400000).toISOString(),
    categoria: null,
  },
];

const mockReconciliation = {
  periodo: "2025-10",
  periodLabel: "octubre 2025",
  totalMovimientos: 124,
  conciliados: 96,
  pendientes: 28,
  porcentajeConciliados: 77.4,
  ultimaConciliacion: "2025-10-28",
  ultimoPendiente: "2025-10-30",
  porTipo: [
    {
      tipo: "Ingreso",
      total: 68,
      conciliados: 55,
      pendientes: 13,
      porcentaje: 80.9,
    },
    {
      tipo: "Egreso",
      total: 56,
      conciliados: 41,
      pendientes: 15,
      porcentaje: 73.2,
    },
  ],
};

const mockBilling = {
  invoices: [
    {
      id: "fac-01",
      number: "A-0003-000125",
      customer: "Fábrica El Sol",
      amount: 145000,
      date: new Date().toISOString(),
    },
    {
      id: "fac-02",
      number: "A-0003-000124",
      customer: "Cooperativa Delta",
      amount: 98000,
      date: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "fac-03",
      number: "B-0001-000543",
      customer: "Estudio Contable Sur",
      amount: 54000,
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ],
};

const DASHBOARD_CACHE_KEY = "dashboard_summary_v1";

const normalizeMovementsError = (error) => {
  if (!error) {
    return "No pudimos cargar los movimientos.";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  return "No pudimos cargar los movimientos.";
};

const mapMovementFromBackend = (item, index) => {
  if (!item) {
    return {
      id: `movement-${index}`,
      tipo: "Movimiento",
      montoTotal: 0,
      moneda: "ARS",
      fechaEmision: null,
      categoria: null,
    };
  }

  const toNumber = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  return {
    id: item.id ?? item.uuid ?? `movement-${index}`,
    tipo: item.tipo ?? item.tipoMovimiento ?? item.tipoOperacion ?? "Movimiento",
    montoTotal: toNumber(item.montoTotal ?? item.monto ?? item.importe ?? 0),
    moneda: item.moneda ?? item.monedaCodigo ?? "ARS",
    fechaEmision: item.fechaEmision ?? item.fecha ?? item.fechaRegistro ?? null,
    categoria:
      item.categoria ??
      item.categoriaNombre ??
      item.categoriaDescripcion ??
      item.area ??
      null,
  };
};

const mapInvoiceFromBackend = (item, index) => {
  if (!item) {
    return {
      id: `invoice-${index}`,
      tipoFactura: "Factura",
      numeroDocumento: null,
      montoTotal: 0,
      moneda: "ARS",
      fechaEmision: null,
      compradorNombre: null,
      vendedorNombre: null,
    };
  }

  const toNumber = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  return {
    id: item.id ?? item.idDocumento ?? `invoice-${index}`,
    tipoFactura: item.tipoFactura ?? "Factura",
    numeroDocumento: item.numeroDocumento ?? null,
    montoTotal: toNumber(item.montoTotal ?? 0),
    moneda: item.moneda ?? "ARS",
    fechaEmision: item.fechaEmision ?? null,
    compradorNombre: item.compradorNombre ?? null,
    vendedorNombre: item.vendedorNombre ?? null,
  };
};

const initialDashboardState = {
  kpis: { loading: true, error: null, data: null },
  budget: { loading: true, error: null, data: null },
  cashflow: { loading: true, error: null, data: null },
  dueDates: { loading: true, error: null, data: null },
  tasks: { loading: true, error: null, data: null },
  movements: { loading: true, error: null, data: null },
  invoices: { loading: true, error: null, data: null },
  reconciliation: { loading: true, error: null, data: null },
  billing: { loading: true, error: null, data: null },
  salesTrend: { loading: true, error: null, data: null },
  salesByCategory: { loading: true, error: null, data: null },
  expensesTrend: { loading: true, error: null, data: null },
  expensesByCategory: { loading: true, error: null, data: null },
};

const companiesMock = ["MyCFO Demo", "Acme Corp", "Globex Latam"];

const getRecentPeriods = (count = 6) =>
  Array.from({ length: count }).map((_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - index);
    const label = new Intl.DateTimeFormat("es-AR", {
      month: "long",
      year: "numeric",
    }).format(date);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    return { label, value };
  });

const Dashboard = React.memo(() => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { tienePermiso, esAdminTotal } = usePermisos();
  const { resolvedMode, paletteVars, primaryTextColor } =
    useResolvedColorTokens();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [state, setState] = React.useState(initialDashboardState);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const fetchTimeoutRef = React.useRef();
  const activeRequestRef = React.useRef(0);
  const useMocks = React.useRef(
    process.env.REACT_APP_USE_MOCKS === "true"
  ).current;
  const buildMockState = React.useCallback(
    () => ({
      kpis: { loading: false, error: null, data: mockKpis },
      budget: { loading: false, error: null, data: mockBudget },
      cashflow: { loading: false, error: null, data: mockCashflow },
      dueDates: { loading: false, error: null, data: mockDueDates },
      tasks: { loading: false, error: null, data: mockTasks },
      movements: { loading: false, error: null, data: mockMovements },
      invoices: { loading: false, error: null, data: [] },
      reconciliation: { loading: false, error: null, data: mockReconciliation },
      billing: { loading: false, error: null, data: mockBilling },
      salesTrend: { loading: false, error: null, data: mockSalesTrend },
      salesByCategory: {
        loading: false,
        error: null,
        data: mockCategoryPerformance,
      },
      expensesTrend: { loading: false, error: null, data: mockExpensesTrend },
      expensesByCategory: {
        loading: false,
        error: null,
        data: mockExpensesByCategory,
      },
    }),
    []
  );
  const [snackbar, setSnackbar] = React.useState(null);
  const [company, setCompany] = React.useState(sessionStorage.getItem("organizacionId") || null);
  const periodOptions = React.useMemo(() => getRecentPeriods(6), []);
  const [period, setPeriod] = React.useState(periodOptions[0]?.value ?? "");
  const [currency, setCurrency] = usePreferredCurrency("ARS");
  const dashboardCacheKey = React.useMemo(
    () => `${DASHBOARD_CACHE_KEY}_${currency}`,
    [currency]
  );
  const formatCurrency = React.useMemo(
    () => (value) => formatCurrencyByCode(value, currency),
    [currency]
  );

  const chatbotContext = React.useMemo(
    () => ({
      screen: "dashboard",
      period,
      currency,
      kpis: state.kpis?.data ?? null,
      cashflow: state.cashflow?.data ?? null,
      reconciliation: state.reconciliation?.data ?? null,
      recentMovements: Array.isArray(state.movements?.data)
        ? state.movements.data.slice(0, 5)
        : [],
      recentInvoices: Array.isArray(state.invoices?.data)
        ? state.invoices.data.slice(0, 5)
        : [],
      salesTrend: state.salesTrend?.data ?? null,
      expensesTrend: state.expensesTrend?.data ?? null,
      salesByCategory: Array.isArray(state.salesByCategory?.data)
        ? state.salesByCategory.data.slice(0, 6)
        : [],
      expensesByCategory: Array.isArray(state.expensesByCategory?.data)
        ? state.expensesByCategory.data.slice(0, 6)
        : [],
      budget: state.budget?.data ?? null,
    }),
    [currency, period, state]
  );

  useChatbotScreenContext(chatbotContext);

  const userDisplayName = React.useMemo(() => {
    if (typeof window === "undefined") {
      return "Usuario";
    }
    try {
      const storedFullName = sessionStorage.getItem("nombre");
      if (storedFullName && storedFullName.trim()) {
        return storedFullName.trim();
      }
      const storedName = sessionStorage.getItem("name");
      if (storedName && storedName.trim()) {
        return storedName.trim();
      }
      const storedEmail = sessionStorage.getItem("email");
      if (storedEmail && storedEmail.includes("@")) {
        return storedEmail.split("@")[0];
      }
    } catch (error) {
      // Ignoramos errores de acceso al storage
    }
    return "Usuario";
  }, []);

  const tieneAlgunPermiso = React.useCallback(() => {
    if (esAdminTotal()) return true;
    const modulos = ['carga', 'movs', 'banco', 'facts', 'concil', 'reps', 'pron', 'pres', 'admin'];
    return modulos.some(m => tienePermiso(m, 'view'));
  }, [tienePermiso, esAdminTotal]);

  const loadDashboardData = React.useCallback(async () => {
    console.log("🔄 Recargando datos del dashboard...");
    setIsRefreshing(true);

    // 1. Intentar refrescar los permisos desde el servidor
    try {
      const { data: profile } = await http.get(`${API_CONFIG.ADMINISTRACION}/api/usuarios/perfil`);
      if (profile && (profile.rol || profile.empresaId !== undefined)) {
        console.log("🔑 Perfil actualizado desde el servidor:", profile);

        // 1. Sincronizar Empresa
        if (profile.empresaId) {
          sessionStorage.setItem('organizacionId', profile.empresaId);
          setCompany(profile.empresaId);
        } else {
          sessionStorage.removeItem('organizacionId');
          setCompany(null);
        }

        // 2. Sincronizar Rol y Permisos
        if (profile.rol) {
          sessionStorage.setItem('rol', profile.rol);
          if (profile.rol.includes('|PERM:')) {
            const jsonPart = profile.rol.split('|PERM:')[1].split('|')[0];
            sessionStorage.setItem('permisos', jsonPart);
          } else {
            sessionStorage.removeItem('permisos');
          }
        }

        // 3. Notificar cambios
        window.dispatchEvent(new Event('userDataUpdated'));
      }
    } catch (err) {
      console.warn("⚠️ No se pudieron refrescar los permisos:", err);
    }

    setState((prev) => {
      const next = {};
      Object.entries(prev).forEach(([key, value]) => {
        next[key] = { ...value, loading: true, error: null };
      });
      return next;
    });

    clearTimeout(fetchTimeoutRef.current);

    if (useMocks) {
      fetchTimeoutRef.current = setTimeout(() => {
        setState(buildMockState());
        setIsRefreshing(false);
        console.log("✅ Datos del dashboard recargados (modo mock)");
      }, 700);
      return; // Exit early if using mocks
    }

    fetchTimeoutRef.current = undefined;

    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    const applyResult = ({
      movements: movementsState,
      invoices: invoicesState,
      kpis: kpisState,
      salesTrend: salesTrendState,
      salesByCategory: salesByCategoryState,
      expensesTrend: expensesTrendState,
      expensesByCategory: expensesByCategoryState,
      reconciliation: reconciliationState,
    }) => {
      if (activeRequestRef.current !== requestId) {
        return;
      }
      const mockState = buildMockState(); // Use mock state as a base to ensure all keys are present
      mockState.movements = movementsState ?? mockState.movements;
      if (invoicesState) {
        mockState.invoices = invoicesState;
      }
      if (kpisState) {
        mockState.kpis = kpisState;
      }
      if (salesTrendState) {
        mockState.salesTrend = salesTrendState;
      }
      if (salesByCategoryState) {
        mockState.salesByCategory = salesByCategoryState;
      }
      if (expensesTrendState) {
        mockState.expensesTrend = expensesTrendState;
      }
      if (expensesByCategoryState) {
        mockState.expensesByCategory = expensesByCategoryState;
      }
      if (reconciliationState) {
        mockState.reconciliation = reconciliationState;
      }
      setState(mockState);
      setIsRefreshing(false);
      console.log("✅ Datos del dashboard recargados");
    };

    const resolveErrorMessage = (reason, fallback) => {
      if (!reason) return fallback;
      if (typeof reason === "string") return reason;
      if (reason.message) return reason.message;
      if (reason.mensaje) return reason.mensaje;
      return fallback;
    };

    const mapTrendResponse = (response, { title, emptyMessage, subheader }) => {
      const datos = Array.isArray(response?.datos) ? response.datos : [];
      const monthShort = new Intl.DateTimeFormat("es-AR", { month: "short" });
      const monthLong = new Intl.DateTimeFormat("es-AR", {
        month: "long",
        year: "numeric",
      });

      const periodoBase = String(
        response?.periodoBase ?? response?.periodo ?? ""
      );
      const [baseYearStr] = periodoBase.split("-");
      const targetYear = Number(baseYearStr) || new Date().getFullYear();

      const totalsByPeriod = new Map();
      datos.forEach((item) => {
        const periodo = String(item?.periodo ?? "");
        const [yearStr, monthStr] = periodo.split("-");
        const yearNum = Number(yearStr);
        const monthNum = Number(monthStr);
        if (Number.isFinite(yearNum) && Number.isFinite(monthNum)) {
          const key = `${yearNum}-${String(monthNum).padStart(2, "0")}`;
          totalsByPeriod.set(key, Number(item?.total ?? 0));
        }
      });

      const fallbackByMonth = datos.reduce((acc, item) => {
        const periodo = String(item?.periodo ?? "");
        const [, monthStr] = periodo.split("-");
        const monthNum = Number(monthStr);
        if (Number.isFinite(monthNum) && !acc.has(monthNum)) {
          acc.set(monthNum, Number(item?.total ?? 0));
        }
        return acc;
      }, new Map());

      const pointsDetailed = Array.from({ length: 12 }, (_, index) => {
        const date = new Date(targetYear, index, 1);
        const key = `${date.getFullYear()}-${String(index + 1).padStart(
          2,
          "0"
        )}`;
        let value = totalsByPeriod.get(key);
        if (typeof value === "undefined") {
          value = fallbackByMonth.get(index + 1) ?? 0;
        }
        return {
          month: monthShort.format(date),
          fullLabel: monthLong.format(date),
          value,
        };
      });

      const values = pointsDetailed.map((point) => point.value);
      const nonZeroValues = values.filter((val) => val !== 0);
      const average =
        nonZeroValues.length > 0
          ? nonZeroValues.reduce((acc, val) => acc + val, 0) / nonZeroValues.length
          : 0;
      const maxValue = values.length > 0 ? Math.max(...values) : 0;
      const minValue = values.length > 0 ? Math.min(...values) : 0;
      const maxPoint = pointsDetailed.find((point) => point.value === maxValue);
      const minPoint = pointsDetailed.find((point) => point.value === minValue);

      return {
        title,
        emptyMessage,
        subheader,
        points: pointsDetailed.map(({ month, value }) => ({ month, value })),
        average,
        max: {
          value: maxValue,
          label: maxPoint ? maxPoint.fullLabel : "--",
        },
        min: {
          value: minValue,
          label: minPoint ? minPoint.fullLabel : "--",
        },
      };
    };

    const mapCategoryResponse = (response) => {
      const categorias = Array.isArray(response?.categorias)
        ? response.categorias
        : [];
      return categorias.map((item) => ({
        category: item?.categoria ?? "Sin categoria",
        value: Number(item?.total ?? 0),
      }));
    };

    const mapConciliationResponse = (response) => {
      if (!response) return null;
      const total = Number(response.totalMovimientos ?? 0);
      const conciliados = Number(response.conciliados ?? 0);
      const pendientes = response.pendientes !== undefined
        ? Number(response.pendientes ?? 0)
        : Math.max(total - conciliados, 0);
      const porcentaje = response.porcentajeConciliados !== undefined && response.porcentajeConciliados !== null
        ? Number(response.porcentajeConciliados)
        : total > 0 ? (conciliados * 100) / total : 0;

      const periodo = String(response.periodo ?? "");
      let periodLabel = periodo || "Periodo actual";
      const [yearStr, monthStr] = periodo.split("-");
      const monthIndex = Number(monthStr) - 1;
      const yearNum = Number(yearStr);
      const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      if (monthIndex >= 0 && monthIndex < monthNames.length && Number.isFinite(yearNum)) {
        periodLabel = `${monthNames[monthIndex]} ${yearNum}`;
      }

      const porTipoRaw = Array.isArray(response.porTipo) ? response.porTipo : [];
      const porTipo = porTipoRaw.map((item) => {
        const totalTipo = Number(item?.total ?? 0);
        const conciliadosTipo = Number(item?.conciliados ?? 0);
        const pendientesTipo = item?.pendientes !== undefined ? Number(item.pendientes ?? 0) : Math.max(totalTipo - conciliadosTipo, 0);
        const porcentajeTipo = totalTipo > 0 ? (conciliadosTipo * 100) / totalTipo : 0;
        return {
          tipo: item?.tipo ?? "Sin tipo",
          total: totalTipo,
          conciliados: conciliadosTipo,
          pendientes: pendientesTipo,
          porcentaje: porcentajeTipo,
        };
      });

      return {
        periodo,
        periodLabel,
        totalMovimientos: total,
        conciliados,
        pendientes,
        porcentajeConciliados: porcentaje,
        ultimaConciliacion: response.ultimaConciliacion ?? null,
        ultimoPendiente: response.ultimoPendiente ?? null,
        porTipo,
      };
    };

    const applyCompositeResponse = (composite) => {
      if (!composite) return;

      const movimientosBackend = Array.isArray(composite.movimientosRecientes)
        ? composite.movimientosRecientes
        : [];
      const facturasBackend = Array.isArray(composite.facturasRecientes)
        ? composite.facturasRecientes
        : [];

      const movementsState = {
        loading: false,
        error: null,
        data: movimientosBackend.map(mapMovementFromBackend),
      };

      const invoicesState = {
        loading: false,
        error: null,
        data: facturasBackend.map(mapInvoiceFromBackend),
      };

      let kpisState = null;
      const resumen = composite.resumenMensual;
      const saldoTotal = composite.saldoTotal;
      if (resumen) {
        kpisState = {
          loading: false,
          error: null,
          data: {
            totalIncomes: resumen.ingresosTotales,
            totalExpenses: resumen.egresosTotales,
            netResult: resumen.resultadoNeto,
            period: resumen.periodo,
            periodLabel: resumen.periodo,
            movementsCount: resumen.totalMovimientos,
            totalBalance: saldoTotal?.saldoTotal ?? null,
          },
        };
      }

      const salesTrendState = composite.ingresosMensuales
        ? {
          loading: false,
          error: null,
          data: mapTrendResponse(composite.ingresosMensuales, {
            title: "Ingresos durante el período",
            emptyMessage: "No hay ingresos registrados en este periodo.",
            subheader:
              "Serie mensual de ingresos registrados en los ultimos 12 meses.",
          }),
        }
        : { loading: false, error: null, data: null };

      const expensesTrendState = composite.egresosMensuales
        ? {
          loading: false,
          error: null,
          data: mapTrendResponse(composite.egresosMensuales, {
            title: "Egresos durante el período",
            emptyMessage: "No hay egresos registrados en este periodo.",
            subheader:
              "Serie mensual de egresos registrados en los ultimos 12 meses.",
          }),
        }
        : { loading: false, error: null, data: null };

      const salesByCategoryState = composite.ingresosPorCategoria
        ? {
          loading: false,
          error: null,
          data: mapCategoryResponse(composite.ingresosPorCategoria),
        }
        : { loading: false, error: null, data: null };

      const expensesByCategoryState = composite.egresosPorCategoria
        ? {
          loading: false,
          error: null,
          data: mapCategoryResponse(composite.egresosPorCategoria),
        }
        : { loading: false, error: null, data: null };

      const reconciliationState = composite.conciliacion
        ? {
          loading: false,
          error: null,
          data: mapConciliationResponse(composite.conciliacion),
        }
        : { loading: false, error: null, data: null };

      applyResult({
        movements: movementsState,
        invoices: invoicesState,
        kpis: kpisState,
        salesTrend: salesTrendState,
        salesByCategory: salesByCategoryState,
        expensesTrend: expensesTrendState,
        expensesByCategory: expensesByCategoryState,
        reconciliation: reconciliationState,
      });
    };

    // Actual data fetching logic
    (async () => {
      // 1) Mostrar primero lo que haya en cache (si existe)
      if (typeof window !== "undefined") {
        try {
          const raw = window.sessionStorage.getItem(dashboardCacheKey);
          if (raw) {
            const cached = JSON.parse(raw);
            applyCompositeResponse(cached);
          }
        } catch (err) {
          // ignoramos errores de parseo / storage
        }
      }

      // 2) Hacer la llamada al endpoint compuesto (Solo si hay empresa)
      if (company && company !== 'null') {
        try {
          const composite = await fetchDashboardSummary({
            period,
            months: 12,
            limitMovements: 6,
            limitInvoices: 6,
            currency,
            organizacionId: company,
          });

          // guardar en cache la respuesta cruda del backend
          if (typeof window !== "undefined") {
            try {
              window.sessionStorage.setItem(
                dashboardCacheKey,
                JSON.stringify(composite)
              );
            } catch (err) {
              // ignoramos errores de storage
            }
          }

          applyCompositeResponse(composite);
        } catch (error) {
          console.error("❌ Error recargando dashboard:", error);
          if (activeRequestRef.current !== requestId) {
            return;
          }
          setIsRefreshing(false);
          setState((prev) => ({
            ...prev,
            kpis: {
              ...prev.kpis,
              loading: false,
              error:
                error?.message ||
                "No pudimos actualizar el resumen de dashboard.",
            },
          }));
        }
      } else {
        setIsRefreshing(false);
        console.log("⚠️ No hay empresa seleccionada, omitiendo carga de datos.");
      }
    })();
  }, [buildMockState, currency, dashboardCacheKey, useMocks, period, company]);

  // Escuchar actualizaciones globales de usuario (ej: desde Home.js)
  React.useEffect(() => {
    const handleUpdate = () => {
      const currentOrgId = sessionStorage.getItem("organizacionId");
      setCompany(currentOrgId || null);
    };
    window.addEventListener('userDataUpdated', handleUpdate);
    return () => window.removeEventListener('userDataUpdated', handleUpdate);
  }, []);

  React.useEffect(() => {
    loadDashboardData();
    return () => {
      clearTimeout(fetchTimeoutRef.current);
      activeRequestRef.current += 1;
    };
  }, [loadDashboardData]);


  const handleNavigate = React.useCallback(
    (path, params) => {
      if (!path) return;
      if (params) {
        const searchParams = new URLSearchParams(params);
        navigate({ pathname: path, search: `?${searchParams.toString()}` });
      } else {
        navigate(path);
      }
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [navigate]
  );

  const quickActions = React.useMemo(
    () => [
      {
        id: "movement",
        label: "Cargar movimiento",
        icon: <AddCircleOutlineRoundedIcon />,
        action: () => handleNavigate("/carga"),
        visible: tienePermiso('carga', 'edit'),
      },
      {
        id: "excel",
        label: "Importar Excel",
        icon: <UploadFileRoundedIcon />,
        action: () => handleNavigate("/carga-movimientos"),
        visible: tienePermiso('banco', 'edit'),
      },
      {
        id: "mp",
        label: "Mercado Pago",
        icon: <AccountBalanceWalletRoundedIcon />,
        action: () => handleNavigate("/mercado-pago"),
        visible: tienePermiso('banco', 'edit'),
      },
      {
        id: "reconcile",
        label: "Conciliar",
        icon: <PublishedWithChangesRoundedIcon />,
        action: () => handleNavigate("/conciliacion"),
        visible: tienePermiso('concil', 'edit'),
      },
      {
        id: "invoice",
        label: "Cargar factura",
        icon: <ReceiptLongRoundedIcon />,
        action: () => handleNavigate("/carga/factura"),
        visible: tienePermiso('facts', 'edit'),
      },
      {
        id: "budget",
        label: "Nuevo presupuesto",
        icon: <AssessmentRoundedIcon />,
        action: () => handleNavigate("/presupuestos/nuevo"),
        visible: tienePermiso('pres', 'edit'),
      },
      {
        id: "reminder",
        label: "Recordatorio",
        icon: <NotificationsActiveRoundedIcon />,
        action: () => handleNavigate("/recordatorios"),
        visible: true, // Notificaciones son libres
      },
    ].filter(a => a.visible),
    [handleNavigate, tienePermiso]
  );

  const handleQuickAction = (action) => {
    if (action?.action) {
      action.action();
    } else {
      setSnackbar({
        severity: "info",
        message: `${action?.label ?? "Acción"} en desarrollo.`,
      });
    }
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar(null);
  };

  const kpiCards = React.useMemo(() => {
    const data = state.kpis.data;
    const canSeeFinances = tienePermiso('movs', 'view') || tienePermiso('facts', 'view');
    if (!canSeeFinances) return [];
    return [
      { id: "totalIncomes", title: "Ingresos Totales Mensuales", value: data?.totalIncomes ?? null, formatter: formatCurrency, trend: [] },
      { id: "totalExpenses", title: "Egresos Totales Mensuales", value: data?.totalExpenses ?? null, formatter: formatCurrency, trend: [] },
      { id: "netResult", title: "Resultado Neto Mensuales", value: data?.netResult ?? null, formatter: formatCurrency, trend: [] },
      { id: "totalBalance", title: "Dinero Total", value: data?.totalBalance ?? null, formatter: formatCurrency, trend: [] },
    ];
  }, [state.kpis.data, formatCurrency, tienePermiso]);

  const quickActionsLoading = state.kpis.loading && !state.kpis.data;
  const quickActionsSx = React.useMemo(() => ({
    position: { xs: "relative", md: "sticky" },
    top: { md: theme.spacing(1) },
    zIndex: theme.zIndex.appBar - 1,
    display: "flex",
    justifyContent: "center",
  }), [theme]);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1650,
        mx: "auto",
        px: { xs: 2, sm: 3, md: 4, lg: 6 },
        pb: 6,
      }}
    >
      <Stack spacing={3} sx={{ width: "100%" }}>

        {(!company || company === 'null') ? (
          <WelcomeChoice />
        ) : !tieneAlgunPermiso() ? (
          <DashboardEmptyState
            userDisplayName={userDisplayName}
            onRetry={loadDashboardData}
          />
        ) : (
          <>
            <CurrencyTabs value={currency} onChange={setCurrency} />
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              sx={{ width: "100%" }}
            >
              <Box>
                <Typography variant="h4" fontWeight={600}>
                  Hola, {userDisplayName}
                </Typography>
                <Typography variant="body2" sx={{ color: primaryTextColor }}>
                  Todo lo importante de tu cuenta, en un solo lugar.
                </Typography>
              </Box>
            </Stack>
            <Box sx={quickActionsSx}>
              <QuickActions
                actions={quickActions}
                loading={quickActionsLoading}
                onAction={handleQuickAction}
              />
            </Box>

            <Grid
              container
              spacing={2}
              justifyContent="center"
              sx={{ maxWidth: { xs: "100%", md: 1600 }, mx: "auto" }}
            >
              {kpiCards.map((card) => (
                <Grid size={{ xs: 12, sm: 12, md: 3 }} key={card.id}>
                  <KpiCard
                    title={card.title}
                    value={card.value}
                    formatter={card.formatter}
                    secondaryLabel={card.secondaryLabel}
                    secondaryValue={card.secondaryValue}
                    secondaryFormatter={card.secondaryFormatter}
                    trend={card.trend}
                    trendColor={card.trendColor}
                    loading={state.kpis.loading && !state.kpis.data}
                    error={state.kpis.error}
                    onRetry={loadDashboardData}
                  />
                </Grid>
              ))}
            </Grid>

            {(tienePermiso('movs', 'view') || tienePermiso('facts', 'view')) && (
              <Grid
                container
                spacing={3}
                justifyContent="center"
                sx={{ width: "100%", maxWidth: 1600, mx: "auto" }}
              >
                <Grid>
                  <Box sx={{ width: { xs: "100%", md: 720 } }}>
                    <SalesTrendWidget
                      data={
                        state.salesTrend.data ?? {
                          title: "Ingresos durante el período",
                          points: [],
                          average: 0,
                          max: { value: 0, label: "--" },
                          min: { value: 0, label: "--" },
                        }
                      }
                      loading={state.salesTrend.loading && !state.salesTrend.data}
                      error={state.salesTrend.error}
                      onNavigate={() => handleNavigate("/reportes/ventas")}
                      currency={currency}
                    />
                  </Box>
                </Grid>
                <Grid>
                  <Box sx={{ width: { xs: "100%", md: 720 } }}>
                    <SalesByCategoryWidget
                      data={state.salesByCategory.data ?? []}
                      loading={
                        state.salesByCategory.loading && !state.salesByCategory.data
                      }
                      error={state.salesByCategory.error}
                      currency={currency}
                    />
                  </Box>
                </Grid>
              </Grid>
            )}

            {(tienePermiso('movs', 'view') || tienePermiso('facts', 'view')) && (
              <Grid
                container
                spacing={3}
                justifyContent="center"
                sx={{ width: "100%", maxWidth: 1600, mx: "auto" }}
              >
                <Grid>
                  <Box sx={{ width: { xs: "100%", md: 720 } }}>
                    <SalesTrendWidget
                      data={
                        state.expensesTrend.data ?? {
                          title: "Egresos durante el período",
                          points: [],
                          average: 0,
                          max: { value: 0, label: "--" },
                          min: { value: 0, label: "--" },
                        }
                      }
                      loading={
                        state.expensesTrend.loading && !state.expensesTrend.data
                      }
                      error={state.expensesTrend.error}
                      emptyMessage="No hay egresos registrados en este periodo."
                      currency={currency}
                    />
                  </Box>
                </Grid>
                <Grid>
                  <Box sx={{ width: { xs: "100%", md: 720 } }}>
                    <SalesByCategoryWidget
                      data={state.expensesByCategory.data ?? []}
                      loading={
                        state.expensesByCategory.loading &&
                        !state.expensesByCategory.data
                      }
                      error={state.expensesByCategory.error}
                      emptyMessage="No hay egresos por categoria en este periodo."
                      title="Egresos por categorias"
                      subtitle="Distribucion anual por segmento"
                      currency={currency}
                    />
                  </Box>
                </Grid>
              </Grid>
            )}

            <Grid
              container
              spacing={2}
              justifyContent="center"
              sx={{ mt: 1, width: "100%", maxWidth: 1600, mx: "auto" }}
            >
              {tienePermiso('pres', 'view') && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <BudgetWidget
                    companyId={company}
                    period={period}
                    data={state.budget.data}
                    loading={state.budget.loading && !state.budget.data}
                    error={state.budget.error}
                    onRetry={loadDashboardData}
                    currency={currency}
                  />
                </Grid>
              )}
              {tienePermiso('movs', 'view') && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <LiquidityGapWidget currency={currency} />
                </Grid>
              )}
              {tienePermiso('concil', 'view') && (
                <Grid size={{ xs: 12, md: 4 }} sx={{ display: { xs: "none", md: "block" } }}>
                  <ReconciliationWidget
                    data={state.reconciliation.data}
                    loading={
                      state.reconciliation.loading && !state.reconciliation.data
                    }
                    error={state.reconciliation.error}
                    onRetry={loadDashboardData}
                    currency={currency}
                    onNavigate={(account) =>
                      handleNavigate(
                        "/conciliacion",
                        account ? { cuenta: account } : undefined
                      )
                    }
                  />
                </Grid>
              )}
            </Grid>

            {/* Bloque de IA / insights a lo ancho al final */}
            <Grid
              container
              spacing={2}
              justifyContent="center"
              sx={{
                mt: 1,
                width: "100%",
                maxWidth: 1600,
                mx: "auto",
                display: { xs: "none", md: "flex" },
              }}
            >
              {tienePermiso('movs', 'view') && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <RecentMovementsWidget
                    data={state.movements.data}
                    loading={state.movements.loading && !state.movements.data}
                    error={state.movements.error}
                    onRetry={loadDashboardData}
                    onNavigate={() => handleNavigate("/ver-movimientos")}
                  />
                </Grid>
              )}
              {tienePermiso('facts', 'view') && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <RecentInvoicesWidget
                    data={state.invoices?.data ?? null}
                    loading={state.invoices?.loading && !state.invoices?.data}
                    error={state.invoices?.error ?? null}
                    onRetry={loadDashboardData}
                    onNavigate={() => handleNavigate("/ver-facturas")}
                  />
                </Grid>
              )}
            </Grid>

            <Grid
              container
              spacing={2}
              justifyContent="center"
              sx={{ mt: 1, width: "100%", maxWidth: 1600, mx: "auto" }}
            >
              {esAdminTotal() && (
                <Grid size={{ xs: 12, md: 10 }}>
                  <Box sx={{ width: "100%", mx: "auto" }}>
                    <InsightsWidget />
                  </Box>
                </Grid>
              )}
            </Grid>
          </>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="text"
            size="small"
            onClick={loadDashboardData}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Recargando..." : "Recargar datos de Dashboard"}
          </Button>
        </Box>
      </Stack>

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{
          vertical: isMobile ? "top" : "bottom",
          horizontal: "center",
        }}
      >
        {snackbar ? (
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity ?? "info"}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        ) : null}
      </Snackbar>
    </Box>
  );
});

export default Dashboard;
