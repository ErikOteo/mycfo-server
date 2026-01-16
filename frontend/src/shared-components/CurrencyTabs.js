import React from "react";
import { Box, ToggleButtonGroup, ToggleButton } from "@mui/material";

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

const CurrencyTabs = ({ value, onChange, sx }) => {
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
        color="primary"
      >
        <ToggleButton value="ARS">Pesos (ARS)</ToggleButton>
        <ToggleButton value="USD">Dólares (USD)</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default CurrencyTabs;
