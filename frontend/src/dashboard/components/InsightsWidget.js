import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import API_CONFIG from "../../config/api-config";

const InsightsWidget = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);
  const summaryLines =
    data && typeof data.diagnostico_corto === "string"
      ? data.diagnostico_corto
          .split(/\n+/)
          .map((line) => line.trim())
          .filter(Boolean)
      : [];
  const senalesEntries =
    data && data.senales
      ? Object.entries(data.senales).filter(([, value]) => Boolean(value))
      : [];
  const detalleLines =
    data && data.detalles
      ? Object.values(data.detalles).filter(
          (value) => typeof value === "string" && value.trim().length > 0
        )
      : [];
  const riesgos =
    Array.isArray(data?.riesgos_clave) && data.riesgos_clave.length > 0
      ? data.riesgos_clave.filter(Boolean)
      : [];
  const tips =
    Array.isArray(data?.tips) && data.tips.length > 0
      ? data.tips.filter(Boolean)
      : [];

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const baseUrl = API_CONFIG.IA;
      const now = new Date();
      const params = new URLSearchParams();
      params.set("anio", now.getFullYear());
      params.set("mes", now.getMonth() + 1);
      const headers = { "Content-Type": "application/json" };
      const sub = sessionStorage.getItem('sub');
      const token = sessionStorage.getItem('accessToken');
      if (sub) headers['X-Usuario-Sub'] = sub;
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${baseUrl}/ia/insights?${params.toString()}`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ height: "100%", display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Análisis IA"
        subheader="Diagnóstico automático de tu situación"
        subheaderTypographyProps={{
          sx: (theme) => ({
            color: theme.vars
              ? `rgba(${theme.vars.palette.text.primaryChannel} / 1)`
              : theme.palette.text.primary,
          }),
        }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        {loading ? (
          <Skeleton variant="rectangular" height={180} />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : data ? (
          <Stack spacing={1}>
            {data.alerta ? (
              <Alert severity="warning" variant="outlined">
                Indicadores financieros en observacion.
              </Alert>
            ) : null}
            {summaryLines.length > 0 ? (
              summaryLines.map((line, idx) => (
                <Typography key={idx} variant="body2">
                  {line}
                </Typography>
              ))
            ) : (
              <Typography variant="body2">No hay resumen disponible.</Typography>
            )}
            {detalleLines.length > 0 ? (
              <Stack spacing={0.25}>
                <Typography variant="caption" color="text.secondary">
                  Detalle del mes
                </Typography>
                {detalleLines.map((line, idx) => (
                  <Typography key={`det-${idx}`} variant="body2">
                    - {line}
                  </Typography>
                ))}
              </Stack>
            ) : null}
            {senalesEntries.length > 0 ? (
              <Stack spacing={0.25}>
                <Typography variant="caption" color="text.secondary">
                  Señales
                </Typography>
                {senalesEntries.map(([key, value]) => (
                  <Typography key={key} variant="body2">
                    <b>{key.charAt(0).toUpperCase() + key.slice(1)}:</b> {value}
                  </Typography>
                ))}
              </Stack>
            ) : null}
            {riesgos.length > 0 ? (
              <Stack spacing={0.25}>
                <Typography variant="caption" color="text.secondary">
                  Riesgos clave
                </Typography>
                {riesgos.map((item, idx) => (
                  <Typography key={`risk-${idx}`} variant="body2">
                    - {item}
                  </Typography>
                ))}
              </Stack>
            ) : null}
            {tips.length > 0 ? (
              <Stack spacing={0.25}>
                <Typography variant="caption" color="text.secondary">
                  Recomendaciones
                </Typography>
                {tips.slice(0, 4).map((item, idx) => (
                  <Typography key={`tip-${idx}`} variant="body2">
                    - {item}
                  </Typography>
                ))}
              </Stack>
            ) : null}
          </Stack>
        ) : (
          <Typography
            variant="body2"
            sx={(theme) => ({
              color: theme.vars
                ? `rgba(${theme.vars.palette.text.primaryChannel} / 1)`
                : theme.palette.text.primary,
            })}
          >
            Presiona "Interpretar situación" para obtener el análisis con IA.
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, justifyContent: "flex-end", alignItems: "center" }}>
        <Button variant="contained" onClick={handleRun} disabled={loading}>
          Interpretar situación
        </Button>
      </CardActions>
    </Card>
  );
};

export default InsightsWidget;
