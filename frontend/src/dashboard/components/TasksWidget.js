import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Checkbox from "@mui/material/Checkbox";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";

const severityMap = {
  high: { label: "Alta", color: "error" },
  medium: { label: "Media", color: "warning" },
  low: { label: "Baja", color: "default" },
};

const TasksWidget = ({
  data,
  loading = false,
  error = null,
  onRetry,
  onNavigate,
  onResolve,
}) => {
  if (loading) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader title="Recordatorios" subheader="Buscando pendientes..." />
        <CardContent>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={56} sx={{ mb: 1.5 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader title="Recordatorios" />
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

  const tasks = data ?? [];

  return (
    <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardHeader
        title="Recordatorios"
        subheader="Conciliación, recordatorios y alertas automáticas"
      />
      <CardContent sx={{ flexGrow: 1 }}>
        {tasks.length === 0 ? (
          <Stack spacing={2} alignItems="flex-start">
            <Stack direction="row" spacing={1} alignItems="center">
              <AssignmentTurnedInRoundedIcon color="success" />
              <Typography variant="body2" color="text.secondary">
                Nada pendiente por ahora. ¡Todo al día!
              </Typography>
            </Stack>
            {onRetry ? (
              <Button variant="outlined" onClick={onRetry}>
                Actualizar
              </Button>
            ) : null}
          </Stack>
        ) : (
          <List dense disablePadding>
            {tasks.map((task) => {
              const severity = severityMap[task.severity] ?? severityMap.low;
              return (
                <ListItem
                  key={task.id}
                  sx={{
                    borderColor: "divider",
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderRadius: 2,
                    mb: 1,
                  }}
                  secondaryAction={
                    <Checkbox
                      edge="end"
                      onChange={() => onResolve?.(task)}
                      checked={Boolean(task.completed)}
                    />
                  }
                >
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2">{task.title}</Typography>
                      <Chip size="small" color={severity.color} label={severity.label} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {task.description}
                    </Typography>
                  </Stack>
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
      <CardActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onNavigate} disabled={!onNavigate}>
          Ver más
        </Button>
      </CardActions>
    </Card>
  );
};

export default TasksWidget;
