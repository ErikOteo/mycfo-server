import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  Alert,
  Snackbar,
  LinearProgress,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import FormFactura from "../carga-general/components/forms/FormFactura";
import {
  fetchFacturas,
  deleteFactura,
  updateFactura,
} from "./api/facturasService";
import { formatCurrencyByCode } from "../../utils/formatters";
import SuccessSnackbar from "../../shared-components/SuccessSnackbar";
import API_CONFIG from "../../config/api-config";
import CustomSelect from "../../shared-components/CustomSelect";
import CurrencyTabs, {
  usePreferredCurrency,
} from "../../shared-components/CurrencyTabs";
import ExportadorSimple from "../../shared-components/ExportadorSimple";
import { exportToExcel } from "../../utils/exportExcelUtils";
import { exportPdfReport } from "../../utils/exportPdfUtils";

const FACTURA_PAGE_SIZE = 10;

const FacturaListPage = () => {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  // Paginación del servidor
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCount, setRowCount] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("view"); // view | edit
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [facturaToDelete, setFacturaToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [successSnackbar, setSuccessSnackbar] = useState({
    open: false,
    message: "",
  });
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [usuarioRol, setUsuarioRol] = useState(null);
  const [currency, setCurrency] = usePreferredCurrency("ARS");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState(null); // Dayjs | null
  const [fechaHasta, setFechaHasta] = useState(null); // Dayjs | null
  const [montoDesde, setMontoDesde] = useState("");
  const [montoHasta, setMontoHasta] = useState("");
  const [montoRangeLabel, setMontoRangeLabel] = useState("");
  const [maxMonto, setMaxMonto] = useState(null);
  const [montoRangeOptions, setMontoRangeOptions] = useState([]);
  const searchDateISO = useMemo(() => {
    if (!searchText) return null;
    const parsed = dayjs(searchText, ["DD/MM/YYYY", "DD-MM-YYYY"], true);
    return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
  }, [searchText]);

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

  const handleMontoRangeChange = useCallback((label) => {
    setMontoRangeLabel(label);
    if (!label) {
      setMontoDesde("");
      setMontoHasta("");
      return;
    }
    const numbers = label.match(/[\d.,]+/g) || [];
    const [minRaw, maxRaw] = numbers;
    const parseNumber = (txt) =>
      parseFloat(txt.replace(/\./g, "").replace(/,/g, "."));
    const minVal = parseNumber(minRaw ?? "0");
    const maxVal = parseNumber(maxRaw ?? "0");
    setMontoDesde(Number.isFinite(minVal) ? minVal.toString() : "");
    setMontoHasta(Number.isFinite(maxVal) ? maxVal.toString() : "");
  }, []);

  useEffect(() => {
    const handler = setTimeout(
      () => setDebouncedSearch(searchText.trim().toLowerCase()),
      250,
    );
    return () => clearTimeout(handler);
  }, [searchText]);

  useEffect(() => {
    setPaginationModel((prev) =>
      prev.page === 0 ? prev : { ...prev, page: 0 },
    );
  }, [
    debouncedSearch,
    fechaDesde,
    fechaHasta,
    montoDesde,
    montoHasta,
    montoRangeLabel,
  ]);

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

  // Normaliza la fecha de emisión sin importar el formato que devuelva el backend
  const parseFechaEmision = useCallback((fecha) => {
    const monthTextToNumber = {
      JANUARY: 1,
      FEBRUARY: 2,
      MARCH: 3,
      APRIL: 4,
      MAY: 5,
      JUNE: 6,
      JULY: 7,
      AUGUST: 8,
      SEPTEMBER: 9,
      OCTOBER: 10,
      NOVEMBER: 11,
      DECEMBER: 12,
    };
    const normalizeMonth = (month) => {
      if (month == null) return null;
      if (typeof month === "string") {
        const upper = month.toUpperCase();
        if (monthTextToNumber[upper]) return monthTextToNumber[upper];
        const parsed = parseInt(month, 10);
        return Number.isNaN(parsed) ? null : parsed;
      }
      return month;
    };

    if (!fecha) return null;
    if (dayjs.isDayjs(fecha)) return fecha;

    if (Array.isArray(fecha)) {
      const [year, month = 1, day = 1, hour = 0, minute = 0, second = 0] =
        fecha;
      const normalizedMonth = normalizeMonth(month) ?? 1;
      const parsedFromArray = dayjs({
        year,
        month: normalizedMonth - 1,
        day,
        hour,
        minute,
        second,
      });
      if (parsedFromArray.isValid()) return parsedFromArray;
    }

    if (typeof fecha === "object") {
      const {
        date,
        time,
        year,
        month,
        monthValue,
        day,
        dayOfMonth,
        dayOfYear,
        hour,
        minute,
        second,
      } = fecha;
      const dateObj = date || {};
      const timeObj = time || {};
      const finalMonth =
        normalizeMonth(
          month ?? monthValue ?? dateObj.month ?? dateObj.monthValue,
        ) ?? 1;
      const parsedFromObject = dayjs({
        year: year ?? dateObj.year,
        month: finalMonth - 1,
        day:
          day ??
          dayOfMonth ??
          dayOfYear ??
          dateObj.day ??
          dateObj.dayOfMonth ??
          dateObj.dayOfYear,
        hour: hour ?? timeObj.hour ?? 0,
        minute: minute ?? timeObj.minute ?? 0,
        second: second ?? timeObj.second ?? 0,
      });
      if (parsedFromObject.isValid()) return parsedFromObject;
    }

    const parsed = dayjs(fecha);
    return parsed.isValid() ? parsed : null;
  }, []);

  const formatFechaEmision = useCallback(
    (fecha) => {
      const parsed = parseFechaEmision(fecha);
      return parsed ? parsed.format("DD/MM/YYYY") : "-";
    },
    [parseFechaEmision],
  );

  const fetchMaxMonto = useCallback(async () => {
    try {
      const params = {
        page: 0,
        size: 1,
        sortBy: "montoTotal",
        sortDir: "desc",
        moneda: currency,
      };
      const res = await fetchFacturas(params);
      const first = res?.content?.[0] ?? res?.[0];
      const max = first?.montoTotal;
      if (Number.isFinite(max)) {
        setMaxMonto(max);
        setMontoRangeOptions(buildMontoRanges(max));
      } else {
        setMaxMonto(null);
        setMontoRangeOptions([]);
      }
    } catch (e) {
      console.error("Error obteniendo max monto facturas:", e);
      setMaxMonto(null);
      setMontoRangeOptions([]);
    }
  }, [buildMontoRanges, currency]);

  useEffect(() => {
    fetchMaxMonto();
  }, [fetchMaxMonto]);

  const loadFacturas = useCallback(async () => {
    setLoading(true);
    const fromDate =
      fechaDesde && dayjs.isDayjs(fechaDesde) && fechaDesde.isValid()
        ? fechaDesde.startOf("day")
        : null;
    const toDate =
      fechaHasta && dayjs.isDayjs(fechaHasta) && fechaHasta.isValid()
        ? fechaHasta.startOf("day")
        : null;

    // Si el rango es inválido, vaciamos la tabla sin llamar al backend
    if (fromDate && toDate && fromDate.isAfter(toDate)) {
      setFacturas([]);
      setRowCount(0);
      setLoading(false);
      return;
    }

    const montoMinParsed = parseMontoInput(montoDesde);
    const montoMaxParsed = parseMontoInput(montoHasta);
    if (
      montoMinParsed !== null &&
      montoMaxParsed !== null &&
      montoMinParsed > montoMaxParsed
    ) {
      setFacturas([]);
      setRowCount(0);
      setLoading(false);
      return;
    }

    try {
      const params = {
        page: paginationModel.page,
        size: paginationModel.pageSize,
        // Si es fecha, enviamos searchDate y omitimos el texto para que no combine con AND
        search: searchDateISO ? undefined : debouncedSearch || undefined,
        searchDate: searchDateISO || undefined,
        fechaDesde: fromDate ? fromDate.format("YYYY-MM-DD") : undefined,
        fechaHasta: toDate ? toDate.format("YYYY-MM-DD") : undefined,
        montoMin: montoMinParsed ?? undefined,
        montoMax: montoMaxParsed ?? undefined,
        ...filters,
        moneda: currency,
      };
      console.debug("[FacturaListPage] Params enviados:", params);
      const response = await fetchFacturas(params);

      if (response && typeof response === "object" && "content" in response) {
        setFacturas(Array.isArray(response.content) ? response.content : []);
        setRowCount(response.totalElements || 0);
      } else {
        const data = Array.isArray(response) ? response : [];
        setFacturas(data);
        setRowCount(data.length);
      }
    } catch (error) {
      console.error("[FacturaListPage] Error fetching facturas:", error);
      // Silencioso: tabla vacía ante error (p.ej. fecha inválida)
      setFacturas([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    currency,
    filters,
    paginationModel,
    debouncedSearch,
    searchDateISO,
    fechaDesde,
    fechaHasta,
    montoDesde,
    montoHasta,
    parseMontoInput,
  ]);

  const fetchFacturasParaExportar = useCallback(async () => {
    try {
      const response = await fetchFacturas({
        page: 0,
        size: Math.max(rowCount || facturas.length || 500, 500),
        search: searchDateISO ? undefined : debouncedSearch || undefined,
        searchDate: searchDateISO || undefined,
        fechaDesde: fechaDesde
          ? dayjs(fechaDesde).format("YYYY-MM-DD")
          : undefined,
        fechaHasta: fechaHasta
          ? dayjs(fechaHasta).format("YYYY-MM-DD")
          : undefined,
        montoMin: parseMontoInput(montoDesde) ?? undefined,
        montoMax: parseMontoInput(montoHasta) ?? undefined,
        ...filters,
        moneda: currency,
      });

      if (response && typeof response === "object" && "content" in response) {
        return Array.isArray(response.content) ? response.content : [];
      }
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error("Error al exportar facturas:", error);
      alert("No se pudieron obtener las facturas para exportar.");
      return [];
    }
  }, [
    rowCount,
    facturas.length,
    searchDateISO,
    debouncedSearch,
    fechaDesde,
    fechaHasta,
    filters,
    currency,
    montoDesde,
    montoHasta,
    parseMontoInput,
  ]);

  const cargarRolUsuario = useCallback(() => {
    const sub = sessionStorage.getItem("sub");
    if (!sub) return;
    fetch(`${API_CONFIG.ADMINISTRACION}/api/usuarios/perfil`, {
      headers: { "X-Usuario-Sub": sub },
    })
      .then((res) => res.json())
      .then((data) => setUsuarioRol(data.rol))
      .catch((err) => console.error("Error cargando rol:", err));
  }, []);

  useEffect(() => {
    loadFacturas();
    cargarRolUsuario();
  }, [loadFacturas, cargarRolUsuario]);

  const requiredFields = useMemo(
    () => [
      "numeroDocumento",
      "versionDocumento",
      "tipoFactura",
      "fechaEmision",
      "montoTotal",
      "moneda",
      "vendedorNombre",
      "compradorNombre",
    ],
    [],
  );

  const handleCurrencyChange = useCallback(
    (next) => {
      if (!next) return;
      setCurrency(next);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    },
    [setCurrency],
  );

  const initialState = useMemo(
    () => ({
      pagination: { paginationModel: { pageSize: FACTURA_PAGE_SIZE } },
      sorting: { sortModel: [{ field: "fechaEmision", sort: "desc" }] },
    }),
    [],
  );

  const paginationMode = "server";

  const validarFormulario = () => {
    const newErrors = {};
    requiredFields.forEach((field) => {
      const value = formData[field];
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (value?.isValid &&
          typeof value.isValid === "function" &&
          !value.isValid())
      ) {
        newErrors[field] = "Campo obligatorio";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerFactura = (factura) => {
    setSelectedFactura(factura);
    setFormData({
      ...factura,
      fechaEmision: parseFechaEmision(factura.fechaEmision),
    });
    setDialogMode("view");
    setDialogOpen(true);
  };

  const handleEditarFactura = (factura) => {
    setSelectedFactura(factura);
    setFormData({
      ...factura,
      fechaEmision: parseFechaEmision(factura.fechaEmision),
    });
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleGuardarCambios = async () => {
    if (!selectedFactura) return;
    if (!validarFormulario()) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "Por favor completa todos los campos obligatorios.",
      });
      return;
    }

    try {
      const facturaId = selectedFactura.id ?? selectedFactura.idDocumento;
      if (!facturaId) {
        throw new Error("La factura seleccionada no tiene identificador.");
      }
      await updateFactura(facturaId, formData);
      setSuccessSnackbar({
        open: true,
        message: "Factura actualizada correctamente.",
      });
      setDialogOpen(false);
      loadFacturas();
    } catch (error) {
      console.error("Error actualizando factura", error);
      setSnackbar({
        open: true,
        severity: "error",
        message:
          error?.response?.data?.mensaje ||
          error?.message ||
          "No pudimos actualizar la factura.",
      });
    }
  };

  const handleEliminarFactura = async () => {
    if (!facturaToDelete) return;
    try {
      const facturaId = facturaToDelete.id ?? facturaToDelete.idDocumento;
      if (!facturaId) {
        throw new Error("La factura seleccionada no tiene identificador.");
      }
      await deleteFactura(facturaId);
      setSuccessSnackbar({
        open: true,
        message: "Factura eliminada correctamente.",
      });
      setDeleteConfirmOpen(false);
      setFacturaToDelete(null);
      loadFacturas();
    } catch (error) {
      console.error("Error al eliminar factura", error);
      setSnackbar({
        open: true,
        severity: "error",
        message:
          error?.response?.data?.mensaje ||
          error?.message ||
          "No pudimos eliminar la factura.",
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedFactura(null);
    setErrors({});
  };

  const handleCloseSnackbar = (_event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ open: false, message: "", severity: "info" });
  };

  const handleCloseSuccessSnackbar = () => {
    setSuccessSnackbar({ open: false, message: "" });
  };

  const columns = useMemo(() => {
    const accionesColumn = {
      field: "acciones",
      headerName: "Acciones",
      flex: 0.9,
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
              onClick={() => handleVerFactura(params.row)}
              title="Ver detalles"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
            {isAdmin && (
              <>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleEditarFactura(params.row)}
                  title="Editar"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    setFacturaToDelete(params.row);
                    setDeleteConfirmOpen(true);
                  }}
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

    const fechaColumn = {
      field: "fechaEmision",
      headerName: isMobile ? "Fecha" : "Fecha emisión",
      flex: isMobile ? 0.7 : 0.8,
      minWidth: isMobile ? 120 : 160,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2">
          {formatFechaEmision(params?.row?.fechaEmision)}
        </Typography>
      ),
      sortComparator: (a, b, cellParamsA, cellParamsB) => {
        const aDate = parseFechaEmision(cellParamsA?.row?.fechaEmision);
        const bDate = parseFechaEmision(cellParamsB?.row?.fechaEmision);
        const aValue = aDate ? aDate.valueOf() : -Infinity;
        const bValue = bDate ? bDate.valueOf() : -Infinity;
        return aValue - bValue;
      },
    };

    if (isMobile) {
      return [
        {
          field: "numeroDocumento",
          headerName: "Número",
          flex: 0.9,
          minWidth: 120,
          align: 'center',
          headerAlign: 'center',
          renderCell: (params) => {
            const value =
              params?.row?.numeroDocumento ??
              params?.row?.id ??
              params?.row?.idDocumento ??
              "-";
            return (
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "normal",
                  wordBreak: "break-all",
                  overflowWrap: "anywhere",
                  lineHeight: 1.2,
                }}
              >
                {value}
              </Typography>
            );
          },
        },
        accionesColumn,
      ];
    }

    return [
      {
        field: "numeroDocumento",
        headerName: "Número",
        flex: 1,
        minWidth: 140,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: "tipoFactura",
        headerName: "Tipo",
        flex: 0.6,
        minWidth: 100,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <Chip
            label={params.value ?? "-"}
            size="small"
            color="primary"
            sx={{ fontWeight: 600 }}
          />
        ),
      },
      fechaColumn,
      {
        field: "montoTotal",
        headerName: "Monto",
        flex: 1,
        minWidth: 140,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) =>
          params.row.montoTotal != null
            ? formatCurrencyByCode(
              params.row.montoTotal,
              params.row.moneda || currency,
            )
            : "-",
      },
      {
        field: "moneda",
        headerName: "Moneda",
        flex: 0.5,
        minWidth: 90,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: "estadoPago",
        headerName: "Estado de pago",
        flex: 0.8,
        minWidth: 140,
        align: 'center',
        headerAlign: 'center',
        hide: true,
        renderCell: (params) => (
          <Chip
            label={params.value ?? "NO_PAGADO"}
            size="small"
            color={
              params.value === "PAGADO"
                ? "success"
                : params.value === "PARCIALMENTE_PAGADO"
                  ? "warning"
                  : "default"
            }
          />
        ),
      },
      {
        field: "vendedorNombre",
        headerName: "Vendedor",
        flex: 1.2,
        minWidth: 160,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <Box>
            <Typography variant="body2">{params.value ?? "-"}</Typography>
          </Box>
        ),
      },
      {
        field: "compradorNombre",
        headerName: "Comprador",
        flex: 1.2,
        minWidth: 160,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <Box>
            <Typography variant="body2">{params.value ?? "-"}</Typography>
          </Box>
        ),
      },
      accionesColumn,
    ];
  }, [currency, isMobile, usuarioRol, formatFechaEmision, parseFechaEmision]);

  const exportColumns = useMemo(
    () => columns.filter((c) => c.field !== "acciones"),
    [columns],
  );

  const formatValorExport = (row, field) => {
    if (field === "fechaEmision") return formatFechaEmision(row.fechaEmision);
    if (field === "montoTotal") {
      return row.montoTotal != null
        ? formatCurrencyByCode(row.montoTotal, row.moneda || currency)
        : "-";
    }
    const value = row[field];
    if (value == null) return "-";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const handleExportExcel = async () => {
    const registros = await fetchFacturasParaExportar();
    if (!registros.length) return;

    const headers = exportColumns.map((c) => c.headerName);
    const excelData = [
      headers,
      ...registros.map((row) =>
        exportColumns.map((c) => formatValorExport(row, c.field)),
      ),
    ];
    const colsConfig = exportColumns.map(() => ({ wch: 18 }));

    exportToExcel(
      excelData,
      `facturas-${(currency || "ARS").toLowerCase()}`,
      "Facturas",
      colsConfig,
      [],
      [],
      {
        headerRows: [0],
        zebra: true,
        freezePane: { rowSplit: 1, colSplit: 1 },
      },
    );
  };

  const handleExportPdf = async () => {
    const registros = await fetchFacturasParaExportar();
    if (!registros.length) return;

    const head = [exportColumns.map((c) => c.headerName)];
    const body = registros.map((row) =>
      exportColumns.map((c) => formatValorExport(row, c.field)),
    );

    await exportPdfReport({
      title: "Facturas",
      subtitle: "Listado",
      charts: [],
      table: { head, body },
      fileName: `facturas-${(currency || "ARS").toLowerCase()}`,
      footerOnFirstPage: false,
      cover: {
        show: true,
        subtitle: "Resumen de facturas",
        logo: logoDataUrl,
        meta: [
          { label: "Registros", value: registros.length },
          { label: "Columnas", value: exportColumns.length },
          { label: "Generado", value: new Date().toLocaleDateString("es-AR") },
        ],
        kpis: [
          { label: "Total", value: registros.length.toString() },
          {
            label: "Monedas",
            value: new Set(
              registros.map((r) => r.moneda || "ARS"),
            ).size.toString(),
          },
          { label: "Orden", value: "Fecha desc" },
        ],
        summary: ["Incluye filtros aplicados y rango de fechas."],
      },
    });
  };

  return (
    <Box
      sx={{
        width: "100%",
        px: { xs: 2, md: 3 },
        pt: { xs: 1.5, md: 2 },
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
        Facturas
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
            value={fechaDesde}
            format="DD/MM/YYYY"
            onChange={(newValue) =>
              setFechaDesde(
                newValue && newValue.isValid() ? newValue.startOf("day") : null,
              )
            }
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
            value={fechaHasta}
            format="DD/MM/YYYY"
            onChange={(newValue) =>
              setFechaHasta(
                newValue && newValue.isValid() ? newValue.startOf("day") : null,
              )
            }
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
          name="facturaMontoRange"
          value={montoRangeLabel}
          onChange={handleMontoRangeChange}
          options={montoRangeOptions}
          width="180px"
        />
        {(fechaDesde ||
          fechaHasta ||
          montoDesde ||
          montoHasta ||
          montoRangeLabel) && (
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
          <Button
            variant="contained"
            onClick={() => navigate("/carga/factura")}
          >
            Cargar factura
          </Button>
          <ExportadorSimple
            onExportPdf={handleExportPdf}
            onExportExcel={handleExportExcel}
          />
        </Box>
      </Box>

      <Box sx={{ width: "100%", mt: 0 }}>
        <DataGrid
          rows={facturas}
          columns={columns}
          loading={loading}
          autoHeight
          getRowId={(row) =>
            row.id ??
            row.idDocumento ??
            `${row.numeroDocumento}-${row.fechaEmision}`
          }
          // Paginación del servidor
          paginationMode={paginationMode}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rowCount={rowCount}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            sorting: { sortModel: [{ field: "fechaEmision", sort: "desc" }] },
            columns: {
              columnVisibilityModel: {
                estadoPago: false,
              },
            },
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
            "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
            "& .MuiDataGrid-sortIcon": {
              display: "none",
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
          {dialogMode === "edit" ? "Editar factura" : "Detalle de factura"}
        </DialogTitle>
        <DialogContent dividers>
          {selectedFactura ? (
            <FormFactura
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              modoEdicion={dialogMode === "edit"}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
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
        <DialogTitle>Eliminar factura</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ¿Seguro que querés eliminar la factura{" "}
            <strong>{facturaToDelete?.numeroDocumento}</strong>? Esta acción no
            se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleEliminarFactura}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <SuccessSnackbar
        open={successSnackbar.open}
        message={successSnackbar.message}
        onClose={handleCloseSuccessSnackbar}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FacturaListPage;
