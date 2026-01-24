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
import dayjs from "dayjs";
import FormFactura from "../carga-general/components/forms/FormFactura";
import {
  fetchFacturas,
  deleteFactura,
  updateFactura,
} from "./api/facturasService";
import { formatCurrencyAR } from "../../utils/formatters";
import SuccessSnackbar from "../../shared-components/SuccessSnackbar";
import API_CONFIG from "../../config/api-config";

const FACTURA_PAGE_SIZE = 10;

const FacturaListPage = () => {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
  const [usuarioRol, setUsuarioRol] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);
  const searchDateISO = useMemo(() => {
    if (!searchText) return null;
    const parsed = dayjs(searchText, ["DD/MM/YYYY", "DD-MM-YYYY"], true);
    return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
  }, [searchText]);

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
  }, [debouncedSearch, fechaDesde, fechaHasta]);

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

  const loadFacturas = useCallback(async () => {
    setLoading(true);
    try {
      console.debug(
        "[FacturaListPage] Fetching facturas with filters:",
        filters,
        "pagination:",
        paginationModel,
      );
      const response = await fetchFacturas({
        page: paginationModel.page,
        size: paginationModel.pageSize,
        // Si es fecha, enviamos searchDate y omitimos el texto para que no combine con AND
        search: searchDateISO ? undefined : debouncedSearch || undefined,
        searchDate: searchDateISO || undefined,
        fechaDesde: fechaDesde
          ? dayjs(fechaDesde).format("YYYY-MM-DD")
          : undefined,
        fechaHasta: fechaHasta
          ? dayjs(fechaHasta).format("YYYY-MM-DD")
          : undefined,
        ...filters,
      });
      console.debug("[FacturaListPage] Facturas response:", response);

      // Si la respuesta es un objeto Page del backend
      if (response && typeof response === "object" && "content" in response) {
        setFacturas(Array.isArray(response.content) ? response.content : []);
        setRowCount(response.totalElements || 0);
      } else {
        // Si es un array directo (compatibilidad)
        const data = Array.isArray(response) ? response : [];
        setFacturas(data);
        setRowCount(data.length);
      }
    } catch (error) {
      console.error("[FacturaListPage] Error fetching facturas:", error);
      setFacturas([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    filters,
    paginationModel,
    debouncedSearch,
    searchDateISO,
    fechaDesde,
    fechaHasta,
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
        fechaColumn,
        accionesColumn,
      ];
    }

    return [
      {
        field: "numeroDocumento",
        headerName: "Número",
        flex: 1,
        minWidth: 140,
      },
      {
        field: "tipoFactura",
        headerName: "Tipo",
        flex: 0.6,
        minWidth: 100,
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
        renderCell: (params) =>
          params.row.montoTotal != null
            ? formatCurrencyAR(params.row.montoTotal)
            : "-",
      },
      {
        field: "moneda",
        headerName: "Moneda",
        flex: 0.5,
        minWidth: 90,
      },
      {
        field: "estadoPago",
        headerName: "Estado de pago",
        flex: 0.8,
        minWidth: 140,
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
        renderCell: (params) => (
          <Box>
            <Typography variant="body2">{params.value ?? "-"}</Typography>
          </Box>
        ),
      },
      accionesColumn,
    ];
  }, [isMobile, usuarioRol, formatFechaEmision, parseFechaEmision]);

  return (
    <Box sx={{ width: "100%", p: 3 }}>
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
            value={fechaDesde ? dayjs(fechaDesde) : null}
            format="DD/MM/YYYY"
            onChange={(newValue) => setFechaDesde(newValue)}
            slotProps={{
              textField: {
                size: "small",
                placeholder: "dd/mm/aaaa",
                sx: { backgroundColor: "white", borderRadius: "8px" },
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
                sx: { backgroundColor: "white", borderRadius: "8px" },
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
        {(fechaDesde || fechaHasta) && (
          <Button
            size="small"
            variant="text"
            onClick={() => {
              setFechaDesde(null);
              setFechaHasta(null);
            }}
            sx={{ ml: "auto" }}
          >
            Limpiar
          </Button>
        )}
      </Box>

      <Box sx={{ height: 700, width: "100%", mt: 0 }}>
        <DataGrid
          rows={facturas}
          columns={columns}
          loading={loading}
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
          disableRowSelectionOnClick
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
            "& .MuiDataGrid-columnHeader .MuiDataGrid-iconButtonContainer .MuiIconButton-root:not([aria-label*='menu'])":
              {
                display: "none",
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
