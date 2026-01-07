import { useTheme, useColorScheme } from "@mui/material/styles";

/**
 * Resolves the actual color mode (light/dark/system) and exposes handy text colors.
 */
export default function useResolvedColorTokens() {
  const theme = useTheme();
  const { mode, systemMode } = useColorScheme();
  const resolvedMode =
    (mode === "system" ? systemMode : mode) || theme.palette.mode || "light";
  const paletteVars = theme.vars?.palette ?? theme.palette ?? {};

  const primaryTextColor =
    resolvedMode === "dark"
      ? paletteVars.common?.white ??
        paletteVars.text?.primary ??
        "rgba(255, 255, 255, 0.9)"
      : paletteVars.common?.black ??
        paletteVars.text?.primary ??
        "rgba(0, 0, 0, 0.88)";

  const secondaryTextColor =
    paletteVars.text?.secondary ??
    (resolvedMode === "dark"
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.6)");

  return { resolvedMode, paletteVars, primaryTextColor, secondaryTextColor };
}
