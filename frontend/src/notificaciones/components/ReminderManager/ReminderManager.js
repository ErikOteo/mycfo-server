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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import CustomDatePicker from "../../../shared-components/CustomDatePicker";
import CustomTimePicker from "../../../shared-components/CustomTimePicker";
import { useReminders } from "../../hooks/useReminders";
import { useChatbotScreenContext } from "../../../shared-components/useChatbotScreenContext";

const FieldBox = ({ label, children }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    <Typography variant="subtitle2" color="text.secondary">
      {label}
    </Typography>
    {children}
  </Box>
);

export default function ReminderManager() {
  const [openDialog, setOpenDialog] = React.useState(false);
  const [editingReminder, setEditingReminder] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  // TODO: Obtener el userId del contexto de autenticación
  const userId = 1;
  const {
    reminders,
    loading: remindersLoading,
    error,
    create,
    update,
    remove,
  } = useReminders(userId);

  // Form state
  const createDefaultFormData = () => ({
    title: "",
    message: "",
    date: dayjs(),
    time: dayjs(),
    isRecurring: false,
    recurrencePattern: "DAILY",
    reminderType: "CUSTOM",
  });

  const [formData, setFormData] = React.useState(createDefaultFormData());

  const reminderTypes = [
    { value: "CUSTOM", label: "Personalizado" },
    { value: "DEADLINE", label: "Vencimiento" },
    { value: "DATA_LOAD", label: "Carga de datos" },
    { value: "BILL_DUE", label: "Vencimiento de factura" },
  ];

  const recurrencePatterns = [
    { value: "DAILY", label: "Diario" },
    { value: "WEEKLY", label: "Semanal" },
    { value: "MONTHLY", label: "Mensual" },
    { value: "YEARLY", label: "Anual" },
  ];
  const recurrenceOptions = [
    { value: "NONE", label: "No recurrente" },
    ...recurrencePatterns,
  ];

  const chatbotContext = React.useMemo(
    () => ({
      screen: "recordatorios",
      loading: remindersLoading || loading,
      error: error ? error.message || String(error) : null,
      openDialog,
      editingReminderId: editingReminder?.id || null,
      reminderCount: reminders.length,
      reminders: reminders.slice(0, 5).map((reminder) => ({
        id: reminder.id,
        title: reminder.title,
        scheduledFor: reminder.scheduledFor,
        isRecurring: reminder.isRecurring,
        recurrencePattern: reminder.recurrencePattern,
        reminderType: reminder.reminderType,
      })),
      formDraft: openDialog
        ? {
            title: formData.title,
            message: formData.message,
            date: formData.date?.toISOString?.() ?? null,
            time: formData.time?.toISOString?.() ?? null,
            isRecurring: formData.isRecurring,
            recurrencePattern: formData.recurrencePattern,
            reminderType: formData.reminderType,
          }
        : null,
      tiposDisponibles: reminderTypes.map((item) => item.value),
      recurrenciasDisponibles: recurrenceOptions.map((item) => item.value),
    }),
    [
      remindersLoading,
      loading,
      error,
      openDialog,
      editingReminder,
      reminders,
      formData,
      reminderTypes,
      recurrenceOptions,
    ]
  );

  useChatbotScreenContext(chatbotContext);

  const handleOpenDialog = (reminder = null) => {
    if (reminder) {
      setEditingReminder(reminder);
      const scheduled = dayjs(reminder.scheduledFor);
      const validDate = scheduled.isValid() ? scheduled : dayjs();
      setFormData({
        title: reminder.title,
        message: reminder.message,
        date: validDate,
        time: validDate,
        isRecurring: reminder.isRecurring,
        recurrencePattern: reminder.recurrencePattern,
        reminderType: reminder.reminderType,
      });
    } else {
      setEditingReminder(null);
      setFormData(createDefaultFormData());
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingReminder(null);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const selectedDate =
        formData.date && formData.date.isValid() ? formData.date : dayjs();
      const selectedTime =
        formData.time && formData.time.isValid() ? formData.time : dayjs();
      const scheduledFor = selectedDate
        .hour(selectedTime.hour())
        .minute(selectedTime.minute())
        .second(0)
        .millisecond(0)
        .toISOString();

      const reminderData = {
        title: formData.title,
        message: formData.message,
        scheduledFor,
        isRecurring: formData.isRecurring,
        recurrencePattern: formData.recurrencePattern,
        reminderType: formData.reminderType,
      };

      if (editingReminder) {
        await update(editingReminder.id, reminderData);
      } else {
        await create(reminderData);
      }

      handleCloseDialog();
    } catch (error) {
      console.error("Error guardando recordatorio:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reminderId) => {
    if (
      window.confirm("¿Estás seguro de que quieres eliminar este recordatorio?")
    ) {
      try {
        setLoading(true);
        await remove(reminderId);
      } catch (error) {
        console.error("Error eliminando recordatorio:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getReminderTypeLabel = (type) => {
    return reminderTypes.find((t) => t.value === type)?.label || type;
  };

  const getRecurrenceLabel = (pattern) => {
    return (
      recurrencePatterns.find((p) => p.value === pattern)?.label || pattern
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: { sm: "100%", md: "1700px" },
        mx: "auto",
        px: 3,
        pt: 1,
        pb: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" }, // Columna en mobile, fila en desktop
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" }, // Alinear al inicio en mobile
          mb: 3,
          gap: 3,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Recordatorios
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.primary' }}>
            Gestiona tus recordatorios y alertas personalizadas
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ lineHeight: 1.2 }}
        >
          Nuevo Recordatorio
        </Button>
      </Box>

      {/* Lista de recordatorios */}
      <Box sx={{ width: "100%" }}>
        {remindersLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Cargando recordatorios...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error">
            Error al cargar los recordatorios: {error.message}
          </Alert>
        ) : reminders.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", px: 2 }}>
            <Paper sx={{ p: 4, textAlign: "center", width: "100%", maxWidth: 520 }}>
              <NotificationsIcon
                sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No tienes recordatorios configurados
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Crea tu primer recordatorio para no perderte nada importante
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ lineHeight: 1.2 }}
              >
                Crear Recordatorio
              </Button>
            </Paper>
          </Box>
        ) : (
          <Box
            sx={{
              columnCount: { xs: 1, sm: 2, lg: 3, xl: 4 },
              columnGap: { xs: 2, sm: 2.5 },
            }}
          >
            {reminders.map((reminder) => (
              <Box
                key={reminder.id}
                sx={{
                  breakInside: "avoid",
                  display: "inline-block",
                  width: "100%",
                  mb: 2,
                }}
              >
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: (theme) => theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    {/* Título del recordatorio */}
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{
                        fontWeight: 600,
                        lineHeight: 1.3,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        mb: 2,
                      }}
                    >
                      {reminder.title}
                    </Typography>

                    {/* Mensaje del recordatorio */}
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{
                        mb: 2,
                        lineHeight: 1.5,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        minHeight: "4.5em", // 3 líneas * 1.5 line-height
                      }}
                    >
                      {reminder.message}
                    </Typography>

                    {/* Chips de tipo y recurrencia */}
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
                    >
                      {/* <Chip
                        label={getReminderTypeLabel(reminder.reminderType)}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: "0.75rem" }}
                      /> */}
                      {reminder.isRecurring && (
                        <Chip
                          label={getRecurrenceLabel(reminder.recurrencePattern)}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: "0.75rem" }}
                        />
                      )}
                      {/* Debug: Mostrar siempre el patrón de recurrencia si existe */}
                      {reminder.recurrencePattern && !reminder.isRecurring && (
                        <Chip
                          label={`Tipo: ${getRecurrenceLabel(
                            reminder.recurrencePattern
                          )}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: "0.75rem" }}
                        />
                      )}
                    </Stack>

                    {/* Fecha y hora */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mt: "auto",
                        pt: 1,
                        borderTop: 1,
                        borderColor: "divider",
                      }}
                    >
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography
                        variant="caption"
                        color="text.primary"
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.8rem",
                        }}
                      >
                        {formatDate(reminder.scheduledFor)}
                      </Typography>
                    </Box>
                  </CardContent>

                  {/* Acciones en la parte inferior */}
                  <CardActions sx={{ pt: 0, px: 2, pb: 2, gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(reminder)}
                      sx={{
                        flex: 1,
                        textTransform: "none",
                        fontWeight: 500,
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(reminder.id)}
                      sx={{
                        flex: 1,
                        textTransform: "none",
                        fontWeight: 500,
                      }}
                    >
                      Eliminar
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Dialog para crear/editar recordatorio */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingReminder ? "Editar Recordatorio" : "Nuevo Recordatorio"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FieldBox label="Título">
                <TextField
                  fullWidth
                  placeholder="Título"
                  value={formData.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  size="small"
                  required
                />
              </FieldBox>
            </Grid>

            <Grid item xs={12}>
              <FieldBox label="Mensaje">
                <TextField
                  fullWidth
                  placeholder="Descripción"
                  value={formData.message}
                  onChange={(e) => handleFormChange("message", e.target.value)}
                  size="small"
                  required
                />
              </FieldBox>
            </Grid>

            {/*<Grid item xs={12} sm={6}>
              <FieldBox label="Tipo de recordatorio">
                <FormControl fullWidth size="small">
                  <Select
                    value={formData.reminderType}
                    onChange={(e) =>
                      handleFormChange("reminderType", e.target.value)
                    }
                    displayEmpty
                    renderValue={(value) =>
                      value
                        ? reminderTypes.find((type) => type.value === value)
                            ?.label
                        : "Seleccioná una opción"
                    }
                  >
                    {reminderTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </FieldBox>
            </Grid>*/}

            <Grid item xs={12} sm={6}>
              <FieldBox label="Fecha">
                <CustomDatePicker
                  value={formData.date}
                  onChange={(value) =>
                    handleFormChange("date", value || dayjs())
                  }
                />
              </FieldBox>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FieldBox label="Hora">
                <CustomTimePicker
                  value={formData.time}
                  onChange={(value) =>
                    handleFormChange("time", value || dayjs())
                  }
                />
              </FieldBox>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FieldBox label="Tipo">
                <FormControl fullWidth size="small">
                  <Select
                    value={
                      formData.isRecurring ? formData.recurrencePattern : "NONE"
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "NONE") {
                        handleFormChange("isRecurring", false);
                      } else {
                        handleFormChange("isRecurring", true);
                        handleFormChange("recurrencePattern", value);
                      }
                    }}
                  >
                    {recurrenceOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </FieldBox>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ color: "common.white" }}
            disabled={
              loading ||
              !formData.title ||
              !formData.message ||
              !formData.date ||
              !formData.time
            }
          >
            {loading
              ? "Guardando..."
              : editingReminder
                ? "Actualizar"
                : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
