import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { formatCurrencyAR } from "../../utils/formatters";

const BillingWidget = ({
  data,
  loading = false,
  error = null,
  onRetry,
  onNavigate,
}) => {
  if (loading) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader title="Facturación" subheader="Generando comprobantes..." />
        <CardContent>
          <Skeleton variant="rectangular" height={180} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader title="Facturación" />
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Alert severity="error">{error}</Alert>
          {onRetry ? (
            <Button variant="outlined" onClick={onRetry}>
              Reintentar
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const invoices = data?.invoices ?? [];

  return (
    <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        title="Facturación"
        subheader="Últimos comprobantes emitidos y pendientes de envío"
      />
      <CardContent sx={{ flexGrow: 1 }}>
        {invoices.length === 0 ? (
          <Stack spacing={2} alignItems="flex-start">
            <Typography variant="body2" color="text.secondary">
              Todavía no emitiste facturas este mes. Creá tu primera factura para empezar a cobrar.
            </Typography>
            {onNavigate ? (
              <Button variant="contained" onClick={onNavigate}>
                Cargar factura
              </Button>
            ) : null}
          </Stack>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.slice(0, 5).map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>{invoice.number}</TableCell>
                    <TableCell>{invoice.customer}</TableCell>
                    <TableCell>
                      {new Date(invoice.date).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell align="right">{formatCurrencyAR(invoice.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
      <CardActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onNavigate} disabled={!onNavigate}>
          Cargar factura
        </Button>
      </CardActions>
    </Card>
  );
};

export default BillingWidget;
