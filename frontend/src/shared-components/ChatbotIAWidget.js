import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, TextField, IconButton, Typography, Fab, CircularProgress, useTheme, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useChatbotContext } from './ChatbotContext';
import { sessionService } from '../shared-services/sessionService';
import API_CONFIG from '../config/api-config';
import { getStoredCurrencyPreference } from './CurrencyTabs';
import { fetchDashboardSummary } from '../dashboard/services/dashboardSummaryService';
import { fetchCategorias } from '../shared-services/categoriasService';

// Asegúrate de configurar la URL correcta de tu backend de IA
//const IA_API_URL = 'http://localhost:8083/api/chat';
//const IA_API_URL = `${process.env.REACT_APP_URL_IA}/chat`;
const IA_API_URL = `${process.env.REACT_APP_API_URL}/ia/chat`;

const MONTHS_MAP = {
    enero: 1,
    ene: 1,
    febrero: 2,
    feb: 2,
    marzo: 3,
    mar: 3,
    abril: 4,
    abr: 4,
    mayo: 5,
    may: 5,
    junio: 6,
    jun: 6,
    julio: 7,
    jul: 7,
    agosto: 8,
    ago: 8,
    septiembre: 9,
    setiembre: 9,
    sep: 9,
    sept: 9,
    octubre: 10,
    oct: 10,
    noviembre: 11,
    nov: 11,
    diciembre: 12,
    dic: 12,
};

const normalizeText = (value) => {
    if (!value) return "";
    return value
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9/\\s-]/g, " ")
        .replace(/\\s+/g, " ")
        .trim();
};

const DATA_QUERY_PATTERN = new RegExp(
    "\\b(cuanto|cuantos|monto|importe|total|saldo|balance|resultado|ingreso|egreso|mayor|maximo|reporte|" +
    "cashflow|cash flow|flujo de caja|estado de resultados|pyl|p l|presupuesto|presupuestos|factura|facturas|" +
    "movimiento|movimientos|notificacion|notificaciones|recordatorio|recordatorios|conciliacion)\\b",
    "i"
);

const HOW_TO_QUERY_PATTERN = new RegExp(
    "\\b(como|c[oó]mo|donde|d[oó]nde|pasos|procedimiento|instrucciones|guia|tutorial|ayuda|como hago|como puedo|" +
    "dime como|dime donde|que hace|para que sirve|configurar|activar|desactivar|crear|editar|cargar|importar|conciliar|generar)\\b",
    "i"
);

const CARGA_TIPOS = {
    ingreso: "Ingreso",
    egreso: "Egreso",
    acreencia: "Acreencia",
    deuda: "Deuda",
    factura: "Factura",
    movimientos: "Movimientos bancarios",
};

const CARGA_MODOS = {
    formulario: "Formulario",
    documento: "Documento",
    foto: "Foto",
    audio: "Audio",
};

const buildCargaTarget = (tipo, modo) => {
    const tipoKey = tipo || "";
    const modoKey = modo || "";
    const tipoLabel = CARGA_TIPOS[tipoKey] || "Carga de datos";
    const modoLabel = CARGA_MODOS[modoKey];
    const keyParts = ["carga"];
    if (tipoKey) keyParts.push(tipoKey);
    if (modoKey) keyParts.push(modoKey);
    const labelParts = ["Carga de datos"];
    if (tipoKey) labelParts.push(tipoLabel);
    if (modoLabel) labelParts.push(modoLabel);
    return {
        key: keyParts.join("/"),
        label: labelParts.join(" > "),
        tipo: tipoKey || null,
        modo: modoKey || null,
    };
};

const detectRouteTarget = (normalizedMessage) => {
    if (!normalizedMessage) return null;
    const routeMatches = normalizedMessage.match(/\/[a-z0-9-\/]+/g);
    if (!routeMatches || !routeMatches.length) return null;
    const ordered = [...routeMatches].sort((a, b) => b.length - a.length);
    for (const rawRoute of ordered) {
        const cleanRoute = rawRoute.replace(/\/+$/, "");
        if (cleanRoute.startsWith("/carga")) {
            const segments = cleanRoute.split("/").filter(Boolean);
            const tipo = segments[1] || "";
            const modo = segments[2] || "";
            return buildCargaTarget(tipo, modo);
        }
        if (cleanRoute.startsWith("/ver-movimientos")) {
            return { key: "ver-movimientos", label: "Registro > Movimientos" };
        }
        if (cleanRoute.startsWith("/ver-facturas")) {
            return { key: "ver-facturas", label: "Registro > Facturas" };
        }
        if (cleanRoute.startsWith("/conciliacion")) {
            return { key: "conciliacion", label: "Conciliacion" };
        }
        if (cleanRoute.startsWith("/carga-movimientos")) {
            return { key: "carga-movimientos", label: "Vinculacion bancaria > Carga de movimientos" };
        }
        if (cleanRoute.startsWith("/mercado-pago")) {
            return { key: "mercado-pago", label: "Vinculacion bancaria > Mercado Pago" };
        }
        if (cleanRoute.startsWith("/reporte-mensual")) {
            return { key: "reporte-mensual", label: "Reportes > Reporte mensual" };
        }
        if (cleanRoute.startsWith("/flujo-de-caja")) {
            return { key: "flujo-de-caja", label: "Reportes > Flujo de caja" };
        }
        if (cleanRoute.startsWith("/estado-de-resultado")) {
            return { key: "estado-de-resultados", label: "Reportes > Estado de resultados" };
        }
        if (cleanRoute.startsWith("/presupuestos/nuevo")) {
            return { key: "presupuestos/nuevo", label: "Pronostico > Presupuestos > Nuevo" };
        }
        if (cleanRoute.startsWith("/presupuestos")) {
            return { key: "presupuestos", label: "Pronostico > Presupuestos" };
        }
        if (cleanRoute.startsWith("/pronostico-continuo")) {
            return { key: "pronostico-continuo", label: "Pronostico > Pronostico continuo" };
        }
        if (cleanRoute.startsWith("/pronostico-fijo")) {
            return { key: "pronostico-fijo", label: "Pronostico > Pronostico fijo" };
        }
        if (cleanRoute.startsWith("/listado-notificaciones")) {
            return { key: "listado-notificaciones", label: "Notificaciones > Centro de notificaciones" };
        }
        if (cleanRoute.startsWith("/recordatorios")) {
            return { key: "recordatorios", label: "Notificaciones > Recordatorios" };
        }
        if (cleanRoute.startsWith("/configuracion-notificaciones")) {
            return { key: "configuracion-notificaciones", label: "Notificaciones > Configuracion" };
        }
        if (cleanRoute.startsWith("/dashboard")) {
            return { key: "dashboard", label: "Dashboard" };
        }
    }
    return null;
};

const detectCargaTarget = (normalizedMessage) => {
    if (!normalizedMessage) return null;
    const hasCarga = normalizedMessage.includes("carga") || normalizedMessage.includes("cargar");
    if (!hasCarga) return null;
    const tipo = Object.keys(CARGA_TIPOS).find((key) => normalizedMessage.includes(key));
    const modo = Object.keys(CARGA_MODOS).find((key) => normalizedMessage.includes(key));
    if (!tipo && !modo) return { key: "carga", label: "Carga de datos" };
    return buildCargaTarget(tipo || "", modo || "");
};

const detectTargetScreen = (normalizedMessage) => {
    if (!normalizedMessage) return null;

    const routeTarget = detectRouteTarget(normalizedMessage);
    if (routeTarget) return routeTarget;

    if (normalizedMessage.includes("dashboard") || normalizedMessage.includes("tablero")) {
        return { key: "dashboard", label: "Dashboard" };
    }

    if (normalizedMessage.includes("reporte mensual") || normalizedMessage.includes("resumen mensual")) {
        return { key: "reporte-mensual", label: "Reportes > Reporte mensual" };
    }
    if (normalizedMessage.includes("flujo de caja") || normalizedMessage.includes("cashflow") || normalizedMessage.includes("cash flow")) {
        return { key: "flujo-de-caja", label: "Reportes > Flujo de caja" };
    }
    if (normalizedMessage.includes("estado de resultados") || normalizedMessage.includes("estado de resultado") || normalizedMessage.includes("p l") || normalizedMessage.includes("pyl")) {
        return { key: "estado-de-resultados", label: "Reportes > Estado de resultados" };
    }

    if (normalizedMessage.includes("presupuesto") || normalizedMessage.includes("presupuestos")) {
        return { key: "presupuestos", label: "Pronostico > Presupuestos" };
    }
    if (normalizedMessage.includes("pronostico continuo") || normalizedMessage.includes("pronostico continuo") || normalizedMessage.includes("rolling")) {
        return { key: "pronostico-continuo", label: "Pronostico > Pronostico continuo" };
    }
    if (normalizedMessage.includes("pronostico fijo")) {
        return { key: "pronostico-fijo", label: "Pronostico > Pronostico fijo" };
    }

    if (normalizedMessage.includes("ver movimientos") || normalizedMessage.includes("movimientos cargados")) {
        return { key: "ver-movimientos", label: "Registro > Movimientos" };
    }
    if (normalizedMessage.includes("ver facturas") || normalizedMessage.includes("facturas")) {
        return { key: "ver-facturas", label: "Registro > Facturas" };
    }
    if (normalizedMessage.includes("conciliacion")) {
        return { key: "conciliacion", label: "Conciliacion" };
    }
    if (normalizedMessage.includes("carga movimientos") || normalizedMessage.includes("carga de movimientos")) {
        return { key: "carga-movimientos", label: "Vinculacion bancaria > Carga de movimientos" };
    }
    if (normalizedMessage.includes("mercado pago")) {
        return { key: "mercado-pago", label: "Vinculacion bancaria > Mercado Pago" };
    }

    if (normalizedMessage.includes("listado notificaciones") || normalizedMessage.includes("centro de notificaciones")) {
        return { key: "listado-notificaciones", label: "Notificaciones > Centro de notificaciones" };
    }
    if (normalizedMessage.includes("recordatorios")) {
        return { key: "recordatorios", label: "Notificaciones > Recordatorios" };
    }
    if (normalizedMessage.includes("configuracion notificaciones") || normalizedMessage.includes("configuracion de notificaciones")) {
        return { key: "configuracion-notificaciones", label: "Notificaciones > Configuracion" };
    }

    const cargaTarget = detectCargaTarget(normalizedMessage);
    if (cargaTarget) return cargaTarget;

    return null;
};

const extractYear = (normalizedMessage) => {
    if (!normalizedMessage) return null;
    const match = normalizedMessage.match(/\\b(20\\d{2}|19\\d{2})\\b/);
    return match ? Number(match[1]) : null;
};

const extractMonth = (normalizedMessage) => {
    if (!normalizedMessage) return null;
    const slashMatch = normalizedMessage.match(/\\b(0?[1-9]|1[0-2])\\s*[/-]\\s*(20\\d{2}|19\\d{2})\\b/);
    if (slashMatch) {
        return Number(slashMatch[1]);
    }
    const parts = normalizedMessage.split(" ");
    for (const part of parts) {
        if (MONTHS_MAP[part]) {
            return MONTHS_MAP[part];
        }
    }
    return null;
};

const getAuthHeaders = () => {
    const headers = {};
    const sub = sessionStorage.getItem("sub");
    const token = sessionStorage.getItem("accessToken") || sessionStorage.getItem("idToken");
    if (sub) headers["X-Usuario-Sub"] = sub;
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
};

const isSameScreen = (currentScreen, targetKey) => {
    if (!currentScreen || !targetKey) return false;
    const current = normalizeText(currentScreen).replace(/-/g, " ");
    const target = normalizeText(targetKey).replace(/-/g, " ");
    if (!current || !target) return false;
    return current.includes(target) || target.includes(current);
};

const fetchReporteMensual = async ({ year, month, currency }) => {
    if (!API_CONFIG.REPORTE) {
        throw new Error("missing_api");
    }
    const params = new URLSearchParams();
    params.set("anio", Number(year));
    params.set("mes", Number(month));
    if (currency) params.set("moneda", currency);
    const response = await fetch(`${API_CONFIG.REPORTE}/resumen?${params.toString()}`, { headers: getAuthHeaders() });
    if (!response.ok) {
        throw new Error(`http_${response.status}`);
    }
    const json = await response.json();
    const detalleIngresos = Array.isArray(json?.detalleIngresos) ? json.detalleIngresos : [];
    const detalleEgresos = Array.isArray(json?.detalleEgresos) ? json.detalleEgresos : [];
    const topIngresos = [...detalleIngresos].sort((a, b) => Number(b?.total || 0) - Number(a?.total || 0)).slice(0, 5);
    const topEgresos = [...detalleEgresos].sort((a, b) => Math.abs(Number(b?.total || 0)) - Math.abs(Number(a?.total || 0))).slice(0, 5);
    const totalIngresos = detalleIngresos.reduce((sum, item) => sum + (Number(item?.total) || 0), 0);
    const totalEgresos = detalleEgresos.reduce((sum, item) => sum + Math.abs(Number(item?.total) || 0), 0);
    return {
        screen: "reporte-mensual",
        year,
        month,
        currency,
        detalleIngresos,
        detalleEgresos,
        topIngresos,
        topEgresos,
        totalIngresos,
        totalEgresos,
    };
};

const fetchCashflow = async ({ year, currency }) => {
    if (!API_CONFIG.REPORTE) {
        throw new Error("missing_api");
    }
    const params = new URLSearchParams();
    params.set("anio", Number(year));
    if (currency) params.set("moneda", currency);
    const response = await fetch(`${API_CONFIG.REPORTE}/cashflow?${params.toString()}`, { headers: getAuthHeaders() });
    if (!response.ok) {
        throw new Error(`http_${response.status}`);
    }
    const json = await response.json();
    const registros = Array.isArray(json) ? json : [];
    const totalIngresosMensual = Array(12).fill(0);
    const totalEgresosMensual = Array(12).fill(0);
    registros.forEach((tx) => {
        const monthIndex = tx?.fechaEmision ? new Date(tx.fechaEmision).getMonth() : null;
        if (monthIndex == null || monthIndex < 0 || monthIndex > 11) return;
        if (tx?.tipo === "Ingreso") {
            totalIngresosMensual[monthIndex] += Number(tx?.montoTotal || 0);
        } else if (tx?.tipo === "Egreso") {
            totalEgresosMensual[monthIndex] += Math.abs(Number(tx?.montoTotal || 0));
        }
    });
    const netosMensuales = totalIngresosMensual.map((v, i) => v - totalEgresosMensual[i]);
    return {
        screen: "flujo-de-caja",
        year,
        currency,
        registros,
        ingresosMensuales: totalIngresosMensual,
        egresosMensuales: totalEgresosMensual,
        netosMensuales,
    };
};

const fetchEstadoResultados = async ({ year, currency }) => {
    if (!API_CONFIG.REPORTE) {
        throw new Error("missing_api");
    }
    const params = new URLSearchParams();
    params.set("anio", Number(year));
    if (currency) params.set("moneda", currency);
    const response = await fetch(`${API_CONFIG.REPORTE}/pyl?${params.toString()}`, { headers: getAuthHeaders() });
    if (!response.ok) {
        throw new Error(`http_${response.status}`);
    }
    const json = await response.json();
    const detalleIngresos = Array.isArray(json?.detalleIngresos) ? json.detalleIngresos : [];
    const detalleEgresos = Array.isArray(json?.detalleEgresos) ? json.detalleEgresos : [];
    const topIngresos = [...detalleIngresos].sort((a, b) => Number(b?.total || 0) - Number(a?.total || 0)).slice(0, 5);
    const topEgresos = [...detalleEgresos].sort((a, b) => Math.abs(Number(b?.total || 0)) - Math.abs(Number(a?.total || 0))).slice(0, 5);
    const totalIngresos = detalleIngresos.reduce((sum, item) => sum + (Number(item?.total) || 0), 0);
    const totalEgresos = detalleEgresos.reduce((sum, item) => sum + Math.abs(Number(item?.total) || 0), 0);
    return {
        screen: "estado-de-resultados",
        year,
        currency,
        detalleIngresos,
        detalleEgresos,
        topIngresos,
        topEgresos,
        totalIngresos,
        totalEgresos,
        resultadoEjercicio: totalIngresos - totalEgresos,
    };
};

const withApiSuffix = (baseUrl) => {
    if (!baseUrl) return null;
    return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
};

const fetchJson = async (url) => {
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) {
        throw new Error(`http_${response.status}`);
    }
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (_err) {
        return text;
    }
};

const fetchDashboard = async ({ year, month, currency }) => {
    const period = year && month ? `${year}-${String(month).padStart(2, "0")}` : undefined;
    const data = await fetchDashboardSummary({ period, currency });
    return {
        screen: "dashboard",
        period: period || null,
        currency,
        resumen: data || null,
    };
};

const fetchMovimientos = async ({ currency }) => {
    if (!API_CONFIG.REGISTRO) throw new Error("missing_api");
    const params = new URLSearchParams();
    params.set("page", "0");
    params.set("size", "10");
    params.set("sortBy", "fechaEmision");
    params.set("sortDir", "desc");
    if (currency) params.set("moneda", currency);
    const data = await fetchJson(`${API_CONFIG.REGISTRO}/movimientos?${params.toString()}`);
    if (data && typeof data === "object" && "content" in data) {
        return {
            screen: "movimientos",
            total: data.totalElements ?? 0,
            movimientos: Array.isArray(data.content) ? data.content.slice(0, 10) : [],
        };
    }
    const items = Array.isArray(data) ? data : [];
    return {
        screen: "movimientos",
        total: items.length,
        movimientos: items.slice(0, 10),
    };
};

const fetchFacturas = async ({ currency }) => {
    if (!API_CONFIG.REGISTRO) throw new Error("missing_api");
    const params = new URLSearchParams();
    params.set("page", "0");
    params.set("size", "10");
    params.set("sortBy", "fechaEmision");
    params.set("sortDir", "desc");
    if (currency) params.set("moneda", currency);
    const data = await fetchJson(`${API_CONFIG.REGISTRO}/facturas/buscar?${params.toString()}`);
    if (data && typeof data === "object" && "content" in data) {
        return {
            screen: "facturas",
            total: data.totalElements ?? 0,
            facturas: Array.isArray(data.content) ? data.content.slice(0, 10) : [],
        };
    }
    const items = Array.isArray(data) ? data : [];
    return {
        screen: "facturas",
        total: items.length,
        facturas: items.slice(0, 10),
    };
};

const fetchConciliacion = async ({ currency }) => {
    if (!API_CONFIG.REGISTRO) throw new Error("missing_api");
    const base = `${API_CONFIG.REGISTRO}/api/conciliacion`;
    const params = new URLSearchParams();
    params.set("page", "0");
    params.set("size", "10");
    params.set("sortBy", "fechaEmision");
    params.set("sortDir", "desc");
    if (currency) params.set("moneda", currency);
    const movimientos = await fetchJson(`${base}/movimientos/sin-conciliar?${params.toString()}`);
    const estadisticas = await fetchJson(`${base}/estadisticas${currency ? `?moneda=${currency}` : ""}`);
    return {
        screen: "conciliacion",
        movimientos: Array.isArray(movimientos?.content) ? movimientos.content.slice(0, 10) : [],
        totalMovimientos: movimientos?.totalElements ?? 0,
        estadisticas: estadisticas ?? null,
    };
};

const fetchCargaMovimientos = async () => {
    if (!API_CONFIG.REGISTRO) throw new Error("missing_api");
    const data = await fetchJson(`${API_CONFIG.REGISTRO}/api/historial-cargas`);
    const items = Array.isArray(data) ? data : [];
    return {
        screen: "carga-movimientos",
        historial: items.slice(0, 10),
        total: items.length,
    };
};

const fetchMercadoPago = async () => {
    if (!API_CONFIG.REGISTRO) throw new Error("missing_api");
    const status = await fetchJson(`${API_CONFIG.REGISTRO}/api/mp/status`);
    return { screen: "mercado-pago", status: status ?? null };
};

const fetchPresupuestos = async ({ currency }) => {
    if (!API_CONFIG.PRONOSTICO) throw new Error("missing_api");
    const params = new URLSearchParams();
    params.set("status", "active");
    params.set("page", "0");
    params.set("size", "1000");
    params.set("sort", "createdAt,desc");
    if (currency) params.set("moneda", currency);
    const data = await fetchJson(`${API_CONFIG.PRONOSTICO}/api/presupuestos?${params.toString()}`);
    const content = data && typeof data === "object" && "content" in data ? data.content : data;
    const items = Array.isArray(content) ? content : [];
    return {
        screen: "presupuestos",
        totalPresupuestos: data?.totalElements ?? items.length,
        presupuestos: items.slice(0, 10),
    };
};

const fetchPronosticoFijo = async ({ currency }) => {
    if (!API_CONFIG.PRONOSTICO) throw new Error("missing_api");
    const [forecasts, configs] = await Promise.all([
        fetchJson(`${API_CONFIG.PRONOSTICO}/api/forecasts`),
        fetchJson(`${API_CONFIG.PRONOSTICO}/api/forecast-config`),
    ]);
    const forecastItems = Array.isArray(forecasts) ? forecasts : [];
    const filteredForecasts = currency
        ? forecastItems.filter((item) => (item?.moneda || "ARS") === currency)
        : forecastItems;
    return {
        screen: "pronostico-fijo",
        forecasts: filteredForecasts.slice(0, 10),
        configs: Array.isArray(configs) ? configs.slice(0, 10) : [],
    };
};

const fetchPronosticoContinuo = async ({ currency, horizonteMeses }) => {
    if (!API_CONFIG.PRONOSTICO) throw new Error("missing_api");
    const params = new URLSearchParams();
    params.set("horizonteMeses", String(horizonteMeses || 12));
    if (currency) params.set("moneda", currency);
    const response = await fetch(`${API_CONFIG.PRONOSTICO}/api/forecasts/rolling?${params.toString()}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });
    if (!response.ok) {
        throw new Error(`http_${response.status}`);
    }
    const json = await response.json();
    return {
        screen: "pronostico-continuo",
        horizonteMeses: horizonteMeses || 12,
        currency,
        datos: json ?? null,
    };
};

const fetchNotificaciones = async () => {
    const base = withApiSuffix(API_CONFIG.NOTIFICACION);
    if (!base) throw new Error("missing_api");
    const params = new URLSearchParams();
    params.set("status", "unread");
    params.set("size", "50");
    params.set("page", "0");
    const data = await fetchJson(`${base}/users/1/notifications?${params.toString()}`);
    const items = Array.isArray(data?.items) ? data.items : [];
    return {
        screen: "notificaciones",
        unread: data?.unread ?? items.length,
        notificaciones: items.slice(0, 10),
    };
};

const fetchRecordatorios = async () => {
    const base = withApiSuffix(API_CONFIG.NOTIFICACION);
    if (!base) throw new Error("missing_api");
    const data = await fetchJson(`${base}/users/1/reminders`);
    const items = Array.isArray(data) ? data : [];
    return {
        screen: "recordatorios",
        recordatorios: items.slice(0, 10),
        total: items.length,
    };
};

const fetchConfiguracionNotificaciones = async () => {
    const base = withApiSuffix(API_CONFIG.NOTIFICACION);
    if (!base) throw new Error("missing_api");
    const data = await fetchJson(`${base}/users/1/notification-preferences`);
    return {
        screen: "configuracion-notificaciones",
        preferencias: data ?? null,
    };
};

const fetchCargaData = async ({ tipo, modo }) => {
    let categorias = [];
    try {
        const tipoParam = tipo && ["ingreso", "egreso"].includes(tipo) ? tipo : undefined;
        categorias = await fetchCategorias({ tipo: tipoParam });
    } catch (_err) {
        categorias = [];
    }
    return {
        screen: "carga",
        tipo: tipo || null,
        modo: modo || null,
        categorias,
    };
};

const ChatbotWidget = ({ currentModule = 'general' }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { context } = useChatbotContext();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hola, soy tu asistente virtual. ¿En qué puedo ayudarte con este módulo?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const getPerfilFromSession = () => {
        try {
            const usuario = sessionService.getUsuario();
            const rol = sessionStorage.getItem('rol');
            const perfil = {
                nombre: usuario?.nombre || "",
                email: usuario?.email || "",
                telefono: usuario?.telefono || "",
                rol: rol || ""
            };
            if (!perfil.nombre && !perfil.email && !perfil.telefono && !perfil.rol) {
                return null;
            }
            return perfil;
        } catch (error) {
            return null;
        }
    };

    const buildContextPayload = () => {
        const route = typeof window !== 'undefined'
            ? (window.location.hash || window.location.pathname || null)
            : null;
        const base = context && typeof context === 'object' ? context : {};
        const perfil = base.perfil ?? getPerfilFromSession();

        let permisos = null;
        try {
            const storedPermisos = sessionStorage.getItem('permisos');
            if (storedPermisos) {
                permisos = JSON.parse(storedPermisos);
            }
        } catch (e) {
            console.error("Error al obtener permisos para el chatbot:", e);
        }

        const payload = {
            ...base,
            ...(perfil ? { perfil } : {}),
            ...(permisos ? { permisos } : {}),
            ...(route ? { route } : {})
        };
        return Object.keys(payload).length ? payload : null;
    };

    const buildExternalContext = async (messageText, baseContext) => {
        const normalized = normalizeText(messageText);
        if (!DATA_QUERY_PATTERN.test(normalized)) {
            return null;
        }
        if (HOW_TO_QUERY_PATTERN.test(normalized)) {
            return null;
        }

        const target = detectTargetScreen(normalized);
        if (!target) {
            return null;
        }

        if (isSameScreen(baseContext?.screen, target.key)) {
            return null;
        }

        const currency = baseContext?.currency || getStoredCurrencyPreference("ARS");
        const year = extractYear(normalized);
        const month = extractMonth(normalized);

        const missingParamsResponse = (missing) => ({
            externalFetch: {
                status: "missing-params",
                target: target.label,
                missing,
            },
        });

        const failedResponse = () => ({
            externalFetch: {
                status: "failed",
                target: target.label,
            },
        });

        try {
            switch (true) {
                case target.key === "dashboard": {
                    const data = await fetchDashboard({ year, month, currency });
                    return {
                        externalFetch: {
                            status: "ok",
                            target: target.label,
                            params: { year, month, currency },
                        },
                        externalData: { dashboard: data },
                    };
                }
                case target.key === "reporte-mensual": {
                    const missing = [];
                    if (!year) missing.push("anio");
                    if (!month) missing.push("mes");
                    if (missing.length) {
                        return missingParamsResponse(missing);
                    }
                    const data = await fetchReporteMensual({ year, month, currency });
                    return {
                        externalFetch: {
                            status: "ok",
                            target: target.label,
                            params: { year, month, currency },
                        },
                        externalData: { reporteMensual: data },
                    };
                }
                case target.key === "flujo-de-caja": {
                    if (!year) {
                        return missingParamsResponse(["anio"]);
                    }
                    const data = await fetchCashflow({ year, currency });
                    return {
                        externalFetch: {
                            status: "ok",
                            target: target.label,
                            params: { year, currency },
                        },
                        externalData: { flujoDeCaja: data },
                    };
                }
                case target.key === "estado-de-resultados": {
                    if (!year) {
                        return missingParamsResponse(["anio"]);
                    }
                    const data = await fetchEstadoResultados({ year, currency });
                    return {
                        externalFetch: {
                            status: "ok",
                            target: target.label,
                            params: { year, currency },
                        },
                        externalData: { estadoResultados: data },
                    };
                }
                case target.key === "ver-movimientos": {
                    const data = await fetchMovimientos({ currency });
                    return {
                        externalFetch: { status: "ok", target: target.label },
                        externalData: { movimientos: data },
                    };
                }
                case target.key === "ver-facturas": {
                    const data = await fetchFacturas({ currency });
                    return {
                        externalFetch: { status: "ok", target: target.label },
                        externalData: { facturas: data },
                    };
                }
                case target.key === "conciliacion": {
                    const data = await fetchConciliacion({ currency });
                    return {
                        externalFetch: { status: "ok", target: target.label },
                        externalData: { conciliacion: data },
                    };
                }
                case target.key === "carga-movimientos": {
                    const data = await fetchCargaMovimientos();
                    return {
                        externalFetch: { status: "ok", target: target.label },
                        externalData: { cargaMovimientos: data },
                    };
                }
                case target.key === "mercado-pago": {
                    const data = await fetchMercadoPago();
                    return {
                        externalFetch: { status: "ok", target: target.label },
                        externalData: { mercadoPago: data },
                    };
                }
                case target.key === "presupuestos": {
                    const data = await fetchPresupuestos({ currency });
                    return {
                        externalFetch: { status: "ok", target: target.label },
                        externalData: { presupuestos: data },
                    };
                }
                case target.key === "pronostico-fijo": {
                    const data = await fetchPronosticoFijo({ currency });
                    return {
                        externalFetch: { status: "ok", target: target.label },
                        externalData: { pronosticoFijo: data },
                    };
                }
                case target.key === "listado-notificaciones": {
                    const data = await fetchNotificaciones();
                    return {
                        externalFetch: { status: "ok", target: target.label },
                        externalData: { notificaciones: data },
                    };
                }
                case target.key === "recordatorios": {
                    const data = await fetchRecordatorios();
                    return {
                        externalFetch: { status: "ok", target: target.label },
                        externalData: { recordatorios: data },
                    };
                }
                case target.key === "configuracion-notificaciones": {
                    const data = await fetchConfiguracionNotificaciones();
                    return {
                        externalFetch: { status: "ok", target: target.label },
                        externalData: { configuracionNotificaciones: data },
                    };
                }
                case target.key === "presupuestos/nuevo": {
                    const data = await fetchCargaData({ tipo: target.tipo, modo: target.modo });
                    return {
                        externalFetch: { status: "ok", target: target.label },
                        externalData: { presupuestoNuevo: data },
                    };
                }
                case target.key.startsWith("carga"): {
                    const data = await fetchCargaData({ tipo: target.tipo, modo: target.modo });
                    return {
                        externalFetch: { status: "ok", target: target.label },
                        externalData: { carga: data },
                    };
                }
                case target.key === "pronostico-continuo": {
                    const data = await fetchPronosticoContinuo({ currency, horizonteMeses: 12 });
                    return {
                        externalFetch: { status: "ok", target: target.label },
                        externalData: { pronosticoContinuo: data },
                    };
                }
                default:
                    return {
                        externalFetch: { status: "unsupported", target: target.label },
                    };
            }
        } catch (_err) {
            return failedResponse();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            // Pequeño delay para asegurar que el DOM esté listo
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const baseContext = buildContextPayload() || {};
            const externalContext = await buildExternalContext(userMessage.text, baseContext);
            const mergedContext = externalContext
                ? {
                    ...baseContext,
                    ...externalContext,
                    externalData: {
                        ...(baseContext.externalData || {}),
                        ...(externalContext.externalData || {})
                    }
                }
                : baseContext;

            const authHeaders = getAuthHeaders();
            const response = await fetch(IA_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                },
                body: JSON.stringify({
                    message: userMessage.text,
                    module: currentModule,
                    context: Object.keys(mergedContext).length ? mergedContext : null,
                    history: messages.slice(-6)
                }),
            });

            if (!response.ok) throw new Error('Error en la comunicación');

            const data = await response.json();
            const botMessage = { sender: 'bot', text: data.response };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, { sender: 'bot', text: 'Lo siento, tuve un problema al procesar tu consulta.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    const palette = theme.vars?.palette ?? theme.palette;

    return (
        <>
            {/* Botón flotante */}
            {!isOpen && (
                <Fab
                    color="primary"
                    aria-label="chat"
                    onClick={() => setIsOpen(true)}
                    sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
                >
                    <ChatIcon />
                </Fab>
            )}

            {/* Ventana de Chat */}
            {isOpen && (
                <Paper
                    elevation={12}
                    sx={(theme) => ({
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        width: 350,
                        height: 500,
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 1000,
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: (theme.vars || theme).palette.background.paper,
                        border: `1px solid ${(theme.vars || theme).palette.divider}`,
                        color: (theme.vars || theme).palette.text.primary,
                    })}
                >
                    {/* Header */}
                    <Box sx={(theme) => ({
                        p: 2,
                        bgcolor: (theme.vars || theme).palette.primary.main,
                        color: (theme.vars || theme).palette.primary.contrastText,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: 1
                    })}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SmartToyIcon />
                            <Typography variant="subtitle1" fontWeight="bold">Asistente MyCFO</Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'inherit' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Área de mensajes */}
                    <Box sx={(theme) => ({
                        flex: 1,
                        p: 2,
                        overflowY: 'auto',
                        bgcolor: (theme.vars || theme).palette.background.default,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5
                    })}>
                        {messages.map((msg, index) => (
                            <Box
                                key={index}
                                sx={(theme) => ({
                                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    bgcolor: msg.sender === 'user'
                                        ? (theme.vars || theme).palette.primary.main
                                        : (theme.vars || theme).palette.background.paper,
                                    color: msg.sender === 'user'
                                        ? (theme.vars || theme).palette.primary.contrastText
                                        : (theme.vars || theme).palette.text.primary,
                                    p: 1.5,
                                    borderRadius: 2,
                                    boxShadow: 2,
                                    borderTopLeftRadius: msg.sender === 'bot' ? 0 : 2,
                                    borderTopRightRadius: msg.sender === 'user' ? 0 : 2,
                                    border: `1px solid ${(theme.vars || theme).palette.divider}`
                                })}
                            >
                                <Typography variant="body2" sx={{ display: 'inline', wordBreak: 'break-word' }}>
                                    {msg.text.split(/(\[\[.*?\]\])/g).map((part, i) => {
                                        const match = part.match(/^\[\[(.*?)\|(.*?)\]\]$/);
                                        if (match) {
                                            const [_, route, label] = match;
                                            return (
                                                <Button
                                                    key={i}
                                                    size="small"
                                                    variant="contained"
                                                    onClick={() => navigate(route)}
                                                    sx={{
                                                        mx: 0.5,
                                                        my: 0.2,
                                                        px: 1,
                                                        minWidth: 'auto',
                                                        height: 'auto',
                                                        textTransform: 'none',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold',
                                                        borderRadius: 1,
                                                        lineHeight: 1.2
                                                    }}
                                                >
                                                    {label}
                                                </Button>
                                            );
                                        }
                                        return part;
                                    })}
                                </Typography>
                            </Box>
                        ))}
                        {isLoading && (
                            <Box sx={{ alignSelf: 'flex-start', p: 1 }}>
                                <CircularProgress size={20} />
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input Area */}
                    <Box sx={(theme) => ({
                        p: 2,
                        bgcolor: (theme.vars || theme).palette.background.paper,
                        borderTop: `1px solid ${(theme.vars || theme).palette.divider}`,
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center'
                    })}>
                        <TextField
                            fullWidth
                            inputRef={inputRef}
                            size="small"
                            placeholder="Escribe tu duda..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: palette.background.default,
                                    color: palette.text.primary,
                                    '& fieldset': {
                                        borderColor: palette.divider,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: palette.text.secondary,
                                    },
                                },
                                '& .MuiInputBase-input::placeholder': {
                                    color: palette.text.secondary,
                                    opacity: 1,
                                },
                            }}
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            sx={(theme) => ({
                                bgcolor: (theme.vars || theme).palette.primary.dark,
                                color: (theme.vars || theme).palette.primary.contrastText,
                                '&:hover': {
                                    bgcolor: (theme.vars || theme).palette.primary.main,
                                },
                                '&.Mui-disabled': {
                                    bgcolor: (theme.vars || theme).palette.primary.dark,
                                    color: (theme.vars || theme).palette.primary.contrastText,
                                    opacity: 0.6,
                                },
                            })}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Paper>
            )}
        </>
    );
};

export default ChatbotWidget;
