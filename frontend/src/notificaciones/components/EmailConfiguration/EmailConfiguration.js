import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Alert,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import axios from "axios";
import API_CONFIG from "../../../config/api-config";

export default function EmailConfiguration() {
  const [emailStatus, setEmailStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const loadEmailStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_CONFIG.NOTIFICACION}/api/email-config/status`
      );
      setEmailStatus(response.data);
      setError(null);
    } catch (err) {
      setError("Error cargando configuración de email");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const testEmailConfiguration = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const response = await axios.post(
        `${API_CONFIG.NOTIFICACION}/api/email-config/test`,
        null,
        {
          params: { userId: 1 },
        }
      );
      setTestResult(response.data);
    } catch (err) {
      setTestResult({
        success: false,
        message:
          err.response?.data?.message || "Error enviando email de prueba",
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    loadEmailStatus();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <Typography variant="body1" color="text.secondary">
          Cargando configuración...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  const isConfigured = emailStatus?.configured;
  const statusColor = isConfigured ? "success" : "warning";
  const statusIcon = isConfigured ? <CheckCircleIcon /> : <ErrorIcon />;

  return (
    <Box sx={{ p: 2 }}>
      <Card>
        <CardHeader
          title="Configuración de Email"
          avatar={<EmailIcon color="primary" />}
          action={
            <Chip
              icon={statusIcon}
              label={isConfigured ? "Configurado" : "No Configurado"}
              color={statusColor}
              variant="outlined"
            />
          }
        />
        <CardContent>
          <Typography variant="body1" gutterBottom>
            {emailStatus?.info}
          </Typography>

          {isConfigured && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Detalles de Configuración
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Servidor SMTP"
                    secondary={`${emailStatus.host}:${emailStatus.port}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Usuario"
                    secondary={emailStatus.username}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SendIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email de Envío"
                    secondary={emailStatus.fromEmail}
                  />
                </ListItem>
              </List>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => setTestDialogOpen(true)}
              disabled={!isConfigured}
            >
              Probar Configuración
            </Button>
            <Button
              variant="outlined"
              startIcon={<InfoIcon />}
              onClick={loadEmailStatus}
            >
              Actualizar Estado
            </Button>
          </Box>

          {!isConfigured && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Configuración Requerida
              </Typography>
              <Typography variant="body2">
                Para enviar emails, necesitas configurar las credenciales de
                email en el archivo <code>application.properties</code> del
                backend.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Pasos:</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="1. Copia application-email-example.properties como application-email.properties" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="2. Configura tus credenciales de email (Gmail, Outlook, etc.)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="3. Reinicia la aplicación" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="4. Prueba la configuración aquí" />
                </ListItem>
              </List>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dialog para probar email */}
      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Probar Configuración de Email</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Se enviará un email de prueba al usuario configurado para verificar
            que la configuración funciona correctamente.
          </Typography>

          {testResult && (
            <Alert
              severity={testResult.success ? "success" : "error"}
              sx={{ mt: 2 }}
            >
              {testResult.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Cerrar</Button>
          <Button
            onClick={testEmailConfiguration}
            variant="contained"
            disabled={testing}
            startIcon={<SendIcon />}
          >
            {testing ? "Enviando..." : "Enviar Email de Prueba"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
