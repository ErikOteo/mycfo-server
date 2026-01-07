import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";
import { formatCurrencyAR } from "../../utils/formatters";

const CashbackWidget = ({
  data,
  loading = false,
  error = null,
  onRetry,
  onNavigate,
}) => {
  if (loading) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader title="Beneficios & Cashback" subheader="Buscando promos..." />
        <CardContent>
          <Skeleton variant="rectangular" height={140} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader title="Beneficios & Cashback" />
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

  const accumulated = data?.accumulated ?? 0;
  const benefits = data?.benefits ?? [];

  return (
    <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        title="Beneficios & Cashback"
        subheader="Sumá beneficios exclusivos con tus integraciones"
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CardGiftcardRoundedIcon color="success" />
            <Stack>
              <Typography variant="subtitle2" color="text.secondary">
                Cashback acumulado
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {formatCurrencyAR(accumulated)}
              </Typography>
            </Stack>
          </Stack>
          {benefits.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Activá Mercado Pago o integrá tu banco para empezar a acumular beneficios y descuentos.
            </Typography>
          ) : (
            <List dense disablePadding>
              {benefits.map((benefit, index) => (
                <React.Fragment key={benefit.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight={600}>
                          {benefit.title}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="primary.main">
                          {benefit.cta}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < benefits.length - 1 ? <Divider component="li" /> : null}
                </React.Fragment>
              ))}
            </List>
          )}
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onNavigate} disabled={!onNavigate}>
          Ver comercios
        </Button>
      </CardActions>
    </Card>
  );
};

export default CashbackWidget;
