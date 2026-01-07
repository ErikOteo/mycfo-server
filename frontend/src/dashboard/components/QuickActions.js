import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import useResolvedColorTokens from "../useResolvedColorTokens";

const QuickActions = ({ actions = [], loading = false, onAction }) => {
  const { resolvedMode, primaryTextColor } = useResolvedColorTokens();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDarkMode = resolvedMode === "dark";

  if (loading) {
    return (
      <Card variant="outlined" sx={{ width: "100%" }}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Skeleton variant="text" width={160} />
          <Box sx={{ display: "flex", gap: 1 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                variant="rounded"
                width={120}
                height={40}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        backdropFilter: "blur(6px)",
        borderRadius: 2,
        mx: "auto",
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: { xs: "wrap", md: "wrap" },
            overflowX: "visible",
            gap: 1,
            pb: { xs: 0.5, md: 0 },
            justifyContent: { xs: "center", md: "center" },
            alignItems: "center",
            width: "100%",
          }}
        >
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outlined"
              color="primary"
              startIcon={!isMobile ? action.icon : undefined}
              onClick={() => onAction?.(action)}
              sx={{
                flexShrink: 0,
                flex: isMobile ? "1 0 calc(25% - 12px)" : "0 0 auto",
                maxWidth: isMobile ? "25%" : "none",
                borderRadius: 2,
                px: isMobile ? 1 : 2,
                py: isMobile ? 0.75 : 1,
                textTransform: "none",
                minWidth: { xs: 80, md: 150 },
                minHeight: { xs: 56, md: 40 },
                width: isMobile ? "100%" : "auto",
                fontWeight: 600,
                justifyContent: "center",
                "& .MuiButton-startIcon": { margin: isMobile ? 0 : undefined },
                ...(isDarkMode && { color: "#42897f" }),
              }}
              aria-label={action.label}
            >
              {isMobile ? action.icon : action.label}
            </Button>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
