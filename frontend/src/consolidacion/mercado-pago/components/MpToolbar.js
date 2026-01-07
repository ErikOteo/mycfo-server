import React from "react";
import {
  Toolbar,
  Stack,
  Chip,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Button,
  Divider,
  Box,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import IosShareIcon from "@mui/icons-material/IosShare";
import { PAYMENT_STATUS } from "../catalogs";
import CustomDatePicker from "../../../shared-components/CustomDatePicker";
import dayjs from "dayjs";

export default function MpToolbar({
  accountLabel,
  filters,
  onFiltersChange,
  onOpenImport,
  onOpenConfig,
  onUnlink,
  onRefresh,
  onExport,
  onBillSelected,
  selectedCount = 0,
  unlinkBusy = false, // <-- nuevo: deshabilita el botón mientras corre
}) {
  const set = (patch) => onFiltersChange({ ...filters, ...patch });

  const parseDate = (value) => {
    if (!value) return null;
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : null;
  };

  const handleDateChange = (field) => (value) => {
    set({
      [field]: value && value.isValid() ? value.format("YYYY-MM-DD") : "",
    });
  };

  const fieldLabelSx = {
    fontWeight: 600,
    color: "text.secondary",
    mb: 0.5,
    display: "block",
  };

  const DateField = ({ label, value, onChange }) => (
    <Box sx={{ minWidth: { xs: "100%", sm: 200 } }}>
      <Typography variant="caption" sx={fieldLabelSx}>
        {label}
      </Typography>
      <CustomDatePicker value={value} onChange={onChange} />
    </Box>
  );

  const SearchField = ({ value, onChange }) => (
    <Box sx={{ minWidth: { xs: "100%", sm: 260 } }}>
      <Typography variant="caption" sx={fieldLabelSx}>
        Buscar
      </Typography>
      <TextField
        size="small"
        placeholder="Buscar..."
        value={value}
        onChange={onChange}
        fullWidth
      />
    </Box>
  );

  return (
    <Toolbar
      sx={{
        p: 2,
        gap: 2,
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        "& .MuiTextField-root": { minWidth: { xs: "100%", sm: 180 } },
      }}
    >
      {/* Identificación de cuenta */}
      <Box
        sx={{
          mr: 1,
          p: 2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          minWidth: { xs: "100%", sm: 220 },
        }}
      >
        <Stack spacing={1} alignItems="center">
          <Chip
            label={accountLabel}
            color="primary"
            variant="outlined"
            sx={{ fontSize: "0.9rem", fontWeight: 600 }}
          />
          <Tooltip title={unlinkBusy ? "Desvinculando..." : "Desvincular"}>
            <span>
              <Button
                variant="outlined"
                startIcon={<LinkOffIcon />}
                onClick={onUnlink}
                disabled={unlinkBusy}
                size="small"
                sx={{
                  borderColor: "divider",
                  color: "text.primary",
                  bgcolor: "background.paper",
                  minWidth: 0,
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "action.hover",
                  },
                }}
              >
                Desvincular
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Filtros */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        alignItems="center"
        justifyContent="center"
        sx={{ flexGrow: 1 }}
      >
        <DateField
          label="Desde"
          value={parseDate(filters.from)}
          onChange={handleDateChange("from")}
        />
        <DateField
          label="Hasta"
          value={parseDate(filters.to)}
          onChange={handleDateChange("to")}
        />
        {/* Filtro de estado oculto temporalmente */}
        {/* <TextField
          size="small"
          select
          label="Estado"
          sx={{ minWidth: 160 }}
          value={filters.payStatus}
          onChange={(e) => set({ payStatus: e.target.value })}
        >
          <MenuItem value="">Todos</MenuItem>
          {PAYMENT_STATUS.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </TextField> */}
        <SearchField
          value={filters.q}
          onChange={(e) => set({ q: e.target.value })}
        />
        {/* Botón de refrescar oculto temporalmente */}
        {/* <Tooltip title="Refrescar">
          <IconButton onClick={onRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip> */}

        {/* <Tooltip title="Configuración">
          <IconButton onClick={onOpenConfig}>
            <SettingsIcon />
          </IconButton>
        </Tooltip> */}

      </Stack>

      {/* Acciones */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<CloudDownloadIcon />}
          onClick={onOpenImport}
          sx={{
            px: 4,
            py: 1.4,
            fontSize: "1rem",
            ml: 0,
          }}
        >
          Importar
        </Button>
        {/* Botones de facturar y exportar ocultos temporalmente */}
        {/* <Button
          variant="contained"
          color="inherit"
          startIcon={<ReceiptLongIcon />}
          disabled={!selectedCount}
          onClick={onBillSelected}
          sx={{
            bgcolor: "#fff",
            color: "#222",
            boxShadow: 1,
            "&:hover": { bgcolor: "#f5f5f5" },
          }}
        >
          Facturar ({selectedCount})
        </Button>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<IosShareIcon />}
          onClick={onExport}
          sx={{
            bgcolor: "#fff",
            color: "#222",
            boxShadow: 1,
            "&:hover": { bgcolor: "#f5f5f5" },
          }}
        >
          Exportar
        </Button> */}
      </Box>
    </Toolbar>
  );
}
