import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Stack,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  MarkEmailRead as MarkReadIcon,
  Settings as SettingsIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../../hooks/useAuth";
import {
  formatDate,
  formatNumber,
  formatMovementDate,
} from "../../utils/formatters";
import { useChatbotScreenContext } from "../../../shared-components/useChatbotScreenContext";

export default function NotificationCenter() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState("all");
  const [filterSeverity, setFilterSeverity] = React.useState("all");
  const [page, setPage] = React.useState(0);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedNotifications, setSelectedNotifications] = React.useState([]);
  const navigate = useNavigate();

  // Obtener userId del estado de autenticación
  const { userId, isAuthenticated } = useAuth();
  
  // Solo usar notificaciones si está autenticado
  const { items, unread, loading, error, reload, markOneRead } =
    useNotifications(isAuthenticated ? userId : null);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset page when searching
  };

  const handleFilterChange = (filter, value) => {
    if (filter === "type") {
      setFilterType(value);
    } else if (filter === "severity") {
      setFilterSeverity(value);
    }
    setPage(0); // Reset page when filtering
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id));
    }
  };

  const handleMarkSelectedAsRead = async () => {
    try {
      for (const notificationId of selectedNotifications) {
        await markOneRead(notificationId);
      }
      setSelectedNotifications([]);
    } catch (error) {
      console.error("Error marcando como leídas:", error);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Filtrar notificaciones
  const filteredNotifications = React.useMemo(() => {
    let filtered = items;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.body.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (filterType !== "all") {
      filtered = filtered.filter(
        (notification) => notification.badge === filterType
      );
    }

    // Filtro por severidad
    if (filterSeverity !== "all") {
      filtered = filtered.filter(
        (notification) => notification.badge === filterSeverity
      );
    }

    return filtered;
  }, [items, searchTerm, filterType, filterSeverity]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRIT":
        return "error";
      case "WARN":
        return "warning";
      case "INFO":
        return "info";
      default:
        return "default";
    }
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage
  );

  const chatbotContext = React.useMemo(
    () => ({
      screen: "notificaciones",
      filtros: {
        searchTerm,
        filterType,
        filterSeverity,
      },
      total: filteredNotifications.length,
      unread,
      pagina: page + 1,
      notificaciones: paginatedNotifications.slice(0, 5),
    }),
    [
      searchTerm,
      filterType,
      filterSeverity,
      filteredNotifications.length,
      unread,
      page,
      paginatedNotifications,
    ]
  );

  useChatbotScreenContext(chatbotContext);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: { sm: "100%", md: "1700px" },
        mx: "auto",
        p: 3,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Centro de Notificaciones
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.primary' }}>
          Gestiona todas tus notificaciones y alertas
        </Typography>
      </Box>

      {/* Filtros y búsqueda */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar notificaciones..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filterType}
                label="Tipo"
                onChange={(e) => handleFilterChange("type", e.target.value)}
              >
                <MenuItem value="all">Todos los tipos</MenuItem>
                <MenuItem value="MOVEMENT_NEW">Nuevos Movimientos</MenuItem>
                <MenuItem value="BUDGET_EXCEEDED">
                  Presupuestos Excedidos
                </MenuItem>
                <MenuItem value="CASH_FLOW_ALERT">Alertas Cash Flow</MenuItem>
                <MenuItem value="REPORT_READY">Reportes Listos</MenuItem>
                <MenuItem value="REMINDER_CUSTOM">Recordatorios</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={1}>
              <IconButton onClick={handleMenuClick}>
                <MoreVertIcon />
              </IconButton>
              <IconButton
                onClick={() => navigate("/configuracion-notificaciones")}
              >
                <SettingsIcon />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>

        {/* Menu de acciones */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleSelectAll}>
            {selectedNotifications.length === filteredNotifications.length
              ? "Deseleccionar todo"
              : "Seleccionar todo"}
          </MenuItem>
          {selectedNotifications.length > 0 && (
            <MenuItem onClick={handleMarkSelectedAsRead}>
              <MarkReadIcon sx={{ mr: 1 }} />
              Marcar como leídas
            </MenuItem>
          )}
        </Menu>
      </Paper>

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.primary" gutterBottom>
                Total
              </Typography>
              <Typography variant="h5">{items.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.primary" gutterBottom>
                Sin leer
              </Typography>
              <Typography variant="h5" color="error">
                {unread}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.primary" gutterBottom>
                Filtradas
              </Typography>
              <Typography variant="h5">
                {filteredNotifications.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.primary" gutterBottom>
                Seleccionadas
              </Typography>
              <Typography variant="h5">
                {selectedNotifications.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de notificaciones */}
      <Box>
        {loading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography>Cargando notificaciones...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="error">
              Error al cargar las notificaciones: {error.message}
            </Typography>
          </Box>
        ) : paginatedNotifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              No hay notificaciones que coincidan con los filtros
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ position: "relative", p: 2 }}>
              <Grid
                container
                columnSpacing={{ xs: 0, md: 3 }}
                rowSpacing={2}
                sx={{ alignItems: "stretch" }}
              >
                {paginatedNotifications.map((notification, idx) => (
                  <Grid
                    item
                    xs={12}
                    md={6}
                    key={notification.id}
                    sx={{
                      display: "flex",
                      minWidth: 0,
                      pr: { md: idx % 2 === 0 ? 1.5 : 0 },
                      pl: { md: idx % 2 === 0 ? 0 : 1.5 },
                      flexBasis: { md: "calc(50% - 12px)" },
                      maxWidth: { md: "calc(50% - 12px)" },
                    }}
                  >
                    <Card
                      sx={{
                        height: "100%",
                        width: "100%",
                        minWidth: 0,
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        opacity: notification.is_read ? 0.7 : 1,
                        borderLeft: notification.is_read
                          ? "none"
                          : "4px solid #008375",
                        backgroundColor: selectedNotifications.includes(
                          notification.id
                        )
                          ? "action.selected"
                          : "background.paper",
                      }}
                    >
                      <CardContent
                        sx={{
                          flexGrow: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          minWidth: 0,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 2,
                            minWidth: 0,
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 1,
                                minWidth: 0,
                              }}
                            >
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: notification.is_read
                                    ? "normal"
                                    : "bold",
                                  flex: 1,
                                  minWidth: 0,
                                  wordBreak: "break-word",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {notification.title}
                              </Typography>
                              {/* Badge oculto por UX */}
                            </Box>
                            <Typography
                              variant="body2"
                              color="text.primary"
                              sx={{
                                mb: 1,
                                wordBreak: "break-word",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {formatNumber(notification.body)}
                            </Typography>
                            <Typography variant="caption" color="text.primary">
                              {formatDate(notification.date)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                      <CardActions
                        sx={{
                          flexWrap: "wrap",
                          gap: 1,
                          rowGap: 1,
                          pt: 0,
                        }}
                      >
                        <Button
                          size="small"
                          startIcon={
                            selectedNotifications.includes(notification.id)
                              ? (
                                <CheckBoxIcon />
                              ) : (
                                <CheckBoxOutlineBlankIcon />
                              )
                          }
                          onClick={() => handleSelectNotification(notification.id)}
                          color={
                            selectedNotifications.includes(notification.id)
                              ? "primary"
                              : "default"
                          }
                          variant={
                            selectedNotifications.includes(notification.id)
                              ? "contained"
                              : "outlined"
                          }
                        >
                          Seleccionar
                        </Button>
                        {!notification.is_read && (
                          <Button
                            size="small"
                            startIcon={<MarkReadIcon />}
                            onClick={() => markOneRead(notification.id)}
                            color="success"
                            variant="outlined"
                          >
                            Marcar como leída
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: "50%",
                  width: "1px",
                  bgcolor: "divider",
                  display: { xs: "none", md: "block" },
                  pointerEvents: "none",
                  transform: "translateX(-0.5px)",
                }}
              />
            </Box>

            {/* Paginación */}
            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={(event, value) => setPage(value - 1)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
