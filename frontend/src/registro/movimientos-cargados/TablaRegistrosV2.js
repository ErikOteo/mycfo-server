import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Alert,
  FormLabel,
  FormHelperText,
  OutlinedInput,
  Snackbar,
  LinearProgress,
} from "@mui/material";
import { useTheme, useMediaQuery } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import WalletIcon from "@mui/icons-material/Wallet";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import API_CONFIG from "../../config/api-config";
import CustomSelect from "../../shared-components/CustomSelect";
import dayjs from "dayjs";
import FormIngreso from "../carga-general/components/forms/FormIngreso";
import FormEgreso from "../carga-general/components/forms/FormEgreso";
import FormDeuda from "../carga-general/components/forms/FormDeuda";
import FormAcreencia from "../carga-general/components/forms/FormAcreencia";
import VerIngreso from "./components/VerIngreso";
import VerEgreso from "./components/VerEgreso";
import VerDeuda from "./components/VerDeuda";
import VerAcreencia from "./components/VerAcreencia";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import SuccessSnackbar from "../../shared-components/SuccessSnackbar";
import ExportadorSimple from "../../shared-components/ExportadorSimple";
import { exportToExcel } from "../../utils/exportExcelUtils";
import { exportPdfReport } from "../../utils/exportPdfUtils";
import CustomNoRowsOverlay from "../../shared-components/CustomNoRowsOverlay";
import { useChatbotScreenContext } from "../../shared-components/useChatbotScreenContext";

// ✅ IMPORTANTE: usar tu cliente central con interceptors
import http from "../../api/http";
import CurrencyTabs, {
  getStoredCurrencyPreference,
  persistCurrencyPreference,
} from "../../shared-components/CurrencyTabs";

export default function TablaRegistrosV2() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Paginación del servidor
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);
  const [currency, setCurrency] = useState(getStoredCurrencyPreference());
  const [usuarioRol, setUsuarioRol] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("view"); // "view" o "edit"
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [movimientoToDelete, setMovimientoToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [successSnackbar, setSuccessSnackbar] = useState({
    open: false,
    message: "",
  });
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingEditId, setPendingEditId] = useState(null);
  const dialogContentRef = useRef(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);
  const [montoDesde, setMontoDesde] = useState("");
  const [montoHasta, setMontoHasta] = useState("");
  const [montoRangeLabel, setMontoRangeLabel] = useState("");
  const [montoRangeOptions, setMontoRangeOptions] = useState([]);
  const searchDateISO = useMemo(() => {
    if (!searchText) return null;
    const parsed = dayjs(searchText, ["DD/MM/YYYY", "DD-MM-YYYY"], true);
    return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
  }, [searchText]);

  const chatbotContext = useMemo(
    () => ({
      screen: "movimientos",
      currency,
      totalMovimientos: rowCount,
      filtros: {
        searchText,
        fechaDesde: fechaDesde?.format ? fechaDesde.format("YYYY-MM-DD") : null,
        fechaHasta: fechaHasta?.format ? fechaHasta.format("YYYY-MM-DD") : null,
      },
      movimientos: movimientos.slice(0, 5),
      movimientoSeleccionado: selectedMovimiento
        ? {
          id: selectedMovimiento.id,
          tipo: selectedMovimiento.tipo,
          monto: selectedMovimiento.montoTotal ?? selectedMovimiento.monto,
          fecha: selectedMovimiento.fechaEmision ?? selectedMovimiento.fecha,
          categoria: selectedMovimiento.categoria,
        }
        : null,
    }),
    [
      currency,
      rowCount,
      searchText,
      fechaDesde,
      fechaHasta,
      movimientos,
      selectedMovimiento,
    ]
  );

  useChatbotScreenContext(chatbotContext);

  const parseMontoInput = useCallback((valor) => {
    if (valor === null || valor === undefined) return null;
    const cleaned = String(valor)
      .replace(/\s|\$/g, "")
      .replace(/\./g, "")
      .replace(/,/g, ".");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }, []);

  const formatMonto = (valor) =>
    new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
      Math.round(valor ?? 0),
    );

  const buildMontoRanges = useCallback(
    (max) => {
      if (!Number.isFinite(max) || max <= 0) return [];
      let step;
      if (max <= 100) step = 10;
      else if (max <= 1_000) step = 100;
      else if (max <= 10_000) step = 1_000;
      else if (max <= 100_000) step = 10_000;
      else if (max <= 1_000_000) step = 50_000;
      else step = 10 ** Math.max(3, Math.floor(Math.log10(max)) - 1);

      let bucketCount = Math.ceil(max / step);
      if (bucketCount > 15) {
        step *= 2;
        bucketCount = Math.ceil(max / step);
      }

      const upper = Math.ceil(max / step) * step;
      const options = [];
      for (let from = 0; from < upper; from += step) {
        const to = from + step;
        options.push(`${formatMonto(from)} - ${formatMonto(to)}`);
      }
      return options;
    },
    [formatMonto],
  );

  useEffect(() => {
    const handler = setTimeout(
      () => setDebouncedSearch(searchText.trim().toLowerCase()),
      250,
    );
    return () => clearTimeout(handler);
  }, [searchText]);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await fetch("/logo512.png");
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

  useEffect(() => {
    // Cuando se busca, siempre arrancar desde la primera página para evitar resultados vacíos
    setPaginationModel((prev) =>
      prev.page === 0 ? prev : { ...prev, page: 0 },
    );
  }, [debouncedSearch, fechaDesde, fechaHasta, montoDesde, montoHasta, montoRangeLabel]);

  const clearDeepLink = useCallback(() => {
    const hasQuery = searchParams.has("editMovementId");
    const state = location.state || {};
    const {
      editMovementId: _omitId,
      editMovementMeta: _omitMeta,
      ...restState
    } = state;
    const hasStateLink =
      Object.prototype.hasOwnProperty.call(state, "editMovementId") ||
      Object.prototype.hasOwnProperty.call(state, "editMovementMeta");

    if (!hasQuery && !hasStateLink) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("editMovementId");
    const nextSearch = nextParams.toString();

    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      {
        replace: true,
        state: hasStateLink
          ? Object.keys(restState).length
            ? restState
            : undefined
          : state,
      },
    );
  }, [location.pathname, location.state, navigate, searchParams]);

  useEffect(() => {
    const fromQuery = searchParams.get("editMovementId");
    const fromState = location.state?.editMovementId;
    const candidate = fromQuery || fromState || null;
    if (candidate) {
      setPendingEditId((prev) => (prev === candidate ? prev : candidate));
    }
  }, [searchParams, location.state]);

  const API_BASE = API_CONFIG.REGISTRO;

  // Campos obligatorios por tipo de movimiento
  const requiredFieldsMap = {
    Movimiento: ["montoTotal", "moneda", "medioPago", "fechaEmision"],
    Ingreso: ["montoTotal", "moneda", "fechaEmision"],
    Egreso: ["montoTotal", "moneda", "fechaEmision"],
    Deuda: ["montoTotal", "moneda", "fechaEmision"],
    Acreencia: ["montoTotal", "moneda", "fechaEmision"],
  };

  const cargarRolUsuario = () => {
    const sub = sessionStorage.getItem("sub");
    if (sub) {
      fetch(`${API_CONFIG.ADMINISTRACION}/api/usuarios/perfil`, {
        headers: { "X-Usuario-Sub": sub },
      })
        .then((res) => res.json())
        .then((data) => setUsuarioRol(data.rol))
        .catch((err) => console.error("Error cargando rol:", err));
    }
  };

  const handleCurrencyChange = useCallback((nextCurrency) => {
    if (!nextCurrency) return;
    persistCurrencyPreference(nextCurrency);
    setCurrency(nextCurrency);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const fetchMaxMonto = useCallback(async () => {
    try {
      const usuarioSub = sessionStorage.getItem("sub");
      if (!usuarioSub) return;
      const headers = { "X-Usuario-Sub": usuarioSub };
      const params = {
        page: 0,
        size: 1,
        sortBy: "montoTotal",
        sortDir: "desc",
        moneda: currency,
      };
      const res = await http.get(`${API_BASE}/movimientos`, {
        headers,
        params,
      });
      const firstRow = res?.data?.content?.[0] ?? res?.data?.[0];
      const max = firstRow?.montoTotal;
      if (Number.isFinite(max)) {
        setMontoRangeOptions(buildMontoRanges(max));
      } else {
        setMontoRangeOptions([]);
      }
    } catch (err) {
      console.error("Error obteniendo max monto:", err);
      setMontoRangeOptions([]);
    }
  }, [API_BASE, buildMontoRanges, currency]);

  useEffect(() => {
    fetchMaxMonto();
  }, [fetchMaxMonto]);

  const cargarMovimientos = useCallback(async () => {
    setLoading(true);
    const montoMinParsed = parseMontoInput(montoDesde);
    const montoMaxParsed = parseMontoInput(montoHasta);
    if (
      montoMinParsed !== null &&
      montoMaxParsed !== null &&
      montoMinParsed > montoMaxParsed
    ) {
      setMovimientos([]);
      setRowCount(0);
      setLoading(false);
      return;
    }
    try {
      const usuarioSub = sessionStorage.getItem("sub");

      if (!usuarioSub) {
        console.error("No se encontró sub de usuario en la sesión");
        alert("Error: No se encontró usuario en la sesión");
        return;
      }

      // ✅ Seguimos mandando X-Usuario-Sub explícito
      // ✅ Authorization lo agrega http.js (interceptor)
      const headers = { "X-Usuario-Sub": usuarioSub };
      const params = {
        page: paginationModel.page,
        size: paginationModel.pageSize,
        sortBy: "fechaEmision",
        sortDir: "desc",
        moneda: currency,
        // Si es fecha, usamos searchDate y no enviamos el texto para evitar condición AND que vacía resultados
        search: searchDateISO ? undefined : debouncedSearch || undefined,
        searchDate: searchDateISO || undefined,
        montoMin: montoMinParsed ?? undefined,
        montoMax: montoMaxParsed ?? undefined,
        fechaDesde: fechaDesde
          ? dayjs(fechaDesde).format("YYYY-MM-DD")
          : undefined,
        fechaHasta: fechaHasta
          ? dayjs(fechaHasta).format("YYYY-MM-DD")
          : undefined,
      };

      console.log("[Movimientos] Obteniendo movimientos", {
        usuarioSub,
        page: paginationModel.page,
        size: paginationModel.pageSize,
        search: debouncedSearch,
        searchDate: searchDateISO,
      });

      const response = await http.get(`${API_BASE}/movimientos`, {
        headers,
        params,
      });

      console.log("📊 Datos recibidos del backend:", response.data);

      // Manejar respuesta paginada del backend
      if (
        response.data &&
        typeof response.data === "object" &&
        "content" in response.data
      ) {
        setMovimientos(response.data.content || []);
        setRowCount(response.data.totalElements || 0);
      } else {
        // Compatibilidad con respuesta directa
        const data = Array.isArray(response.data) ? response.data : [];
        setMovimientos(data);
        setRowCount(data.length);
      }
    } catch (error) {
      console.error("Error cargando movimientos:", error);
      // Si falla (por ejemplo, fecha inválida), dejamos la tabla vacía sin alertas
      setMovimientos([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    currency,
    paginationModel,
    debouncedSearch,
    searchDateISO,
    fechaDesde,
    fechaHasta,
    montoDesde,
    montoHasta,
    parseMontoInput,
  ]);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    cargarMovimientos();
    cargarRolUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recargar cuando cambie la paginación
  useEffect(() => {
    if (initializedRef.current) {
      cargarMovimientos();
    }
  }, [cargarMovimientos]);

  // Abrir dialog para VER movimiento
  const handleVerMovimiento = (movimiento) => {
    setSelectedMovimiento(movimiento);
    setDialogMode("view");
    setDialogOpen(true);
  };

  // Abrir dialog para EDITAR movimiento
  const handleEditarMovimiento = (movimiento) => {
    setSelectedMovimiento(movimiento);

    // Convertir datos del movimiento al formato que esperan los formularios
    // El tipo se mantiene en selectedMovimiento para determinar qué formulario renderizar
    const formDataConvertido = {
      montoTotal: movimiento.montoTotal || "",
      moneda: movimiento.moneda || "ARS", // Valor por defecto para moneda
      fechaEmision: movimiento.fechaEmision
        ? dayjs(movimiento.fechaEmision)
        : null,
      categoria: movimiento.categoria || "",
      origenNombre: movimiento.origenNombre || "",
      origenCuit: movimiento.origenCuit || "",
      destinoNombre: movimiento.destinoNombre || "",
      destinoCuit: movimiento.destinoCuit || "",
      descripcion: movimiento.descripcion || "",
      medioPago: movimiento.medioPago || "", // Mantener string vacío para el formulario
      estado: movimiento.estado || "",
      // NO incluir 'tipo' aquí para que no se pueda modificar en el formulario
    };

    console.log("📝 Datos convertidos para edición:", formDataConvertido);
    setFormData(formDataConvertido);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  useEffect(() => {
    if (!pendingEditId || loading) return;
    const targetMovimiento = movimientos.find(
      (movimiento) => String(movimiento.id) === String(pendingEditId),
    );
    if (targetMovimiento) {
      handleEditarMovimiento(targetMovimiento);
      setPendingEditId(null);
      clearDeepLink();
    } else {
      setSnackbar({
        open: true,
        message: "No se encontro el movimiento para editar.",
        severity: "error",
      });
      setPendingEditId(null);
      clearDeepLink();
    }
  }, [pendingEditId, movimientos, loading, clearDeepLink]);

  useEffect(() => {
    if (dialogOpen && dialogMode === "edit") {
      const timer = setTimeout(() => {
        const firstField = dialogContentRef.current?.querySelector(
          "input, textarea, [tabindex='0']",
        );
        if (firstField && typeof firstField.focus === "function") {
          firstField.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dialogOpen, dialogMode]);

  const validarCamposObligatorios = () => {
    const tipoMovimiento = selectedMovimiento?.tipo || "Movimiento";
    const requiredFields =
      requiredFieldsMap[tipoMovimiento] || requiredFieldsMap["Movimiento"];
    const newErrors = {};

    requiredFields.forEach((field) => {
      const value = formData[field];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        newErrors[field] = "Campo obligatorio";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGuardarCambios = async () => {
    if (!validarCamposObligatorios()) {
      alert("⚠️ Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      const usuarioSub = sessionStorage.getItem("sub");
      const headers = { "X-Usuario-Sub": usuarioSub };

      // Convertir datos del formulario al formato del backend
      // IMPORTANTE: Incluir el tipo del selectedMovimiento para que no se envíe vacío
      const { tipo, ...formDataSinTipo } = formData;

      const datosParaBackend = {
        ...formDataSinTipo,
        tipo: selectedMovimiento.tipo,
        fechaEmision: formData.fechaEmision
          ? formData.fechaEmision.format("YYYY-MM-DDTHH:mm:ss")
          : null,
        // Limpiar campos vacíos que pueden causar problemas con enums
        medioPago:
          formData.medioPago && formData.medioPago.trim() !== ""
            ? formData.medioPago
            : null,
        categoria:
          formData.categoria && formData.categoria.trim() !== ""
            ? formData.categoria
            : null,
        origenNombre:
          formData.origenNombre && formData.origenNombre.trim() !== ""
            ? formData.origenNombre
            : null,
        origenCuit:
          formData.origenCuit && formData.origenCuit.trim() !== ""
            ? formData.origenCuit
            : null,
        destinoNombre:
          formData.destinoNombre && formData.destinoNombre.trim() !== ""
            ? formData.destinoNombre
            : null,
        destinoCuit:
          formData.destinoCuit && formData.destinoCuit.trim() !== ""
            ? formData.destinoCuit
            : null,
        descripcion:
          formData.descripcion && formData.descripcion.trim() !== ""
            ? formData.descripcion
            : null,
        estado:
          formData.estado && formData.estado.trim() !== ""
            ? formData.estado
            : null,
      };

      console.log("📤 Enviando datos al backend:", datosParaBackend);

      await http.put(
        `${API_BASE}/movimientos/${selectedMovimiento.id}`,
        datosParaBackend,
        { headers },
      );
      setSuccessSnackbar({
        open: true,
        message: "Movimiento actualizado correctamente.",
      });
      setDialogOpen(false);
      setErrors({});
      cargarMovimientos();
    } catch (error) {
      console.error("Error actualizando movimiento:", error);
      console.error("Datos enviados:", formData);
      alert(
        "❌ Error al actualizar: " +
        (error.response?.data?.mensaje || error.message),
      );
    }
  };

  const handleEliminarClick = (movimiento) => {
    setMovimientoToDelete(movimiento);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmarEliminacion = async () => {
    try {
      const usuarioSub = sessionStorage.getItem("sub");
      const headers = { "X-Usuario-Sub": usuarioSub };

      await http.delete(`${API_BASE}/movimientos/${movimientoToDelete.id}`, {
        headers,
      });
      setSuccessSnackbar({
        open: true,
        message: "Movimiento eliminado correctamente.",
      });
      setDeleteConfirmOpen(false);
      setMovimientoToDelete(null);
      cargarMovimientos();
    } catch (error) {
      console.error("Error eliminando movimiento:", error);
      alert(
        "❌ Error al eliminar: " +
        (error.response?.data?.mensaje || error.message),
      );
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMovimiento(null);
    setFormData({});
    setErrors({});
  };

  const handleCloseSnackbar = (_event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const renderFormularioMovimiento = () => {
    if (!selectedMovimiento) return null;

    if (dialogMode === "view") {
      const tipoUpper = selectedMovimiento.tipo?.toUpperCase();
      console.log("🔍 Tipo normalizado:", tipoUpper);

      switch (tipoUpper) {
        case "INGRESO":
          return <VerIngreso movimiento={selectedMovimiento} />;
        case "EGRESO":
          return <VerEgreso movimiento={selectedMovimiento} />;
        case "DEUDA":
          return <VerDeuda movimiento={selectedMovimiento} />;
        case "ACREENCIA":
          return <VerAcreencia movimiento={selectedMovimiento} />;
        default:
          console.error(
            "❌ Tipo de movimiento no reconocido:",
            selectedMovimiento.tipo,
          );
          return (
            <Box sx={{ p: 2 }}>
              <Typography color="error">
                Visualización no disponible para este tipo de movimiento: "
                {selectedMovimiento.tipo}"
              </Typography>
              <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                Tipos soportados: INGRESO, EGRESO, DEUDA, ACREENCIA
              </Typography>
            </Box>
          );
      }
    }

    const movimientoConFechaConvertida = {
      ...selectedMovimiento,
      fechaEmision: selectedMovimiento.fechaEmision
        ? typeof selectedMovimiento.fechaEmision === "string"
          ? dayjs(selectedMovimiento.fechaEmision)
          : selectedMovimiento.fechaEmision
        : null,
    };

    const tipoUpperEdit = selectedMovimiento.tipo?.toUpperCase();

    switch (tipoUpperEdit) {
      case "INGRESO":
        return (
          <FormIngreso
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            modoEdicion={dialogMode === "edit"}
            movimientoOriginal={movimientoConFechaConvertida}
          />
        );
      case "EGRESO":
        return (
          <FormEgreso
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            modoEdicion={dialogMode === "edit"}
            movimientoOriginal={movimientoConFechaConvertida}
          />
        );
      case "DEUDA":
        return (
          <FormDeuda
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            modoEdicion={dialogMode === "edit"}
            movimientoOriginal={movimientoConFechaConvertida}
          />
        );
      case "ACREENCIA":
        return (
          <FormAcreencia
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            modoEdicion={dialogMode === "edit"}
            movimientoOriginal={movimientoConFechaConvertida}
          />
        );
      default:
        console.error(
          "❌ Formulario no disponible para tipo:",
          selectedMovimiento.tipo,
        );
        return (
          <Box sx={{ p: 2 }}>
            <Typography color="error">
              Formulario no disponible para este tipo de movimiento: "
              {selectedMovimiento.tipo}"
            </Typography>
          </Box>
        );
    }
  };

  const COLOR_INGRESO = "#2e7d32";
  const COLOR_EGRESO = "#d32f2f";
  const COLOR_DEUDA = "#1565c0";
  const COLOR_ACREENCIA = "#ed6c02";

  const getTipoColor = (tipo) => {
    if (tipo === "Ingreso") return COLOR_INGRESO;
    if (tipo === "Egreso") return COLOR_EGRESO;
    if (tipo === "Deuda") return COLOR_DEUDA;
    if (tipo === "Acreencia") return COLOR_ACREENCIA;
    return "#757575";
  };

  const getTipoIcon = (tipo) => {
    if (tipo === "Ingreso") return <TrendingUpIcon fontSize="small" />;
    if (tipo === "Egreso") return <TrendingDownIcon fontSize="small" />;
    if (tipo === "Deuda") return <AccountBalanceIcon fontSize="small" />;
    if (tipo === "Acreencia") return <WalletIcon fontSize="small" />;
    return null;
  };

  const getMonedaColor = (moneda) => {
    if (moneda === "ARS") return "#1976d2";
    if (moneda === "USD") return "#2e7d32";
    if (moneda === "EUR") return "#ed6c02";
    return "#757575";
  };

  const buildExportParams = () => ({
    page: 0,
    size: Math.max(rowCount || movimientos.length || 500, 500),
    sortBy: "fechaEmision",
    sortDir: "desc",
    search: searchDateISO ? undefined : debouncedSearch || undefined,
    searchDate: searchDateISO || undefined,
    montoMin: parseMontoInput(montoDesde) ?? undefined,
    montoMax: parseMontoInput(montoHasta) ?? undefined,
    fechaDesde: fechaDesde ? dayjs(fechaDesde).format("YYYY-MM-DD") : undefined,
    fechaHasta: fechaHasta ? dayjs(fechaHasta).format("YYYY-MM-DD") : undefined,
    moneda: currency,
  });

  const fetchMovimientosParaExportar = async () => {
    const usuarioSub = sessionStorage.getItem("sub");
    if (!usuarioSub) {
      alert("No se encontró usuario en la sesión.");
      return [];
    }

    const headers = { "X-Usuario-Sub": usuarioSub };
    const params = buildExportParams();

    try {
      const response = await http.get(`${API_BASE}/movimientos`, {
        headers,
        params,
      });
      if (
        response.data &&
        typeof response.data === "object" &&
        "content" in response.data
      ) {
        return response.data.content || [];
      }
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error al exportar movimientos:", error);
      alert("No se pudieron obtener los movimientos para exportar.");
      return [];
    }
  };

  // Formatear fecha (solo día/mes/año)
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    try {
      if (Array.isArray(fecha)) {
        const [year, month, day] = fecha;
        return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
      }
      const d = dayjs(fecha);
      if (!d.isValid()) return "-";
      return d.format("DD/MM/YYYY");
    } catch (e) {
      return "-";
    }
  };

  const formatearMonto = (monto, moneda = "ARS") => {
    if (monto === null || monto === undefined) return "$0";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: moneda === "USD" ? "USD" : moneda === "EUR" ? "EUR" : "ARS",
      minimumFractionDigits: 2,
    }).format(Math.abs(monto));
  };

  const paginationMode = "server";

  // Definir columnas para DataGrid
  const columns = useMemo(() => {
    const tipoColumn = {
      field: "tipo",
      headerName: "Tipo",
      flex: 0.8,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const tipo = params.value;
        if (!tipo)
          return <Chip label="Sin tipo" size="small" sx={{ height: "24px" }} />;
        const icon = getTipoIcon(tipo);
        const color = getTipoColor(tipo);
        return (
          <Chip
            icon={icon}
            label={tipo}
            size="small"
            sx={{
              backgroundColor: `${color}15`,
              color: color,
              fontWeight: 600,
              border: `1px solid ${color}`,
              fontSize: "0.8125rem",
              height: "24px",
            }}
          />
        );
      },
    };

    const montoColumn = {
      field: "montoTotal",
      headerName: "Monto",
      flex: 0.8,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const monto = params.row.montoTotal || 0;
        const moneda = params.row.moneda || "ARS";
        const tipo = params.row.tipo;
        const multiplicador = tipo === "Egreso" ? -1 : 1;
        const valor = monto * multiplicador;
        const color =
          tipo === "Ingreso"
            ? COLOR_INGRESO
            : tipo === "Egreso"
              ? COLOR_EGRESO
              : tipo === "Deuda"
                ? COLOR_DEUDA
                : tipo === "Acreencia"
                  ? COLOR_ACREENCIA
                  : "#424242";
        const signo = tipo === "Egreso" && valor !== 0 ? "-" : "";
        const valorAbs = Math.abs(valor);
        const isInteger = Number.isInteger(valorAbs);
        const formatted = new Intl.NumberFormat("es-AR", {
          minimumFractionDigits: isInteger ? 0 : 2,
          maximumFractionDigits: 2,
        }).format(valorAbs);

        return (
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ lineHeight: "24px", color }}
          >
            {`${signo}${new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2 }).format(Math.abs(valor))} ${moneda}`}
          </Typography>
        );
      },
    };

    const fechaColumn = {
      field: "fechaEmision",
      headerName: "Fecha",
      flex: 0.7,
      minWidth: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ lineHeight: "24px" }}>
          {formatearFecha(params.value)}
        </Typography>
      ),
    };

    const estadoColumn = {
      field: "estado",
      headerName: "Estado",
      flex: 0.8,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      hide: true,
      renderCell: (params) => {
        if (!params.value)
          return (
            <Typography variant="body2" sx={{ lineHeight: "24px" }}>
              -
            </Typography>
          );
        const estado = params.value;
        const getEstadoColor = () => {
          if (params.row.tipo === "Ingreso") return COLOR_INGRESO;
          if (params.row.tipo === "Egreso") return COLOR_EGRESO;
          if (params.row.tipo === "Deuda") return COLOR_DEUDA;
          if (params.row.tipo === "Acreencia") return COLOR_ACREENCIA;
          if (estado === "COBRADO" || estado === "PAGADO") return "#4caf50";
          if (estado === "PENDIENTE") return "#ff9800";
          if (estado === "VENCIDO") return "#d32f2f";
          if (estado === "PARCIAL") return "#2196f3";
          return "#757575";
        };
        return (
          <Chip
            label={estado}
            size="small"
            sx={{
              backgroundColor: `${getEstadoColor()}15`,
              color: getEstadoColor(),
              fontWeight: 600,
              border: `1px solid ${getEstadoColor()}`,
              height: "24px",
            }}
          />
        );
      },
    };

    const categoriaColumn = {
      field: "categoria",
      headerName: "Categoría",
      flex: 1,
      minWidth: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        if (!params.value)
          return (
            <Typography variant="body2" sx={{ lineHeight: "24px" }}>
              -
            </Typography>
          );
        return (
          <Chip
            label={params.value}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ fontSize: "0.75rem", height: "24px" }}
          />
        );
      },
    };

    const origenColumn = {
      field: "origenNombre",
      headerName: "Origen",
      flex: 1,
      minWidth: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        return (
          <Typography variant="body2" sx={{ lineHeight: "24px" }}>
            {params.value || "-"}
          </Typography>
        );
      },
    };

    const destinoColumn = {
      field: "destinoNombre",
      headerName: "Destino",
      flex: 1,
      minWidth: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        return (
          <Typography variant="body2" sx={{ lineHeight: "24px" }}>
            {params.value || "-"}
          </Typography>
        );
      },
    };

    const descripcionColumn = {
      field: "descripcion",
      headerName: "Descripción",
      flex: 1.2,
      minWidth: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        return (
          <Typography variant="body2" sx={{ lineHeight: "24px" }}>
            {params.value || "-"}
          </Typography>
        );
      },
    };

    const accionesColumn = {
      field: "acciones",
      headerName: "Acciones",
      flex: 1,
      minWidth: 140,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const isAdmin = (usuarioRol || "").toUpperCase().includes("ADMIN");
        return (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton
              size="small"
              color="info"
              onClick={() => handleVerMovimiento(params.row)}
              title="Ver detalles"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
            {isAdmin && (
              <>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleEditarMovimiento(params.row)}
                  title="Editar"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleEliminarClick(params.row)}
                  title="Eliminar"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
        );
      },
    };

    if (isMobile) return [montoColumn, accionesColumn];

    return [
      tipoColumn,
      montoColumn,
      fechaColumn,
      estadoColumn,
      categoriaColumn,
      origenColumn,
      destinoColumn,
      descripcionColumn,
      accionesColumn,
    ];
  }, [isMobile, usuarioRol, currency]);

  const exportColumns = React.useMemo(
    () => columns.filter((col) => col.field !== "acciones"),
    [columns],
  );

  const formatValorExport = (row, field) => {
    if (field === "montoTotal") {
      const tipo = row.tipo || "";
      const moneda = row.moneda || "ARS";
      const multiplicador = tipo === "Egreso" ? -1 : 1;
      const valor = Number(row.montoTotal || 0) * multiplicador;
      const signo = valor < 0 ? "-" : "";
      return `${signo}${new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 2,
      }).format(Math.abs(valor))} ${moneda}`;
    }

    if (field === "fechaEmision") {
      return formatearFecha(row.fechaEmision);
    }

    const value = row[field];
    if (value === null || value === undefined) return "-";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const handleExportExcel = async () => {
    const registros = await fetchMovimientosParaExportar();
    if (!registros.length) return;

    const headers = exportColumns.map((c) => c.headerName);
    const excelData = [
      headers,
      ...registros.map((row) =>
        exportColumns.map((c) => formatValorExport(row, c.field)),
      ),
    ];

    const colsConfig = exportColumns.map(() => ({ wch: 18 }));

    exportToExcel(excelData, "Movimientos", "Movimientos", colsConfig, [], [], {
      headerRows: [0],
      zebra: true,
      freezePane: { rowSplit: 1, colSplit: 1 },
    });
  };

  const handleExportPdf = async () => {
    const registros = await fetchMovimientosParaExportar();
    if (!registros.length) return;

    const head = [exportColumns.map((c) => c.headerName)];
    const body = registros.map((row) =>
      exportColumns.map((c) => formatValorExport(row, c.field)),
    );

    const categorias = new Set(
      registros.map((r) => r.categoria).filter(Boolean),
    );

    await exportPdfReport({
      title: "Movimientos financieros",
      subtitle: "Exportación",
      charts: [],
      table: { head, body },
      fileName: "Movimientos",
      footerOnFirstPage: false,
      cover: {
        show: true,
        subtitle: "Listado actualizado",
        logo: logoDataUrl,
        meta: [
          { label: "Registros", value: registros.length },
          { label: "Columnas", value: exportColumns.length },
          { label: "Generado", value: new Date().toLocaleDateString("es-AR") },
        ],
        kpis: [
          { label: "Registros", value: registros.length.toString() },
          { label: "Categorias", value: categorias.size.toString() },
          { label: "Orden", value: "Fecha desc" },
        ],
        summary: ["Incluye filtros y rango de fechas aplicados."],
      },
    });
  };

  return (
    <Box
      sx={{
        width: "100%",
        px: { xs: 2, md: 3 },
        pt: { xs: 1.5, md: 2 },
        pb: 3,
      }}
    >
      <CurrencyTabs
        value={currency}
        onChange={handleCurrencyChange}
        sx={{ justifyContent: "center", mb: 1.5 }}
      />
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ mb: 2, fontWeight: 600, color: "text.primary" }}
      >
        Movimientos Financieros
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <TextField
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Buscar"
          size="small"
          InputProps={{
            startAdornment: (
              <SearchRoundedIcon
                fontSize="small"
                sx={{ color: "text.secondary", mr: 0.5 }}
              />
            ),
          }}
          sx={{ minWidth: 280, maxWidth: 420, flex: "1 1 280px" }}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Desde"
            value={fechaDesde ? dayjs(fechaDesde) : null}
            format="DD/MM/YYYY"
            onChange={(newValue) => setFechaDesde(newValue)}
            slotProps={{
              textField: {
                size: "small",
                placeholder: "dd/mm/aaaa",
                sx: (theme) => ({
                  borderRadius: "8px",
                  backgroundColor: theme.vars
                    ? `rgba(${theme.vars.palette.background.paperChannel} / 1)`
                    : theme.palette.background.paper,
                  "& .MuiInputBase-input": {
                    color: theme.vars
                      ? `rgba(${theme.vars.palette.text.primaryChannel} / 1)`
                      : theme.palette.text.primary,
                    "&::placeholder": {
                      color: theme.vars
                        ? `rgba(${theme.vars.palette.text.secondaryChannel} / 1)`
                        : theme.palette.text.secondary,
                      opacity: 0.8,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: theme.vars
                      ? `rgba(${theme.vars.palette.text.secondaryChannel} / 1)`
                      : theme.palette.text.secondary,
                  },
                }),
              },
              openPickerButton: {
                size: "small",
                sx: {
                  p: 0.5,
                  border: "none",
                  backgroundColor: "transparent",
                  "&:hover": { backgroundColor: "transparent" },
                },
              },
              openPickerIcon: { sx: { fontSize: 18 } },
            }}
            sx={{ width: 150, flex: "0 0 140px" }}
          />
          <DatePicker
            label="Hasta"
            value={fechaHasta ? dayjs(fechaHasta) : null}
            format="DD/MM/YYYY"
            onChange={(newValue) => setFechaHasta(newValue)}
            slotProps={{
              textField: {
                size: "small",
                placeholder: "dd/mm/aaaa",
                sx: (theme) => ({
                  borderRadius: "8px",
                  backgroundColor: theme.vars
                    ? `rgba(${theme.vars.palette.background.paperChannel} / 1)`
                    : theme.palette.background.paper,
                  "& .MuiInputBase-input": {
                    color: theme.vars
                      ? `rgba(${theme.vars.palette.text.primaryChannel} / 1)`
                      : theme.palette.text.primary,
                    "&::placeholder": {
                      color: theme.vars
                        ? `rgba(${theme.vars.palette.text.secondaryChannel} / 1)`
                        : theme.palette.text.secondary,
                      opacity: 0.8,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: theme.vars
                      ? `rgba(${theme.vars.palette.text.secondaryChannel} / 1)`
                      : theme.palette.text.secondary,
                  },
                }),
              },
              openPickerButton: {
                size: "small",
                sx: {
                  p: 0.5,
                  border: "none",
                  backgroundColor: "transparent",
                  "&:hover": { backgroundColor: "transparent" },
                },
              },
              openPickerIcon: { sx: { fontSize: 18 } },
            }}
            sx={{ width: 140, flex: "0 0 140px" }}
          />
        </LocalizationProvider>
        <CustomSelect
          name="montoRange"
          value={montoRangeLabel}
          onChange={(value) => {
            setMontoRangeLabel(value);
            if (!value) {
              setMontoDesde("");
              setMontoHasta("");
              return;
            }
            const numbers = value.match(/[\d.,]+/g) || [];
            const [minRaw, maxRaw] = numbers;
            const parseNumber = (txt) =>
              parseFloat(txt.replace(/\./g, "").replace(/,/g, "."));
            const minVal = parseNumber(minRaw ?? "0");
            const maxVal = parseNumber(maxRaw ?? "0");
            setMontoDesde(Number.isFinite(minVal) ? minVal.toString() : "");
            setMontoHasta(Number.isFinite(maxVal) ? maxVal.toString() : "");
          }}
          options={montoRangeOptions}
          width="180px"
        />
        {(fechaDesde || fechaHasta || montoDesde || montoHasta || montoRangeLabel) && (
          <Button
            size="small"
            variant="text"
            onClick={() => {
              setFechaDesde(null);
              setFechaHasta(null);
              setMontoDesde("");
              setMontoHasta("");
              setMontoRangeLabel("");
            }}
            sx={{ ml: { xs: 0, md: "auto" } }}
          >
            Limpiar
          </Button>
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            ml: { xs: 0, md: "auto" },
            flexWrap: "wrap",
          }}
        >
          <Button variant="contained" onClick={() => navigate("/carga")}>
            Cargar movimiento
          </Button>
          <ExportadorSimple
            onExportPdf={handleExportPdf}
            onExportExcel={handleExportExcel}
          />
        </Box>
      </Box>

      <Box sx={{ width: "100%" }}>
        <DataGrid
          rows={movimientos}
          columns={columns}
          loading={loading}
          autoHeight
          // Paginación del servidor
          paginationMode={paginationMode}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowCount={rowCount}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            sorting: { sortModel: [{ field: "fechaEmision", sort: "desc" }] },
            columns: { columnVisibilityModel: { estado: false } },
          }}
          slots={{
            toolbar: GridToolbar,
            loadingOverlay: () => (
              <LinearProgress
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1,
                  height: 4,
                  borderRadius: 0,
                }}
              />
            ),
            noRowsOverlay: () => <CustomNoRowsOverlay message="No se encontraron movimientos registrados" />,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          localeText={{
            columnMenuSortAsc: "Ordenar Ascendente",
            columnMenuSortDesc: "Ordenar Descendente",
            columnMenuFilter: "Filtrar",
            columnMenuHideColumn: "Ocultar columna",
            columnMenuManageColumns: "Administrar columnas",
          }}
          disableRowSelectionOnClick
          sx={{
            backgroundColor: "background.paper",
            borderRadius: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            "& .MuiDataGrid-cell": {
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
              display: "flex",
              alignItems: "center",
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
            "& .MuiDataGrid-columnHeader:first-of-type": { borderLeft: "none" },
            "& .MuiDataGrid-columnHeader:last-of-type": { borderRight: "none" },
            "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
            "& .MuiDataGrid-columnSeparator": {
              opacity: 1,
              visibility: "visible",
              color: "#d5d5d5",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.02)",
            },
            "& .MuiDataGrid-sortIcon": { display: "none" },
            "& .MuiDataGrid-columnHeaderTitleContainer": {
              paddingRight: "8px",
              display: "flex",
              alignItems: "center",
            },
            "& .MuiDataGrid-iconButtonContainer": {
              visibility: "hidden",
            },
            "& .MuiDataGrid-columnHeader:hover .MuiDataGrid-iconButtonContainer":
            {
              visibility: "visible",
            },
            "& .MuiDataGrid-columnHeader .MuiDataGrid-iconButtonContainer .MuiIconButton-root:not([aria-label*='menu'])":
            {
              display: "none",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: (theme) => theme.palette.action.hover,
            },
            "& .MuiDataGrid-row.Mui-selected": {
              backgroundColor: (theme) =>
                `${theme.palette.primary.main}15 !important`,
              "&:hover": {
                backgroundColor: (theme) =>
                  `${theme.palette.primary.main}25 !important`,
              },
            },
          }}
        />
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {dialogMode === "edit"
            ? "Editar movimiento"
            : "Detalle de movimiento"}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }} ref={dialogContentRef}>
          {selectedMovimiento && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                width: "100%",
              }}
            >
              {renderFormularioMovimiento()}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            {dialogMode === "edit" ? "Cancelar" : "Cerrar"}
          </Button>
          {dialogMode === "edit" && (
            <Button onClick={handleGuardarCambios} variant="contained">
              Guardar cambios
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>⚠️ Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ¿Estás seguro que deseas eliminar este movimiento?
          </Alert>
          {movimientoToDelete && (
            <Box>
              <Typography variant="body2">
                <strong>Tipo:</strong> {movimientoToDelete.tipo}
              </Typography>
              <Typography variant="body2">
                <strong>Monto:</strong>{" "}
                {formatearMonto(
                  movimientoToDelete.montoTotal,
                  movimientoToDelete.moneda,
                )}
              </Typography>
              <Typography variant="body2">
                <strong>Fecha:</strong>{" "}
                {formatearFecha(movimientoToDelete.fechaEmision)}
              </Typography>
            </Box>
          )}
          <Alert severity="error" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirmarEliminacion}
            variant="contained"
            color="error"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <SuccessSnackbar
        open={successSnackbar.open}
        message={successSnackbar.message}
        onClose={() => setSuccessSnackbar({ open: false, message: "" })}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
