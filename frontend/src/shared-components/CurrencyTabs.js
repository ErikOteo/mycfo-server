import React from "react";
import { Box, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { brand } from "../shared-theme/themePrimitives";

const STORAGE_KEY = "preferredCurrency";
const DEFAULT_CURRENCY = "ARS";

export const getStoredCurrencyPreference = (fallback = DEFAULT_CURRENCY) => {
  if (typeof window === "undefined") return fallback;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) || fallback;
  } catch (_err) {
    return fallback;
  }
};

export const persistCurrencyPreference = (value) => {
  if (typeof window === "undefined" || !value) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, value);
  } catch (_err) {
    // no-op
  }
};

export const usePreferredCurrency = (fallback = DEFAULT_CURRENCY) => {
  const [currency, setCurrency] = React.useState(() =>
    getStoredCurrencyPreference(fallback)
  );

  const handleChange = React.useCallback((nextValue) => {
    if (!nextValue) return;
    setCurrency(nextValue);
    persistCurrencyPreference(nextValue);
  }, []);

  return [currency, handleChange];
};

const CurrencyTabs = ({ value, onChange, sx, disabled }) => {
  const current = value || getStoredCurrencyPreference();

  const handleChange = (_event, newValue) => {
    if (!newValue) return;
    persistCurrencyPreference(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        mb: 2,
        ...sx,
      }}
    >
      <ToggleButtonGroup
        value={current}
        exclusive
        onChange={handleChange}
        disabled={disabled}
        color="standard"
        sx={(theme) => {
          // Forzamos apariencia consistente en ambos modos (igual que light).
          const isDark = false;
          const highlight = `radial-gradient(circle at 28% 28%, ${alpha(
            theme.palette.common.white,
            0.35
          )} 0%, transparent 36%)`;
          const gradient = `linear-gradient(135deg, ${brand[400]}, ${brand[500]})`;
          const track = "rgba(0,0,0,0.06)";
          const shadow = "0 4px 16px rgba(0,0,0,0.12)";
          const lightGroup = {
            position: "relative",
            overflow: "hidden",
            backgroundColor: track,
            boxShadow: shadow,
            borderRadius: 999,
            border: "none",
            padding: "2px",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 2,
              left: -2,
              width: disabled ? "calc(100% + 4px)" : "calc(50% + 4px)", // solapa 2px para evitar línea central
              height: "calc(100% - 4px)",
              backgroundImage: `${highlight}, ${gradient}`,
              borderRadius: "inherit",
              boxShadow: "none",
              transition: "transform 220ms ease",
              transform: disabled
                ? "translateX(0%)"
                : current === "USD"
                  ? "translateX(100%)"
                  : "translateX(0%)",
              zIndex: 0,
              backgroundSize: "120% 120%",
              backgroundPosition: "50% 50%",
            },
            "& .MuiToggleButton-root": {
              position: "relative",
              zIndex: 1,
              backgroundColor: "transparent !important",
              border: "none",
              boxShadow: "none !important",
              "&.Mui-selected": {
                backgroundColor: "transparent !important",
                boxShadow: "none !important",
              },
              "&:hover": {
                backgroundColor: "transparent",
                boxShadow: "none",
              },
            },
            "& .MuiToggleButtonGroup-grouped": {
              border: "none",
            },
            "& .MuiToggleButtonGroup-grouped:not(:first-of-type)": {
              borderLeft: "none",
              marginLeft: 0, // elimina el solapamiento que deja una línea visible
            },
            "& .Mui-selected": {
              color: "inherit !important",
            },
          };
          const darkGroup = {
            position: "relative",
            overflow: "hidden",
            backgroundColor: track,
            boxShadow: shadow,
            borderRadius: 999,
            border: "none",
            padding: "2px",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 2,
              left: -2,
              width: "calc(50% + 4px)", // solapa 2px para evitar línea central
              height: "calc(100% - 4px)",
              backgroundImage: `${highlight}, ${gradient}`,
              borderRadius: "inherit",
              boxShadow: "none",
              transition: "transform 220ms ease",
              transform:
                current === "USD"
                  ? "translateX(100%)"
                  : "translateX(0%)",
              zIndex: 0,
              backgroundSize: "120% 120%",
              backgroundPosition: "50% 50%",
            },
            "& .MuiToggleButton-root": {
              position: "relative",
              zIndex: 1,
            },
            "& .MuiToggleButtonGroup-grouped": {
              border: "none",
            },
            "& .MuiToggleButtonGroup-grouped:not(:first-of-type)": {
              borderLeft: "none",
              marginLeft: 0, // elimina el solapamiento que deja una línea visible
            },
            "& .Mui-selected": {
              color: "inherit !important",
            },
          };
          return isDark ? darkGroup : lightGroup;
        }}
      >
        {(!disabled || current === 'ARS') && (
          <ToggleButton
            value="ARS"
            sx={(theme) => {
              const inactiveColor =
                theme.palette.mode === "light"
                  ? theme.palette.common.black
                  : theme.palette.grey[700];
              const selectedColor = theme.palette.common.white;
              return {
                color: inactiveColor,
                flex: 1,
                minWidth: 0,
                px: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
                "&&&.Mui-selected": {
                  color: `${selectedColor} !important`,
                },
              };
            }}
          >
            Pesos (ARS)
          </ToggleButton>
        )}
        {(!disabled || current === 'USD') && (
          <ToggleButton
            value="USD"
            sx={(theme) => {
              const inactiveColor =
                theme.palette.mode === "light"
                  ? theme.palette.common.black
                  : theme.palette.grey[700];
              const selectedColor = theme.palette.common.white;
              return {
                color: inactiveColor,
                flex: 1,
                minWidth: 0,
                px: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
                "&&&.Mui-selected": {
                  color: `${selectedColor} !important`,
                },
              };
            }}
          >
            Dólares (USD)
          </ToggleButton>
        )}
      </ToggleButtonGroup>
    </Box>
  );
};

export default CurrencyTabs;
