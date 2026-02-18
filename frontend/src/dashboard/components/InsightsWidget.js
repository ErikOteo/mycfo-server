import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import FiberManualRecordRoundedIcon from "@mui/icons-material/FiberManualRecordRounded";
import { useTheme } from "@mui/material/styles";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import API_CONFIG from "../../config/api-config";

const InsightsWidget = ({ currency = "ARS" }) => {
  const theme = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);
  const today = React.useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = React.useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = React.useState(
    today.getMonth() + 1,
  ); // 1-12
  const monthName = React.useCallback((m) => {
    const names = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return names[Math.max(0, Math.min(11, m - 1))];
  }, []);
  const analysisMonth = selectedMonth;
  const analysisYear = selectedYear;

  const markdownRaw =
    data && typeof data.reporte_markdown === "string"
      ? data.reporte_markdown.trim()
      : "";
  const markdown = React.useMemo(() => {
    if (!markdownRaw) return "";
    return markdownRaw.replace(/```json[\s\S]*?```/gi, "").trim();
  }, [markdownRaw]);

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
          (value) => typeof value === "string" && value.trim().length > 0,
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

  const mdComponents = React.useMemo(
    () => ({
      h2: ({ node, ...props }) => (
        <Typography
          variant="h6"
          sx={{ mt: 2, mb: 1, fontWeight: 700 }}
          {...props}
        />
      ),
      h3: ({ node, ...props }) => (
        <Typography
          variant="subtitle1"
          sx={{
            mt: 1.5,
            mb: 0.75,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
          {...props}
        />
      ),
      p: ({ node, ...props }) => (
        <Typography
          variant="body2"
          sx={{ lineHeight: 1.6, mb: 1 }}
          {...props}
        />
      ),
      ul: ({ node, ...props }) => (
        <Box component="ul" sx={{ pl: 2, mb: 1 }} {...props} />
      ),
      ol: ({ node, ...props }) => (
        <Box component="ol" sx={{ pl: 2, mb: 1 }} {...props} />
      ),
      li: ({ node, children, ...props }) => (
        <Box component="li" sx={{ mb: 0.4, lineHeight: 1.5 }} {...props}>
          {children}
        </Box>
      ),
      table: ({ node, ...props }) => (
        <TableContainer
          sx={{
            my: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            overflowX: "auto",
          }}
        >
          <Table size="small" {...props} />
        </TableContainer>
      ),
      thead: (props) => <TableHead {...props} />,
      tbody: (props) => <TableBody {...props} />,
      tr: (props) => <TableRow {...props} />,
      th: ({ node, ...props }) => (
        <TableCell
          {...props}
          sx={{
            fontWeight: 700,
            bgcolor: (theme) => theme.palette.action.hover,
          }}
          component="th"
        />
      ),
      td: (props) => <TableCell {...props} />,
      code: ({ inline, className, children, ...props }) => {
        const txt = String(children);
        const isJson =
          className?.includes("language-json") ||
          (!inline && /^\s*[\[{][\s\S]*[\]}]\s*$/.test(txt));
        if (!inline && isJson) return null;
        const isShortPlain = txt.length <= 30 && /^[A-Za-z0-9_\-]+$/.test(txt);
        if (inline || isShortPlain) {
          return (
            <Typography
              component="span"
              variant="body2"
              sx={{ fontWeight: 600 }}
              {...props}
            >
              {txt}
            </Typography>
          );
        }
        const isCompactBlock = txt.length <= 120 && !txt.includes("\n");
        if (isCompactBlock) {
          return (
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, mb: 1 }}
              {...props}
            >
              {txt}
            </Typography>
          );
        }
        return (
          <Box
            component="pre"
            sx={{
              bgcolor: (theme) => theme.palette.action.hover,
              p: 1,
              borderRadius: 1,
              overflowX: "auto",
            }}
            {...props}
          >
            <Box component="code">{txt}</Box>
          </Box>
        );
      },
      hr: () => <Divider sx={{ my: 2 }} />,
    }),
    [],
  );

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const baseUrl = API_CONFIG.IA;
      const params = new URLSearchParams();
      params.set("anio", selectedYear);
      params.set("mes", selectedMonth);
      params.set("moneda", currency || "ARS");
      const headers = { "Content-Type": "application/json" };
      const sub = sessionStorage.getItem("sub");
      const token = sessionStorage.getItem("accessToken");
      if (sub) headers["X-Usuario-Sub"] = sub;
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${baseUrl}/ia/insights?${params.toString()}`, {
        method: "POST",
        headers,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json) {
        const message =
          (json && (json.error || json.detalle || json.message)) ||
          `HTTP ${res.status}`;
        throw new Error(message);
      }
      setData(json);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        boxShadow: theme.shadows[2],
      }}
    >
      <CardHeader
        title={
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Diagnóstico financiero con IA
            </Typography>
            <Chip label="IA" size="small" color="info" />
          </Stack>
        }
        subheader={
          <Typography variant="body2" color="text.secondary">
            Resumen automático de tu situación. Elige mes y año, luego genera el
            diagnóstico con IA.
          </Typography>
        }
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Grid
          container
          spacing={1}
          sx={{ mb: 1 }}
          justifyContent="center"
          alignItems="center"
        >
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Mes"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              SelectProps={{ fullWidth: true }}
              sx={{ width: "100%" }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <MenuItem key={m} value={m}>
                  {monthName(m)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              fullWidth
              size="small"
              label="Año"
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              sx={{ width: "100%" }}
            />
          </Grid>
        </Grid>
        <Button
          variant="contained"
          onClick={handleRun}
          disabled={loading}
          fullWidth
          sx={{ mb: 2 }}
        >
          {loading ? "Analizando…" : "Generar reporte con IA"}
        </Button>
        {loading ? (
          <Stack spacing={1}>
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="rectangular" height={14} />
            <Skeleton variant="rectangular" height={14} />
            <Skeleton variant="rectangular" height={14} width="70%" />
          </Stack>
        ) : error ? (
          <Alert severity="error">
            No pudimos generar el reporte para el periodo elegido. Puede que no
            haya datos suficientes o haya un problema de conexion. Detalle
            tecnico: {error}
          </Alert>
        ) : data ? (
          <Stack spacing={1.25}>
            {data.alerta ? (
              <Alert severity="warning" variant="outlined">
                Indicadores financieros en observación.
              </Alert>
            ) : null}
            <Box
              sx={{
                p: 1.25,
                borderRadius: 1.5,
                bgcolor: theme.palette.action.hover,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Periodo de análisis: {monthName(analysisMonth)} {analysisYear} ·
                Moneda: {currency}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Seleccionado: {monthName(selectedMonth)} {selectedYear}
              </Typography>
            </Box>
            {markdown ? (
              <Box
                sx={(theme) => ({
                  bgcolor: theme.palette.action.hover,
                  borderRadius: 1.5,
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                })}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={mdComponents}
                >
                  {markdown}
                </ReactMarkdown>
              </Box>
            ) : (
              <>
                {summaryLines.length > 0 ? (
                  summaryLines.map((line, idx) => (
                    <Typography key={idx} variant="body2">
                      {line}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2">
                    No hay resumen disponible.
                  </Typography>
                )}

                {detalleLines.length > 0 && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      borderColor: theme.palette.divider,
                      bgcolor: theme.palette.background.paper,
                    }}
                  >
                    <Typography variant="overline" color="text.secondary">
                      Detalle del mes
                    </Typography>
                    <List dense sx={{ pl: 1, mt: 0.5 }}>
                      {detalleLines.map((line, idx) => (
                        <ListItem key={`det-${idx}`} sx={{ py: 0.25 }}>
                          <ListItemIcon sx={{ minWidth: 18, mt: "2px" }}>
                            <FiberManualRecordRoundedIcon
                              sx={{ fontSize: 8 }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primaryTypographyProps={{ variant: "body2" }}
                            primary={line}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}

                {(senalesEntries.length > 0 ||
                  riesgos.length > 0 ||
                  tips.length > 0) && (
                  <Grid container spacing={1}>
                    {senalesEntries.length > 0 && (
                      <Grid item xs={12} md={6}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            borderColor: theme.palette.divider,
                            bgcolor: theme.palette.action.hover,
                          }}
                        >
                          <Typography variant="overline" color="text.secondary">
                            Señales
                          </Typography>
                          <List dense sx={{ pl: 1, mt: 0.5 }}>
                            {senalesEntries.map(([key, value]) => (
                              <ListItem key={key} sx={{ py: 0.25 }}>
                                <ListItemIcon sx={{ minWidth: 18, mt: "2px" }}>
                                  <FiberManualRecordRoundedIcon
                                    sx={{
                                      fontSize: 8,
                                      color: theme.palette.info.main,
                                    }}
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primaryTypographyProps={{ variant: "body2" }}
                                  primary={
                                    <span>
                                      <b>
                                        {key.charAt(0).toUpperCase() +
                                          key.slice(1)}
                                        :{" "}
                                      </b>
                                      {value}
                                    </span>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      </Grid>
                    )}
                    {riesgos.length > 0 && (
                      <Grid item xs={12} md={6}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            borderColor: theme.palette.divider,
                            bgcolor: theme.palette.background.paper,
                          }}
                        >
                          <Typography variant="overline" color="text.secondary">
                            Riesgos
                          </Typography>
                          <List dense sx={{ pl: 1, mt: 0.5 }}>
                            {riesgos.map((item, idx) => (
                              <ListItem key={`risk-${idx}`} sx={{ py: 0.25 }}>
                                <ListItemIcon sx={{ minWidth: 18, mt: "2px" }}>
                                  <FiberManualRecordRoundedIcon
                                    sx={{
                                      fontSize: 8,
                                      color: theme.palette.warning.main,
                                    }}
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primaryTypographyProps={{ variant: "body2" }}
                                  primary={item}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      </Grid>
                    )}
                    {tips.length > 0 && (
                      <Grid item xs={12} md={6}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            borderColor: theme.palette.divider,
                            bgcolor: theme.palette.background.paper,
                          }}
                        >
                          <Typography variant="overline" color="text.secondary">
                            Acciones sugeridas
                          </Typography>
                          <List dense sx={{ pl: 1, mt: 0.5 }}>
                            {tips.slice(0, 6).map((item, idx) => (
                              <ListItem key={`tip-${idx}`} sx={{ py: 0.25 }}>
                                <ListItemIcon sx={{ minWidth: 18, mt: "2px" }}>
                                  <FiberManualRecordRoundedIcon
                                    sx={{
                                      fontSize: 8,
                                      color: theme.palette.success.main,
                                    }}
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primaryTypographyProps={{ variant: "body2" }}
                                  primary={item}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                )}
              </>
            )}
          </Stack>
        ) : (
          <></>
        )}
      </CardContent>
    </Card>
  );
};

export default InsightsWidget;
