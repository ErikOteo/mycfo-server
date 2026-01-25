import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  FormGroup,
  FormControlLabel,
  Switch,
  Divider,
  Button,
  Alert,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Stack,
} from "@mui/material";
import {
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import CustomTimePicker from "../../../shared-components/CustomTimePicker";
import API_CONFIG from "../../../config/api-config";

const FieldBox = ({ label, children }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    <Typography variant="subtitle2" color="text.secondary">
      {label}
    </Typography>
    {children}
  </Box>
);

const timeStringToDayjs = (timeStr) => {
  const [hours = "00", minutes = "00"] = (timeStr || "00:00").split(":");
  return dayjs().hour(Number(hours) || 0).minute(Number(minutes) || 0).second(0);
};

export default function NotificationSettings() {
  const [preferences, setPreferences] = React.useState({
    emailEnabled: true,
    inAppEnabled: true,
    pushEnabled: false,
    dailyDigestEnabled: true,
    weeklyDigestEnabled: false,
    digestTime: "09:00",
    quietStart: "22:00",
    quietEnd: "08:00",
    quietDays: [],
    typeConfigs: {},
    userEmail: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // Cargar preferencias al iniciar
  React.useEffect(() => {
    const loadPreferences = async () => {
      try {
        const usuarioSub = sessionStorage.getItem("sub");
        if (!usuarioSub) {
          console.error("No se encontró el sub del usuario en sesión");
          return;
        }
        const response = await fetch(
          `${API_CONFIG.NOTIFICACION}/api/users/1/notification-preferences`,
          {
            headers: {
              "X-Usuario-Sub": usuarioSub,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setPreferences(data);
        }
      } catch (error) {
        console.error("Error cargando preferencias:", error);
      }
    };

    loadPreferences();
  }, []);

  const notificationTypes = [
    { value: "MOVEMENT_NEW", label: "Nuevos Movimientos" },
    { value: "MOVEMENT_HIGH", label: "Movimientos Altos" },
    { value: "RECONCILIATION_STALE", label: "Conciliación Pendiente" },
    { value: "REMINDER_BILL_DUE", label: "Facturas por Vencer" },
    { value: "USER_INVITED", label: "Usuarios Invitados" },
    { value: "ROLE_CHANGED", label: "Cambios de Rol" },
    { value: "BUDGET_EXCEEDED", label: "Presupuestos Excedidos" },
    { value: "BUDGET_WARNING", label: "Presupuestos al 80%" },
    { value: "BUDGET_MISSING_CATEGORY", label: "Categorías sin Presupuesto" },
    { value: "CASH_FLOW_ALERT", label: "Alertas de Cash Flow" },
    { value: "REPORT_READY", label: "Reportes Listos" },
    { value: "MONTHLY_SUMMARY", label: "Resumen Mensual" },
    { value: "REMINDER_CUSTOM", label: "Recordatorios" },
    { value: "SYSTEM_MAINTENANCE", label: "Mantenimiento del Sistema" },
  ];

  const daysOfWeek = [
    { value: "MONDAY", label: "Lunes" },
    { value: "TUESDAY", label: "Martes" },
    { value: "WEDNESDAY", label: "Miércoles" },
    { value: "THURSDAY", label: "Jueves" },
    { value: "FRIDAY", label: "Viernes" },
    { value: "SATURDAY", label: "Sábado" },
    { value: "SUNDAY", label: "Domingo" },
  ];

  const handlePreferenceChange = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTimeFieldChange = (field, value) => {
    if (value && value.isValid && value.isValid()) {
      handlePreferenceChange(field, value.format("HH:mm"));
    } else {
      handlePreferenceChange(field, dayjs().format("HH:mm"));
    }
  };

  const handleTypeConfigChange = (type, field, value) => {
    setPreferences((prev) => ({
      ...prev,
      typeConfigs: {
        ...prev.typeConfigs,
        [type]: {
          ...prev.typeConfigs[type],
          [field]: value,
        },
      },
    }));
  };

  const handleQuietDayToggle = (day) => {
    setPreferences((prev) => ({
      ...prev,
      quietDays: prev.quietDays.includes(day)
        ? prev.quietDays.filter((d) => d !== day)
        : [...prev.quietDays, day],
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const usuarioSub = sessionStorage.getItem("sub");
      if (!usuarioSub) {
        throw new Error("No se encontró el usuario autenticado");
      }

      // Enviar preferencias al backend
      const response = await fetch(
        `${API_CONFIG.NOTIFICACION}/api/users/1/notification-preferences`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Usuario-Sub": usuarioSub,
          },
          body: JSON.stringify(preferences),
        }
      );

      if (!response.ok) {
        throw new Error("Error guardando preferencias");
      }

      const updatedPreferences = await response.json();
      setPreferences(updatedPreferences);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error guardando preferencias:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        maxWidth: 1400,
        mx: "auto",
      }}
    >
      {/* Header con título y botón alineados */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Configuración de Notificaciones
          </Typography>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            Personaliza cómo y cuándo recibir notificaciones
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={loading}
          sx={{
            minWidth: "180px",
            height: "48px",
          }}
        >
          {loading ? "Guardando..." : "Guardar Preferencias"}
        </Button>
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Preferencias guardadas exitosamente
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(280px, 1fr))",
            md: "repeat(3, minmax(300px, 1fr))",
          },
          alignItems: "stretch",
          mb: 3,
        }}
      >
        {/* Configuración General */}
        <Card sx={{ height: "100%" }}>
          <CardHeader
            avatar={<SettingsIcon />}
            title="Configuración General"
            subheader="Preferencias básicas"
          />
          <CardContent>
            <FormControl component="fieldset" fullWidth>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.emailEnabled}
                      onChange={(e) =>
                        handlePreferenceChange("emailEnabled", e.target.checked)
                      }
                    />
                  }
                  label="Notificaciones por Email"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.inAppEnabled}
                      onChange={(e) =>
                        handlePreferenceChange("inAppEnabled", e.target.checked)
                      }
                    />
                  }
                  label="Notificaciones en la Aplicación"
                />
                {/*<FormControlLabel
                  control={
                    <Switch
                      checked={preferences.pushEnabled}
                      onChange={(e) =>
                        handlePreferenceChange("pushEnabled", e.target.checked)
                      }
                    />
                  }
                  label="Notificaciones Push"
                />*/}
              </FormGroup>

              {/* Espaciado adicional */}
              <Box sx={{ mt: 2 }} />

              {/* Campo de Email del Usuario */}
              <TextField
                fullWidth
                label="Email para Notificaciones"
                type="email"
                value={preferences.userEmail || ""}
                onChange={(e) =>
                  handlePreferenceChange("userEmail", e.target.value)
                }
                placeholder="tu-email@ejemplo.com"
                InputProps={{
                  startAdornment: (
                    <EmailIcon sx={{ mr: 1, color: "action.active" }} />
                  ),
                }}
              />
            </FormControl>
          </CardContent>
        </Card>

        {/* Configuración de Digest */}
        <Card sx={{ height: "100%" }}>
          <CardHeader
            avatar={<EmailIcon />}
            title="Resúmenes por Email"
            subheader="Digest diario y semanal"
          />
          <CardContent>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.dailyDigestEnabled}
                    onChange={(e) =>
                      handlePreferenceChange(
                        "dailyDigestEnabled",
                        e.target.checked
                      )
                    }
                  />
                }
                label="Resumen Diario"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.weeklyDigestEnabled}
                    onChange={(e) =>
                      handlePreferenceChange(
                        "weeklyDigestEnabled",
                        e.target.checked
                      )
                    }
                  />
                }
                label="Resumen Semanal"
              />
              <FieldBox label="Hora del resumen">
                <CustomTimePicker
                  value={timeStringToDayjs(preferences.digestTime)}
                  onChange={(value) => handleTimeFieldChange("digestTime", value)}
                />
              </FieldBox>
            </Stack>
          </CardContent>
        </Card>

        {/* Horarios de Silencio */}
        <Card sx={{ height: "100%" }}>
          <CardHeader
            avatar={<ScheduleIcon />}
            title="Horarios de Silencio"
            subheader="Cuándo no recibir notificaciones"
          />
          <CardContent>
            <Stack spacing={2}>
              {/* Espaciado adicional después del título */}
              <Box sx={{ mt: 1 }} />

              <FieldBox label="Inicio del silencio">
                <CustomTimePicker
                  value={timeStringToDayjs(preferences.quietStart)}
                  onChange={(value) => handleTimeFieldChange("quietStart", value)}
                />
              </FieldBox>
              <FieldBox label="Fin del silencio">
                <CustomTimePicker
                  value={timeStringToDayjs(preferences.quietEnd)}
                  onChange={(value) => handleTimeFieldChange("quietEnd", value)}
                />
              </FieldBox>
              {/* <Divider />
              <Typography variant="subtitle2" gutterBottom>
                Días de Silencio
              </Typography>
              <FormGroup>
                {daysOfWeek.map((day) => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Switch
                        checked={preferences.quietDays.includes(day.value)}
                        onChange={() => handleQuietDayToggle(day.value)}
                        size="small"
                      />
                    }
                    label={day.label}
                  />
                ))}
              </FormGroup> */}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardHeader
          avatar={<NotificationsIcon />}
          title="Configuración por Tipo"
          subheader="Personaliza cada tipo de notificación"
        />
        <CardContent>
          <Box
            sx={{
              columnCount: { xs: 1, sm: 2, md: 3, lg: 4 },
              columnGap: { xs: 2, sm: 2.5 },
            }}
          >
            {notificationTypes.map((type) => (
              <Box
                key={type.value}
                sx={{
                  breakInside: "avoid",
                  display: "inline-block",
                  width: "100%",
                  mb: 2,
                }}
              >
                <Paper sx={{ p: 2, height: "100%" }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {type.label}
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={
                            preferences.typeConfigs[type.value]?.enabled ??
                            true
                          }
                          onChange={(e) =>
                            handleTypeConfigChange(
                              type.value,
                              "enabled",
                              e.target.checked
                            )
                          }
                          size="small"
                          disabled={
                            !preferences.emailEnabled &&
                            !preferences.inAppEnabled
                          }
                        />
                      }
                      label="Habilitado"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={
                            (preferences.emailEnabled &&
                              preferences.typeConfigs[type.value]
                                ?.emailEnabled) ??
                            true
                          }
                          onChange={(e) =>
                            handleTypeConfigChange(
                              type.value,
                              "emailEnabled",
                              e.target.checked
                            )
                          }
                          size="small"
                          disabled={!preferences.emailEnabled}
                        />
                      }
                      label="Email"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={
                            (preferences.inAppEnabled &&
                              preferences.typeConfigs[type.value]
                                ?.inAppEnabled) ??
                            true
                          }
                          onChange={(e) =>
                            handleTypeConfigChange(
                              type.value,
                              "inAppEnabled",
                              e.target.checked
                            )
                          }
                          size="small"
                          disabled={!preferences.inAppEnabled}
                        />
                      }
                      label="En App"
                    />
                  </FormGroup>
                </Paper>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
