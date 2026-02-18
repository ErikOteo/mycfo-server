import * as React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  Tooltip,
  Pagination,
  CircularProgress,
  Divider,
  useMediaQuery,
  InputAdornment,
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import { alpha, useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import http from "../../../api/http";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import API_CONFIG from "../../../config/api-config";
import LoadingSpinner from "../../../shared-components/LoadingSpinner";
import CurrencyTabs, { usePreferredCurrency } from "../../../shared-components/CurrencyTabs";
import { matchesCurrencyFilter } from "../utils/currencyTag";
import { useChatbotScreenContext } from "../../../shared-components/useChatbotScreenContext";
import CustomNoRowsOverlay from "../../../shared-components/CustomNoRowsOverlay";
import usePermisos from "../../../hooks/usePermisos";

const tableRowStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.02)",
  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.05)" },
};
const tableCellStyle = (theme) => ({
  border: `1px solid ${(theme.vars || theme).palette.divider}`,
});
const headerCellStyle = (theme) => ({
  ...tableCellStyle(theme),
  fontWeight: 600,
});
const getColumnWidth = (statusFilter) => ({
  nombre: { width: statusFilter === "deleted" ? "20%" : "25%" },
  desde: { width: statusFilter === "deleted" ? "20%" : "25%" },
  hasta: { width: statusFilter === "deleted" ? "20%" : "25%" },
  eliminado: { width: "20%" },
  acciones: { width: statusFilter === "deleted" ? "20%" : "25%" },
});
const monthLabels = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const pad2 = (value) => String(value).padStart(2, "0");
const lastDayOfMonth = (year, month) => new Date(year, month, 0).getDate();
const parseRetentionDays = () => {
  const raw = process.env.REACT_APP_PRESUPUESTO_RETENTION_DAYS;
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 90;
  }
  return parsed;
};
const formatDeletedAt = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return value;
  }
  return date.toLocaleString("es-AR", { hour12: false });
};
const PAGE_SIZE = 3;
const LARGE_PAGE_SIZE = 1000;
const DEFAULT_SORT = "createdAt,desc";
const createEmptyPage = () => ({
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: PAGE_SIZE,
});
const HeaderLabelAligned = ({ label, ghost }) => (
  <Box sx={{ position: "relative", display: "inline-flex" }}>
    <Box
      aria-hidden
      sx={{
        visibility: "hidden",
        pointerEvents: "none",
        display: "inline-flex",
        whiteSpace: "nowrap",
      }}
    >
      {ghost}
    </Box>
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Box>
  </Box>

);



// Estilos estáticos fuera del componente para evitar re-renders
// Se mantienen los bordes originales requeridos por el usuario
const dataGridStyles = {
  backgroundColor: "background.paper",
  borderRadius: 2,
  border: (theme) => `1px solid ${theme.palette.divider}`,
  "& .MuiDataGrid-cell": {
    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
    display: "flex",
    alignItems: "center",
    fontSize: "0.875rem",
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
  // Hide default footer since we use custom pagination below
  "& .MuiDataGrid-footerContainer": {
    display: "none"
  }
};

const CustomNoRowsPresupuestos = () => (
  <CustomNoRowsOverlay message="No se encontraron presupuestos registrados" />
);

const CustomNoSearchResults = () => (
  <CustomNoRowsOverlay message="No se encontraron coincidencias para tu búsqueda" />
);

export default function MainGrid() {
  const theme = useTheme();
  // Sidebar disappears on lg, so we consider "mobile" (no sidebar) as down('lg')
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const isLightMode = theme.palette.mode === "light";
  const paletteVars = theme.vars?.palette ?? theme.palette;
  const tabsLabelColor = isLightMode
    ? (paletteVars.text?.primary ?? "#000")
    : (paletteVars.common?.white ?? "#fff");
  const darkActionButtonSx = isLightMode ? undefined : { color: "#42897f" };
  const navigate = useNavigate();
  const baseURL = API_CONFIG.PRONOSTICO;
  const retentionDays = React.useMemo(() => parseRetentionDays(), []);
  const [statusFilter, setStatusFilter] = React.useState("active");
  const [pageIndex, setPageIndex] = React.useState(0);
  const { tienePermiso } = usePermisos();
  const canEdit = tienePermiso('pres', 'edit');
  const [presupuestosPage, setPresupuestosPage] =
    React.useState(createEmptyPage);
  const [hasActiveSearch, setHasActiveSearch] = React.useState(false);
  const [searchPage, setSearchPage] = React.useState(null);
  const [searchPageIndex, setSearchPageIndex] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState({
    year: "",
    fromMonth: "",
    toMonth: "",
  });
  const [searchError, setSearchError] = React.useState("");
  const [listError, setListError] = React.useState("");
  const [loadingSearch, setLoadingSearch] = React.useState(false);
  const [loadingAll, setLoadingAll] = React.useState(false);
  const [confirmDialog, setConfirmDialog] = React.useState({
    open: false,
    presupuesto: null,
  });
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    action: null,
  });
  const [currency, setCurrency] = usePreferredCurrency("ARS");
  const [deletingId, setDeletingId] = React.useState(null);
  const [menuState, setMenuState] = React.useState({
    anchorEl: null,
    presupuesto: null,
  });
  const [yearOptions, setYearOptions] = React.useState(() => {
    const current = new Date().getFullYear();
    return [current - 1, current, current + 1];
  });
  const searchParamsRef = React.useRef("");
  const lastDeletedRef = React.useRef(null);
  const [usuarioRol, setUsuarioRol] = React.useState(null);
  const monthName = React.useCallback((ym) => {
    if (!ym) return "";
    const [anio, mes] = ym.split("-");
    const idx = Number(mes) - 1;
    return idx >= 0 && idx < monthLabels.length
      ? `${monthLabels[idx]} ${anio}`
      : ym;
  }, []);

  const activePage = React.useMemo(() => {
    if (hasActiveSearch && searchPage) {
      return searchPage;
    }
    return presupuestosPage;
  }, [hasActiveSearch, searchPage, presupuestosPage]);

  const activeRows = React.useMemo(() => {
    const rows = Array.isArray(activePage?.content) ? activePage.content : [];
    return rows;
  }, [activePage]);

  const samplePresupuestos = React.useMemo(
    () =>
      activeRows.slice(0, 5).map((p) => ({
        id: p?.id ?? null,
        nombre: p?.nombre ?? null,
        desde: p?.desde ?? null,
        hasta: p?.hasta ?? null,
        estado: p?.estado ?? p?.status ?? null,
        eliminado: Boolean(p?.eliminado ?? p?.deleted),
        moneda: p?.moneda ?? null,
      })),
    [activeRows]
  );

  const chatbotContext = React.useMemo(
    () => ({
      screen: "presupuestos",
      statusFilter,
      pageIndex,
      query,
      filters,
      currency,
      totalPresupuestos: Number(activePage?.totalElements ?? 0),
      totalPaginas: Number(activePage?.totalPages ?? 0),
      muestra: samplePresupuestos,
    }),
    [
      statusFilter,
      pageIndex,
      query,
      filters,
      currency,
      activePage,
      samplePresupuestos,
    ]
  );

  useChatbotScreenContext(chatbotContext);

  const cargarRolUsuario = React.useCallback(() => {
    const sub = sessionStorage.getItem("sub");
    if (!sub) return;
    fetch(`${API_CONFIG.ADMINISTRACION}/api/usuarios/perfil`, {
      headers: { "X-Usuario-Sub": sub },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.rol) {
          setUsuarioRol(data.rol);
        }
      })
      .catch((err) => console.error("Error cargando rol de usuario:", err));
  }, []);
  const mergeYearOptions = React.useCallback((items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return;
    }
    setYearOptions((prev) => {
      const next = new Set(prev);
      items.forEach((item) => {
        const desdeYear = Number(item?.desde?.split("-")[0]);
        const hastaYear = Number(item?.hasta?.split("-")[0]);
        if (!Number.isNaN(desdeYear)) {
          next.add(desdeYear);
        }
        if (!Number.isNaN(hastaYear)) {
          next.add(hastaYear);
        }
      });
      return Array.from(next).sort((a, b) => a - b);
    });
  }, []);
  const normalizePage = React.useCallback((data) => {
    if (!data || typeof data !== "object") {
      return createEmptyPage();
    }
    const content = Array.isArray(data.content) ? data.content : [];
    const totalElementsRaw = Number(data.totalElements);
    const totalPagesRaw = Number(data.totalPages);
    const numberRaw = Number(data.number);
    const sizeRaw = Number(data.size);
    return {
      content,
      totalElements: Number.isFinite(totalElementsRaw)
        ? totalElementsRaw
        : content.length,
      totalPages: Number.isFinite(totalPagesRaw)
        ? totalPagesRaw
        : content.length > 0
          ? 1
          : 0,
      number: Number.isFinite(numberRaw) ? numberRaw : 0,
      size: Number.isFinite(sizeRaw) && sizeRaw > 0 ? sizeRaw : PAGE_SIZE,
    };
  }, []);
  const applyCurrencyFilter = React.useCallback((pageData) => {
    if (!pageData || !Array.isArray(pageData.content)) return pageData;
    const filtered = pageData.content.filter((p) => matchesCurrencyFilter(p?.nombre, currency));
    const totalElements = filtered.length;
    const totalPages = pageData.size ? Math.ceil(totalElements / pageData.size) : 0;
    return { ...pageData, content: filtered, totalElements, totalPages };
  }, [currency]);
  const fetchPresupuestos = React.useCallback(
    async (statusValue, pageValue) => {
      setLoadingAll(true);
      try {
        const effectivePage = Math.max(pageValue, 0);
        const effectiveSize = LARGE_PAGE_SIZE;
        const params = new URLSearchParams();
        params.set("status", statusValue);
        params.set("page", String(effectivePage));
        params.set("size", String(effectiveSize));
        params.set("sort", DEFAULT_SORT);
        if (currency) params.set("moneda", currency);
        const res = await http.get(
          `${baseURL}/api/presupuestos?${params.toString()}`,
        );
        const pageData = applyCurrencyFilter(normalizePage(res.data));
        if (
          pageValue > 0 &&
          pageData.totalPages > 0 &&
          pageValue >= pageData.totalPages
        ) {
          setPageIndex(pageData.totalPages - 1);
          return;
        }
        setPresupuestosPage(pageData);
        mergeYearOptions(pageData.content);
        setListError("");
      } catch (e) {
        console.error("Error cargando presupuestos desde el backend:", e);
        setPresupuestosPage(createEmptyPage());
        setListError(
          "No se pudo cargar la lista de presupuestos. Intenta nuevamente.",
        );
      } finally {
        setLoadingAll(false);
      }
    },
    [baseURL, mergeYearOptions, normalizePage, currency, applyCurrencyFilter],
  );
  const fetchSearchPresupuestos = React.useCallback(
    async (searchParamsString, statusValue, pageValue) => {
      setLoadingSearch(true);
      try {
        const params = new URLSearchParams(searchParamsString || "");
        params.set("status", statusValue);
        params.set("page", String(Math.max(pageValue, 0)));
        params.set("size", String(LARGE_PAGE_SIZE));
        params.set("sort", DEFAULT_SORT);
        if (currency) params.set("moneda", currency);
        const res = await http.get(
          `${baseURL}/api/presupuestos?${params.toString()}`,
        );
        let data = res.data;

        // Fallback: Filtrado local si el backend devuelve todo
        // Verificamos si hay un filtro de "nombre" en los parametros
        const nameFilter = params.get("nombre");
        if (nameFilter && Array.isArray(data.content)) {
          const lowerTerm = nameFilter.toLowerCase();
          const filteredContent = data.content.filter((item) => {
            const nombre = (item.nombre || "").toLowerCase();
            const desde = (item.desde || "").toLowerCase();
            const hasta = (item.hasta || "").toLowerCase();
            const desdeMes = monthName(item.desde || "").toLowerCase();
            const hastaMes = monthName(item.hasta || "").toLowerCase();
            return (
              nombre.includes(lowerTerm) ||
              desde.includes(lowerTerm) ||
              hasta.includes(lowerTerm) ||
              desdeMes.includes(lowerTerm) ||
              hastaMes.includes(lowerTerm)
            );
          });

          // Recalculamos totales si filtramos localmente
          // Nota: Esto es una aproximación, idealmente el backend debe filtrar.
          // Pero si el backend ignora el filtro, corregimos aquí.
          if (filteredContent.length !== data.content.length) {
            data = {
              ...data,
              content: filteredContent,
              totalElements: filteredContent.length,
              totalPages: data.size > 0 ? Math.ceil(filteredContent.length / data.size) : 1
            };
          }
        }

        const pageData = applyCurrencyFilter(normalizePage(data));
        if (
          pageValue > 0 &&
          pageData.totalPages > 0 &&
          pageValue >= pageData.totalPages
        ) {
          setSearchPageIndex(pageData.totalPages - 1);
          return;
        }
        setSearchPage(pageData);
        mergeYearOptions(pageData.content);
        setSearchError("");
      } catch (e) {
        console.error("Error cargando presupuestos desde el backend:", e);
        setSearchPage(createEmptyPage());
        setSearchError(
          "No se pudo cargar la lista filtrada. Intenta nuevamente.",
        );
      } finally {
        setLoadingSearch(false);
      }
    },
    [baseURL, mergeYearOptions, normalizePage, currency, applyCurrencyFilter],
  );
  React.useEffect(() => {
    fetchPresupuestos(statusFilter, pageIndex);
    cargarRolUsuario();
  }, [fetchPresupuestos, statusFilter, pageIndex, cargarRolUsuario]);
  const handleCurrencyChange = (next) => {
    if (!next) return;
    setCurrency(next);
    setPageIndex(0);
    setHasActiveSearch(false);
    setSearchPage(null);
    setSearchPageIndex(0);
    setSearchError("");
    searchParamsRef.current = "";
  };
  const handleStatusChange = (event, newValue) => {
    if (newValue === statusFilter) return;
    setStatusFilter(newValue);
    setPageIndex(0);
    setHasActiveSearch(false);
    setSearchPage(null);
    setSearchPageIndex(0);
    setSearchError("");
    searchParamsRef.current = "";
  };
  React.useEffect(() => {
    setMenuState({ anchorEl: null, presupuesto: null });
  }, [statusFilter]);
  const openActionsMenu = (event, presupuesto) => {
    setMenuState({ anchorEl: event.currentTarget, presupuesto });
  };
  const closeActionsMenu = () => {
    setMenuState({ anchorEl: null, presupuesto: null });
  };
  const openDeleteDialog = (presupuesto) => {
    setDeletingId(null);
    setConfirmDialog({ open: true, presupuesto });
  };
  const handleSelectDelete = () => {
    const presupuesto = menuState.presupuesto;
    closeActionsMenu();
    if (presupuesto) {
      openDeleteDialog(presupuesto);
    }
  };
  const closeDeleteDialog = React.useCallback(() => {
    setConfirmDialog({ open: false, presupuesto: null });
  }, []);
  const performRestore = React.useCallback(
    async (presupuesto, successMessage = "Presupuesto restaurado.") => {
      if (!presupuesto) {
        return;
      }
      try {
        await http.post(
          `${baseURL}/api/presupuestos/${presupuesto.id}/restore`,
        );
        await fetchPresupuestos(statusFilter, pageIndex);
        if (hasActiveSearch && searchParamsRef.current) {
          await fetchSearchPresupuestos(
            searchParamsRef.current,
            statusFilter,
            searchPageIndex,
          );
        }
        if (successMessage) {
          setSnackbar({ open: true, message: successMessage, action: null });
        }
        setListError("");
      } catch (e) {
        console.error("Error restaurando presupuesto:", e);
        setSnackbar({
          open: true,
          message: "No se pudo restaurar el presupuesto.",
          action: null,
        });
      }
    },
    [
      baseURL,
      fetchPresupuestos,
      fetchSearchPresupuestos,
      hasActiveSearch,
      pageIndex,
      searchPageIndex,
      statusFilter,
    ],
  );
  const handleRestore = React.useCallback(
    (presupuesto) => {
      performRestore(presupuesto, "Presupuesto restaurado.");
    },
    [performRestore],
  );
  const handleUndoDelete = React.useCallback(async () => {
    const presupuesto = lastDeletedRef.current;
    if (!presupuesto) {
      setSnackbar((prev) => ({ ...prev, open: false }));
      return;
    }
    lastDeletedRef.current = null;
    await performRestore(presupuesto, "Presupuesto restaurado.");
  }, [performRestore]);
  const handleConfirmDelete = async () => {
    const presupuesto = confirmDialog.presupuesto;
    if (!presupuesto) {
      closeDeleteDialog();
      return;
    }
    if (deletingId === presupuesto.id) {
      return;
    }
    setDeletingId(presupuesto.id);
    try {
      await http.delete(`${baseURL}/api/presupuestos/${presupuesto.id}`);
      lastDeletedRef.current = presupuesto;
      await fetchPresupuestos(statusFilter, pageIndex);
      if (hasActiveSearch && searchParamsRef.current) {
        await fetchSearchPresupuestos(
          searchParamsRef.current,
          statusFilter,
          searchPageIndex,
        );
      }
      setSnackbar({
        open: true,
        message: "Presupuesto eliminado.",
        action: (
          <Button
            color="secondary"
            size="small"
            onClick={() => handleUndoDelete()}
          >
            Deshacer
          </Button>
        ),
      });
      setListError("");
    } catch (e) {
      console.error("Error eliminando presupuesto:", e);
      setSnackbar({
        open: true,
        message: "No se pudo eliminar el presupuesto.",
        action: null,
      });
    } finally {
      setDeletingId(null);
      closeDeleteDialog();
    }
  };
  const handleSnackbarClose = (_, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
  };
  const isDeletingCurrent = deletingId === confirmDialog.presupuesto?.id;
  const monthOptions = React.useMemo(
    () =>
      monthLabels.map((label, index) => ({
        value: String(index + 1),
        label: label.charAt(0).toUpperCase() + label.slice(1),
      })),
    [],
  );
  const columnsCount = statusFilter === "deleted" ? 5 : 4;
  const mainTotalPages = Number(presupuestosPage.totalPages) || 0;
  const mainCurrentPage = mainTotalPages > 0 ? presupuestosPage.number + 1 : 1;
  const searchTotalPages = searchPage ? Number(searchPage.totalPages) || 0 : 0;
  const searchCurrentPage =
    searchTotalPages > 0 && searchPage ? searchPage.number + 1 : 1;
  /* Memos eliminados: visiblePresupuestos y visibleSearchResults para evitar filtrado local */
  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };
  const handleSearch = () => {
    setSearchError("");
    const params = new URLSearchParams();

    // Filtro por término de búsqueda (nombre)
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      params.set("nombre", trimmedQuery);
    }



    const hasYear = Boolean(filters.year);
    const hasFrom = Boolean(filters.fromMonth);
    const hasTo = Boolean(filters.toMonth);
    if (hasFrom || hasTo) {
      if (!hasFrom || !hasTo) {
        setSearchError("Debes seleccionar ambos meses para armar el rango.");
        return;
      }
      const baseYear = hasYear
        ? Number(filters.year)
        : new Date().getFullYear();
      const fromMonth = Number(filters.fromMonth);
      const toMonth = Number(filters.toMonth);
      params.set("desde", `${baseYear}-${pad2(fromMonth)}-01`);
      params.set("hasta", `${baseYear}-${pad2(toMonth)}-${pad2(lastDayOfMonth(baseYear, toMonth))}`);
    } else if (hasYear) {
      params.set("desde", `${filters.year}-01-01`);
      params.set("hasta", `${filters.year}-12-31`);
    }
    const queryString = params.toString();
    if (!queryString) {
      setHasActiveSearch(false);
      setSearchPage(null);
      setSearchPageIndex(0);
      searchParamsRef.current = "";
      return;
    }
    setHasActiveSearch(true);
    setSearchPageIndex(0);
    searchParamsRef.current = queryString;
    fetchSearchPresupuestos(queryString, statusFilter, 0);
  };
  const handleReset = () => {
    setFilters({ year: "", fromMonth: "", toMonth: "" });
    setQuery("");
    setSearchError("");
    setHasActiveSearch(false);
    setSearchPage(null);
    setSearchPageIndex(0);
    searchParamsRef.current = "";
  };
  const handlePageChange = (_, value) => {
    const newPage = Number(value) - 1;
    if (Number.isNaN(newPage) || newPage < 0) {
      return;
    }
    setPageIndex(newPage);
  };
  const handleSearchPageChange = (_, value) => {
    if (!hasActiveSearch || !searchParamsRef.current) {
      return;
    }
    const newPage = Number(value) - 1;
    if (Number.isNaN(newPage) || newPage < 0) {
      return;
    }
    setSearchPageIndex(newPage);
    fetchSearchPresupuestos(searchParamsRef.current, statusFilter, newPage);
  };
  const renderRows = (items) =>
    items.map((p) => {
      const slug = encodeURIComponent(
        (p.nombre || "").trim().toLowerCase().replace(/\s+/g, "-"),
      );
      const isDeleted = statusFilter === "deleted";
      const isMenuOpenForRow =
        Boolean(menuState.anchorEl) &&
        menuState.presupuesto &&
        menuState.presupuesto.id === p.id;
      const menuId = isMenuOpenForRow ? "presupuesto-actions-menu" : undefined;
      const buttonId = `acciones-presupuesto-${p.id}`;
      const esAdmin = (usuarioRol || "").toUpperCase().includes("ADMIN");
      return (
        <TableRow key={p.id} sx={tableRowStyle}>
          <TableCell
            sx={(theme) => ({
              ...tableCellStyle(theme),
              ...getColumnWidth(statusFilter).nombre,
            })}
          >
            {p.nombre}
          </TableCell>
          <TableCell
            sx={(theme) => ({
              ...tableCellStyle(theme),
              ...getColumnWidth(statusFilter).desde,
            })}
          >
            {monthName(p.desde)}
          </TableCell>
          <TableCell
            sx={(theme) => ({
              ...tableCellStyle(theme),
              ...getColumnWidth(statusFilter).hasta,
            })}
          >
            {monthName(p.hasta)}
          </TableCell>
          {isDeleted && (
            <TableCell
              sx={(theme) => ({
                ...tableCellStyle(theme),
                ...getColumnWidth(statusFilter).eliminado,
              })}
            >
              {formatDeletedAt(p.deletedAt)}
            </TableCell>
          )}
          <TableCell
            sx={(theme) => ({
              ...tableCellStyle(theme),
              ...getColumnWidth(statusFilter).acciones,
            })}
            align="right"
          >
            {isDeleted ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<RestoreFromTrashIcon />}
                onClick={() => handleRestore(p)}
              >
                Restaurar
              </Button>
            ) : (
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(`/presupuestos/${slug}`, { state: { presupuestoId: p.id } })}
                  sx={darkActionButtonSx}
                >
                  Ver detalle
                </Button>
                {esAdmin && (
                  <Tooltip title="Más acciones">
                    <IconButton
                      size="small"
                      aria-label="Más acciones"
                      aria-controls={menuId}
                      aria-haspopup="true"
                      aria-expanded={isMenuOpenForRow ? "true" : undefined}
                      id={buttonId}
                      onClick={(event) => openActionsMenu(event, p)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </TableCell>
        </TableRow>
      );
    });

  const firstMain = React.useMemo(
    () =>
      Array.isArray(presupuestosPage?.content) &&
        presupuestosPage.content.length
        ? presupuestosPage.content[0]
        : null,
    [presupuestosPage?.content],
  );

  const firstSearchRow = React.useMemo(
    () =>
      searchPage &&
        Array.isArray(searchPage.content) &&
        searchPage.content.length
        ? searchPage.content[0]
        : null,
    [searchPage],
  );

  const headerGhostMain = {
    nombre: firstMain?.nombre || "Nombre de ejemplo",
    desde: monthName(firstMain?.desde || "2025-01"),
    hasta: monthName(firstMain?.hasta || "2025-12"),
    eliminado: formatDeletedAt(firstMain?.deletedAt || "2025-10-14T20:21:43Z"),
  };

  const headerGhostSearch = {
    nombre: firstSearchRow?.nombre || "Nombre de ejemplo",
    desde: monthName(firstSearchRow?.desde || "2025-01"),
    hasta: monthName(firstSearchRow?.hasta || "2025-12"),
    eliminado: formatDeletedAt(
      firstSearchRow?.deletedAt || "2025-10-14T20:21:43Z",
    ),
  };



  const columns = React.useMemo(() => {
    const cols = [
      {
        field: 'nombre',
        headerName: 'Nombre',
        flex: 1,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.2,
              py: 1
            }}
          >
            {params.value}
          </Typography>
        )
      },
      {
        field: 'desde',
        headerName: 'Desde',
        flex: 1,
        align: 'center',
        headerAlign: 'center',
        valueFormatter: (value) => monthName(value)
      },
      {
        field: 'hasta',
        headerName: 'Hasta',
        flex: 1,
        align: 'center',
        headerAlign: 'center',
        valueFormatter: (value) => monthName(value)
      }
    ];

    if (statusFilter === 'deleted') {
      cols.push({
        field: 'deletedAt',
        headerName: 'Eliminados',
        flex: 1,
        align: 'center',
        headerAlign: 'center',
        valueFormatter: (value) => formatDeletedAt(value)
      });
    }

    cols.push({
      field: 'acciones',
      headerName: 'Acciones',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      renderCell: (params) => {
        const p = params.row;
        const isDeleted = statusFilter === "deleted";
        const slug = encodeURIComponent(
          (p.nombre || "").trim().toLowerCase().replace(/\s+/g, "-"),
        );
        const esAdmin = (usuarioRol || "").toUpperCase().includes("ADMIN");

        if (isDeleted) {
          return (
            <Button
              variant="outlined"
              size="small"
              startIcon={<RestoreFromTrashIcon />}
              onClick={() => handleRestore(p)}
              disabled={!canEdit}
            >
              Restaurar
            </Button>
          );
        }

        return (
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1, width: '100%' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate(`/presupuestos/${slug}`, { state: { presupuestoId: p.id } })}
              sx={isLightMode ? { lineHeight: 1.2 } : { color: "#42897f", lineHeight: 1.2 }}
            >
              Ver detalle
            </Button>
            {canEdit && (
              <Tooltip title="Más acciones">
                <IconButton
                  size="small"
                  onClick={(event) => openActionsMenu(event, p)}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      }
    });

    return cols;
  }, [statusFilter, usuarioRol, monthName, handleRestore, navigate, isLightMode, openActionsMenu]);

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <CurrencyTabs value={currency} onChange={handleCurrencyChange} sx={{ justifyContent: 'center', mb: 1.5 }} />
      <Typography variant="h4" gutterBottom>
        Presupuestos
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Visualiza tus presupuestos creados o genera uno nuevo
      </Typography>
      <Tabs value={statusFilter} onChange={handleStatusChange} sx={{ mt: 1 }}>
        <Tab
          value="active"
          label="Activos"
          sx={{
            color: tabsLabelColor,
            "&.Mui-selected": { color: tabsLabelColor },
            "& .MuiTab-wrapper": { color: tabsLabelColor },
          }}
        />
        <Tab
          value="deleted"
          label="Borrados"
          sx={{
            color: tabsLabelColor,
            "&.Mui-selected": { color: tabsLabelColor },
            "& .MuiTab-wrapper": { color: tabsLabelColor },
          }}
        />
      </Tabs>
      <Typography
        variant="caption"
        sx={{ display: "block", mb: 2, color: "text.primary" }}
      >
        {`Los presupuestos se purgan de forma definitiva a los ${retentionDays} días.`}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          mt: 2,
          mb: 2,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="presupuesto-year-label">Año</InputLabel>
          <Select
            labelId="presupuesto-year-label"
            value={filters.year}
            label="Año"
            onChange={handleFilterChange("year")}
          >
            <MenuItem value="">
              <em>Todos</em>
            </MenuItem>
            {yearOptions.map((year) => (
              <MenuItem key={year} value={String(year)}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="presupuesto-from-label">Desde (mes)</InputLabel>
          <Select
            labelId="presupuesto-from-label"
            value={filters.fromMonth}
            label="Desde (mes)"
            onChange={handleFilterChange("fromMonth")}
          >
            <MenuItem value="">
              <em>Sin filtro</em>
            </MenuItem>
            {monthOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="presupuesto-to-label">Hasta (mes)</InputLabel>
          <Select
            labelId="presupuesto-to-label"
            value={filters.toMonth}
            label="Hasta (mes)"
            onChange={handleFilterChange("toMonth")}
          >
            <MenuItem value="">
              <em>Sin filtro</em>
            </MenuItem>
            {monthOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loadingSearch}
        >
          Buscar
        </Button>
        <Button variant="text" onClick={handleReset} disabled={loadingSearch}>
          Limpiar
        </Button>
      </Box>
      <TextField
        label="Buscar"
        variant="outlined"
        size="small"
        value={query}
        onChange={(e) => {
          const newVal = e.target.value;
          setQuery(newVal);
          // Si el usuario borra todo el texto, limpiamos la búsqueda activa
          if (newVal.trim() === "") {
            setHasActiveSearch(false);
            setSearchPage(null);
            setSearchPageIndex(0);
            setSearchError("");
            searchParamsRef.current = "";
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch();
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleSearch}
                size="small"
                edge="end"
                disableRipple
                sx={{
                  border: "none",
                  outline: "none",
                  backgroundColor: "transparent",
                  "&:hover": { backgroundColor: "transparent" },
                  "&:focus": { outline: "none", backgroundColor: "transparent" },
                }}
              >
                <SearchRoundedIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          mt: 1,
          mb: 2,
          width: { xs: "100%", sm: 350 },
        }}
      />
      {searchError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {searchError}
        </Alert>
      )}

      {/* --- Search Results Table --- */}
      {hasActiveSearch && (
        <>
          <Box sx={{ mt: 4, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Resultado de la búsqueda
            </Typography>
            <Divider />
          </Box>
          <Paper sx={{ width: "100%", mb: 3 }}>
            {loadingSearch ? (
              <LoadingSpinner message="Cargando presupuestos..." />
            ) : searchPage ? (
              <>
                <DataGrid
                  rows={searchPage.content || []}
                  columns={columns}
                  getRowHeight={() => 'auto'}
                  autoHeight
                  density="standard"
                  hideFooter
                  disableColumnMenu
                  disableRowSelectionOnClick
                  columnVisibilityModel={{
                    desde: !isMobile,
                    hasta: !isMobile,
                  }}
                  sx={dataGridStyles}
                  slots={{
                    noRowsOverlay: CustomNoSearchResults,
                  }}
                />
                {searchTotalPages > 1 && (
                  <Box mt={2} mb={2} display="flex" justifyContent="center">
                    <Pagination
                      color="primary"
                      size="small"
                      count={searchTotalPages}
                      page={searchCurrentPage}
                      onChange={handleSearchPageChange}
                      siblingCount={0}
                      boundaryCount={1}
                    />
                  </Box>
                )}
              </>
            ) : null}
          </Paper>
        </>
      )}

      {/* --- Main List Table --- */}
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Listado completo
        </Typography>
        <Divider />
      </Box>
      {listError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {listError}
        </Alert>
      )}
      <Paper sx={{ width: "100%" }}>
        {loadingAll ? (
          <LoadingSpinner message="Cargando presupuestos..." />
        ) : (
          <>
            <DataGrid
              rows={presupuestosPage.content || []}
              columns={columns}
              getRowHeight={() => 'auto'}
              autoHeight
              density="standard"
              hideFooter
              disableColumnMenu
              disableRowSelectionOnClick
              columnVisibilityModel={{
                desde: !isMobile,
                hasta: !isMobile,
              }}
              sx={dataGridStyles}
              slots={{
                noRowsOverlay: CustomNoRowsPresupuestos,
              }}
            />
          </>
        )}
      </Paper>

      {/* --- Pagination --- */}
      {mainTotalPages > 1 && (
        <Box mt={2} display="flex" justifyContent="center">
          <Pagination
            color="primary"
            size="small"
            count={mainTotalPages}
            page={mainCurrentPage}
            onChange={handlePageChange}
            siblingCount={0}
            boundaryCount={1}
            aria-label="Paginacion de presupuestos"
          />
        </Box>
      )}

      {canEdit && (
        <Box mt={3}>
          <Button
            variant="contained"
            onClick={() => navigate("/presupuestos/nuevo")}
          >
            Crear nuevo presupuesto
          </Button>
        </Box>
      )}

      {/* --- Dialogs & Menus (Same as before) --- */}
      <Menu
        id="presupuesto-actions-menu"
        anchorEl={menuState.anchorEl}
        open={Boolean(menuState.anchorEl)}
        onClose={closeActionsMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        keepMounted
      >
        <MenuItem
          onClick={handleSelectDelete}
          disabled={!menuState.presupuesto}
        >
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} /> Eliminar
        </MenuItem>
      </Menu>
      <Dialog
        open={confirmDialog.open}
        onClose={() => {
          if (deletingId) {
            return;
          }
          closeDeleteDialog();
        }}
        disableEscapeKeyDown={Boolean(deletingId)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Eliminar presupuesto</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            {`Vas a eliminar el presupuesto "${confirmDialog.presupuesto?.nombre || ""}". Podrás restaurarlo desde la Papelera durante ${retentionDays} días.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={isDeletingCurrent}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={isDeletingCurrent}
            startIcon={
              isDeletingCurrent ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {isDeletingCurrent ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
        action={snackbar.action}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
