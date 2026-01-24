import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Box, Typography, Chip, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, Grid, TextField, Alert, FormLabel, FormHelperText, OutlinedInput, Snackbar, LinearProgress
} from "@mui/material";
import { useTheme, useMediaQuery } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import WalletIcon from "@mui/icons-material/Wallet";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import axios from "axios";
import API_CONFIG from "../../config/api-config";
import CustomSelect from "../../shared-components/CustomSelect";
import CustomDatePicker from "../../shared-components/CustomDatePicker";
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

export default function TablaRegistrosV2() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  // Paginación del servidor
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [rowCount, setRowCount] = useState(0);
  
  const [usuarioRol, setUsuarioRol] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("view"); // "view" o "edit"
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [movimientoToDelete, setMovimientoToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [successSnackbar, setSuccessSnackbar] = useState({ open: false, message: "" });
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingEditId, setPendingEditId] = useState(null);
  const dialogContentRef = useRef(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchText.trim().toLowerCase()), 250);
    return () => clearTimeout(handler);
  }, [searchText]);

  useEffect(() => {
    // Cuando se busca, siempre arrancar desde la primera página para evitar resultados vacíos
    setPaginationModel((prev) => (prev.page === 0 ? prev : { ...prev, page: 0 }));
  }, [debouncedSearch]);

  const clearDeepLink = useCallback(() => {
    const hasQuery = searchParams.has("editMovementId");
    const state = location.state || {};
    const { editMovementId: _omitId, editMovementMeta: _omitMeta, ...restState } = state;
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
        state: hasStateLink ? (Object.keys(restState).length ? restState : undefined) : state,
      }
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
        headers: { "X-Usuario-Sub": sub }
      })
        .then(res => res.json())
        .then(data => setUsuarioRol(data.rol))
        .catch(err => console.error("Error cargando rol:", err));
    }
  };

  const cargarMovimientos = useCallback(async () => {
    setLoading(true);
    try {
      const usuarioSub = sessionStorage.getItem("sub");
      
      if (!usuarioSub) {
        console.error("No se encontró sub de usuario en la sesión");
        alert("Error: No se encontró usuario en la sesión");
        return;
      }

      const headers = { "X-Usuario-Sub": usuarioSub };
      const params = {
        page: paginationModel.page,
        size: paginationModel.pageSize,
        sortBy: "fechaEmision",
        sortDir: "desc"
      };

      console.log("📡 Obteniendo movimientos para usuario:", usuarioSub, "página:", paginationModel.page, "tamaño:", paginationModel.pageSize);
      
      const response = await axios.get(`${API_BASE}/movimientos`, { headers, params });
      
      console.log("📊 Datos recibidos del backend:", response.data);
      
      // Manejar respuesta paginada del backend
      if (response.data && typeof response.data === 'object' && 'content' in response.data) {
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
      alert("Error al cargar movimientos: " + (error.response?.data?.mensaje || error.message));
      setMovimientos([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [paginationModel]);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
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
      fechaEmision: movimiento.fechaEmision ? dayjs(movimiento.fechaEmision) : null,
      categoria: movimiento.categoria || "",
      origenNombre: movimiento.origenNombre || "",
      origenCuit: movimiento.origenCuit || "",
      destinoNombre: movimiento.destinoNombre || "",
      destinoCuit: movimiento.destinoCuit || "",
      descripcion: movimiento.descripcion || "",
      medioPago: movimiento.medioPago || "", // Mantener string vacío para el formulario
      estado: movimiento.estado || ""
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
      (movimiento) => String(movimiento.id) === String(pendingEditId)
    );
    if (targetMovimiento) {
      handleEditarMovimiento(targetMovimiento);
      setPendingEditId(null);
      clearDeepLink();
    } else {
      setSnackbar({ open: true, message: "No se encontro el movimiento para editar.", severity: "error" });
      setPendingEditId(null);
      clearDeepLink();
    }
  }, [pendingEditId, movimientos, loading, clearDeepLink]);

  useEffect(() => {
    if (dialogOpen && dialogMode === "edit") {
      const timer = setTimeout(() => {
        const firstField = dialogContentRef.current?.querySelector("input, textarea, [tabindex='0']");
        if (firstField && typeof firstField.focus === "function") {
          firstField.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dialogOpen, dialogMode]);

  // Función para validar campos obligatorios
  const validarCamposObligatorios = () => {
    const tipoMovimiento = selectedMovimiento?.tipo || "Movimiento";
    const requiredFields = requiredFieldsMap[tipoMovimiento] || requiredFieldsMap["Movimiento"];
    const newErrors = {};

    requiredFields.forEach((field) => {
      const value = formData[field];
      if (!value || (typeof value === 'string' && value.trim() === "")) {
        newErrors[field] = "Campo obligatorio";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar cambios al editar
  const handleGuardarCambios = async () => {
    // Validar campos obligatorios antes de enviar
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
        tipo: selectedMovimiento.tipo, // ✅ Usar el tipo original del movimiento
        // Preservar fecha y hora tal como se eligieron en el formulario
        fechaEmision: formData.fechaEmision
          ? formData.fechaEmision.format('YYYY-MM-DDTHH:mm:ss')
          : null,
        // Limpiar campos vacíos que pueden causar problemas con enums
        medioPago: formData.medioPago && formData.medioPago.trim() !== "" ? formData.medioPago : null,
        categoria: formData.categoria && formData.categoria.trim() !== "" ? formData.categoria : null,
        origenNombre: formData.origenNombre && formData.origenNombre.trim() !== "" ? formData.origenNombre : null,
        origenCuit: formData.origenCuit && formData.origenCuit.trim() !== "" ? formData.origenCuit : null,
        destinoNombre: formData.destinoNombre && formData.destinoNombre.trim() !== "" ? formData.destinoNombre : null,
        destinoCuit: formData.destinoCuit && formData.destinoCuit.trim() !== "" ? formData.destinoCuit : null,
        descripcion: formData.descripcion && formData.descripcion.trim() !== "" ? formData.descripcion : null,
        estado: formData.estado && formData.estado.trim() !== "" ? formData.estado : null
      };
      
      console.log("📤 Enviando datos al backend:", datosParaBackend);
      
      await axios.put(
        `${API_BASE}/movimientos/${selectedMovimiento.id}`,
        datosParaBackend,
        { headers }
      );
      setSuccessSnackbar({ open: true, message: "Movimiento actualizado correctamente." });
      setDialogOpen(false);
      setErrors({}); // Limpiar errores
      cargarMovimientos(); // Recargar datos
    } catch (error) {
      console.error("Error actualizando movimiento:", error);
      console.error("Datos enviados:", formData);
      alert("❌ Error al actualizar: " + (error.response?.data?.mensaje || error.message));
    }
  };

  // Abrir confirmación de eliminación
  const handleEliminarClick = (movimiento) => {
    setMovimientoToDelete(movimiento);
    setDeleteConfirmOpen(true);
  };

  // Confirmar eliminación
  const handleConfirmarEliminacion = async () => {
    try {
      const usuarioSub = sessionStorage.getItem("sub");
      const headers = { "X-Usuario-Sub": usuarioSub };
      
      await axios.delete(
        `${API_BASE}/movimientos/${movimientoToDelete.id}`,
        { headers }
      );
      setSuccessSnackbar({ open: true, message: "Movimiento eliminado correctamente." });
      setDeleteConfirmOpen(false);
      setMovimientoToDelete(null);
      cargarMovimientos(); // Recargar datos
    } catch (error) {
      console.error("Error eliminando movimiento:", error);
      alert("❌ Error al eliminar: " + (error.response?.data?.mensaje || error.message));
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMovimiento(null);
    setFormData({});
    setErrors({}); // Limpiar errores al cerrar
  };

  const handleCloseSnackbar = (_event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Función para renderizar el formulario correcto según el tipo de movimiento
  const renderFormularioMovimiento = () => {
    if (!selectedMovimiento) return null;

    console.log("🔍 Renderizando movimiento:", selectedMovimiento);
    console.log("🔍 Tipo de movimiento:", selectedMovimiento.tipo);
    console.log("🔍 Modo del diálogo:", dialogMode);

    // Si es modo "view", usar componentes de visualización
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
          console.error("❌ Tipo de movimiento no reconocido:", selectedMovimiento.tipo);
          return (
            <Box sx={{ p: 2 }}>
              <Typography color="error">
                Visualización no disponible para este tipo de movimiento: "{selectedMovimiento.tipo}"
              </Typography>
              <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                Tipos soportados: INGRESO, EGRESO, DEUDA, ACREENCIA
              </Typography>
            </Box>
          );
      }
    }

    // Si es modo "edit", usar formularios editables
    // Convertir fechaEmision a dayjs si es necesario
    const movimientoConFechaConvertida = {
      ...selectedMovimiento,
      fechaEmision: selectedMovimiento.fechaEmision 
        ? (typeof selectedMovimiento.fechaEmision === 'string' 
            ? dayjs(selectedMovimiento.fechaEmision) 
            : selectedMovimiento.fechaEmision)
        : null
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
        console.error("❌ Formulario no disponible para tipo:", selectedMovimiento.tipo);
        return (
          <Box sx={{ p: 2 }}>
            <Typography color="error">
              Formulario no disponible para este tipo de movimiento: "{selectedMovimiento.tipo}"
            </Typography>
          </Box>
        );
    }
  };

  // Helpers para chips estilizados
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

  // Formatear fecha (solo día/mes/año)
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    try {
      // Formato [YYYY, MM, DD] que puede venir del backend
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

  // Formatear monto
  const formatearMonto = (monto, moneda = "ARS") => {
    if (monto === null || monto === undefined) return "$0";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: moneda === "USD" ? "USD" : moneda === "EUR" ? "EUR" : "ARS",
      minimumFractionDigits: 2
    }).format(Math.abs(monto));
  };

  const filteredMovimientos = useMemo(() => {
    if (!debouncedSearch) return movimientos;
    const needle = debouncedSearch;
    const normalize = (value) =>
      (value ?? "")
        .toString()
        .toLowerCase();

    return movimientos.filter((mov) => {
      const campos = [
        mov.tipo,
        mov.categoria,
        mov.origenNombre,
        mov.destinoNombre,
        mov.descripcion,
        mov.moneda,
        mov.estado,
        mov.medioPago,
        mov.origenCuit,
        mov.destinoCuit,
        mov.origenCuenta,
        mov.destinoCuenta,
        mov.referencia,
        formatearFecha(mov.fechaEmision),
        formatearMonto(mov.montoTotal, mov.moneda),
      ];

      return campos.some((campo) => normalize(campo).includes(needle));
    });
  }, [debouncedSearch, movimientos]);

  const visibleRows = debouncedSearch ? filteredMovimientos : movimientos;
  const visibleRowCount = debouncedSearch ? filteredMovimientos.length : rowCount;
  const paginationMode = debouncedSearch ? "client" : "server";

  // Definir columnas para DataGrid
  const columns = useMemo(() => {
    const tipoColumn = {
      field: "tipo",
      headerName: "Tipo",
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => {
        const tipo = params.value;
        if (!tipo) return <Chip label="Sin tipo" size="small" sx={{ height: "24px" }} />;
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
              height: "24px", // Altura fija para alineación
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
        const signo =
          tipo === "Egreso" && valor !== 0
            ? "-"
            : "";
        return (
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ lineHeight: "24px", color }}
          >
            {`${signo}${new Intl.NumberFormat("es-AR", {
              minimumFractionDigits: 2,
            }).format(Math.abs(valor))} ${moneda}`}
          </Typography>
        );
      },
    };

    const fechaColumn = {
      field: "fechaEmision",
      headerName: "Fecha",
      flex: 0.7,
      minWidth: 110,
      renderCell: (params) => {
        return (
          <Typography variant="body2" sx={{ lineHeight: "24px" }}>
            {formatearFecha(params.value)}
          </Typography>
        );
      },
    };

    const estadoColumn = {
      field: "estado",
      headerName: "Estado",
      flex: 0.8,
      minWidth: 120,
      hide: true,
      renderCell: (params) => {
        if (!params.value) return <Typography variant="body2" sx={{ lineHeight: "24px" }}>-</Typography>;
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
              height: "24px", // Altura fija para alineación
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
      renderCell: (params) => {
        if (!params.value) return <Typography variant="body2" sx={{ lineHeight: "24px" }}>-</Typography>;
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
      renderCell: (params) => {
        return <Typography variant="body2" sx={{ lineHeight: "24px" }}>{params.value || "-"}</Typography>;
      },
    };

    const destinoColumn = {
      field: "destinoNombre",
      headerName: "Destino",
      flex: 1,
      minWidth: 130,
      renderCell: (params) => {
        return <Typography variant="body2" sx={{ lineHeight: "24px" }}>{params.value || "-"}</Typography>;
      },
    };

    const descripcionColumn = {
      field: "descripcion",
      headerName: "Descripción",
      flex: 1.2,
      minWidth: 150,
      renderCell: (params) => {
        return <Typography variant="body2" sx={{ lineHeight: "24px" }}>{params.value || "-"}</Typography>;
      },
    };

    const accionesColumn = {
      field: "acciones",
      headerName: "Acciones",
      flex: 1,
      minWidth: 140,
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

    if (isMobile) {
      return [tipoColumn, montoColumn, accionesColumn];
    }

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
  }, [isMobile, usuarioRol]);

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
        Movimientos Financieros
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <TextField
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Buscar por tipo, monto, fecha, descripcion, origen o destino"
          size="small"
          InputProps={{
            startAdornment: <SearchRoundedIcon fontSize="small" sx={{ color: "text.secondary", mr: 0.5 }} />,
          }}
          sx={{ minWidth: 260, maxWidth: 420 }}
        />
      </Box>

      <Box sx={{ height: 700, width: "100%" }}>
        <DataGrid
          rows={visibleRows}
          columns={columns}
          loading={loading}
          
          // Paginación del servidor (cambia a cliente cuando hay busqueda local)
          paginationMode={paginationMode}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowCount={visibleRowCount}
          pageSizeOptions={[10, 25, 50, 100]}
          
          initialState={{
            sorting: { sortModel: [{ field: "fechaEmision", sort: "desc" }] },
            columns: {
              columnVisibilityModel: {
                estado: false,
              },
            },
          }}
          slots={{ 
            toolbar: GridToolbar,
            loadingOverlay: () => (
              <LinearProgress 
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1,
                  height: 4,
                  borderRadius: 0
                }} 
              />
            )
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          disableRowSelectionOnClick
          autoHeight={false}
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #e0e0e0",
              borderRight: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center",
            },
            "& .MuiDataGrid-cell:last-of-type": {
              borderRight: "none",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f5f5f5",
              fontSize: "0.95rem",
              borderTop: "1px solid #e0e0e0",
              borderBottom: "1px solid #e0e0e0",
            },
            "& .MuiDataGrid-columnHeader": {
              borderLeft: "1px solid #e0e0e0",
              borderRight: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxSizing: "border-box",
            },
            "& .MuiDataGrid-columnHeader:first-of-type": {
              borderLeft: "none",
            },
            "& .MuiDataGrid-columnHeader:last-of-type": {
              borderRight: "none",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 700,
            },
            "& .MuiDataGrid-columnSeparator": {
              opacity: 1,
              visibility: "visible",
              color: "#d5d5d5",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.02)",
            },
            "& .MuiDataGrid-sortIcon": {
              display: "none",
            },
            "& .MuiDataGrid-columnHeaderTitleContainer": {
              paddingRight: "8px",
              display: "flex",
              alignItems: "center",
            },
            "& .MuiDataGrid-columnHeader .MuiDataGrid-iconButtonContainer": {
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
            "& .MuiDataGrid-columnHeader .MuiIconButton-root": {
              padding: "4px",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
            "& .MuiDataGrid-menuIcon": {
              fontSize: "16px",
              display: "block !important",
            },
            "& .MuiDataGrid-columnHeader .MuiDataGrid-iconButtonContainer .MuiIconButton-root:not([aria-label*='menu'])": {
              display: "none",
            },
          }}
        />
      </Box>

      {/* Dialog para VER o EDITAR - Estilo exacto del formulario original */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {dialogMode === "edit" ? "Editar movimiento" : "Detalle de movimiento"}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }} ref={dialogContentRef}>
          {selectedMovimiento && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
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

      {/* Dialog de confirmación para ELIMINAR */}
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
                <strong>Monto:</strong> {formatearMonto(movimientoToDelete.montoTotal, movimientoToDelete.moneda)}
              </Typography>
              <Typography variant="body2">
                <strong>Fecha:</strong> {formatearFecha(movimientoToDelete.fechaEmision)}
              </Typography>
            </Box>
          )}
          <Alert severity="error" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmarEliminacion} variant="contained" color="error">
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
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
