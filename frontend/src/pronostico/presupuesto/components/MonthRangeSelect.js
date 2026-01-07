import * as React from 'react';
import {
  Box,
  Button,
  Popover,
  Typography,
  styled
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const SHORT_MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const SelectButton = styled(Button)(({ theme }) => ({
  width: '100%',
  justifyContent: 'flex-start',
  textTransform: 'none',
  color: (theme.vars || theme).palette.text.primary,
  backgroundColor: (theme.vars || theme).palette.background.default,
  border: `1px solid ${(theme.vars || theme).palette.divider}`,
  '&:hover': {
    backgroundColor: (theme.vars || theme).palette.action.hover,
  },
  padding: theme.spacing(1),
}));

function formatMonthLabel(ym) {
  if (!ym) return '';
  const [year, month] = ym.split('-');
  const monthIndex = Number(month) - 1;
  return `${SHORT_MONTH_LABELS[monthIndex]} ${year}`;
}

function formatRangeLabel(from, to) {
  if (!from && !to) return 'Mes inicial - Mes final';
  if (!to) return `${formatMonthLabel(from)} - ...`;
  return `${formatMonthLabel(from)} - ${formatMonthLabel(to)}`;
}

export default function MonthRangeSelect({ value = {}, onChange }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [tempSelection, setTempSelection] = React.useState({ from: value.from, to: value.to });
  const [yearOffset, setYearOffset] = React.useState(0);
  
  // Reset temp selection when value changes externally
  React.useEffect(() => {
    setTempSelection({ from: value.from, to: value.to });
  }, [value.from, value.to]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    // Reset temp selection to current value when closing without confirming
    setTempSelection({ from: value.from, to: value.to });
  };

  const handleMonthClick = (yearMonth) => {
    if (!tempSelection.from || tempSelection.to) {
      // Start new selection
      setTempSelection({ from: yearMonth, to: null });
    } else {
      // Complete selection
      const fromDate = new Date(tempSelection.from + '-01');
      const clickedDate = new Date(yearMonth + '-01');
      
      if (clickedDate < fromDate) {
        // If clicking before current from, restart selection
        setTempSelection({ from: yearMonth, to: null });
      } else {
        setTempSelection({ from: tempSelection.from, to: yearMonth });
      }
    }
  };

  const handleConfirm = () => {
    if (tempSelection.from && tempSelection.to) {
      onChange(tempSelection);
      handleClose();
    }
  };

  const handleClear = () => {
    const emptySelection = { from: null, to: null };
    setTempSelection(emptySelection);
    onChange(emptySelection);
  };

  // Mostrar solo 2 años basados en el offset
  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 2 }, (_, i) => currentYear + yearOffset + i);
  }, [yearOffset]);

  const handleNavigateYears = (direction) => {
    setYearOffset(prev => prev + (direction === 'up' ? -2 : 2));
  };

  const isBetween = (key, from, to) => {
    if (!from || !to) return false;
    return key > from && key < to;
  };

  return (
    <>
      <SelectButton 
        onClick={handleOpen}
        endIcon={<ArrowDropDownIcon />}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          '& .MuiButton-endIcon': {
            marginLeft: 'auto',
            marginRight: 0
          }
        }}
      >
        <Typography
          sx={{
            color: (!value.from && !value.to) ? 'text.secondary' : 'text.primary',
            flex: 1,
            textAlign: 'left'
          }}
        >
          {formatRangeLabel(value.from, value.to)}
        </Typography>
      </SelectButton>
      
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: {
              width: 'fit-content',
              minWidth: 'unset',
              maxWidth: 'none',
              p: 1.5,
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Botón navegación arriba */}
          <Button
            fullWidth
            size="small"
            onClick={() => handleNavigateYears('up')}
            sx={{ 
              borderRadius: 1,
              minHeight: '20px',
              height: '20px',
              py: 0,
              color: 'text.secondary'
            }}
          >
            ⮝
          </Button>

          {/* Años visibles */}
          {years.map(year => (
            <Box 
              key={year} 
              sx={{ 
                mb: 0.5,
                animation: 'fadeIn 0.3s ease-in-out',
                '@keyframes fadeIn': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(10px)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)'
                  }
                }
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                {year}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 1 }}>
                {Array.from({ length: 12 }, (_, monthIndex) => {
                  const month = String(monthIndex + 1).padStart(2, '0');
                  const yearMonth = `${year}-${month}`;
                  
                  return (
                    <Button
                      key={monthIndex}
                      size="small"
                      onClick={() => handleMonthClick(yearMonth)}
                      variant={yearMonth === tempSelection.from || yearMonth === tempSelection.to ? "contained" : "outlined"}
                      color={yearMonth === tempSelection.from || yearMonth === tempSelection.to ? "primary" : "inherit"}
                      sx={[
                        { minWidth: 72 },
                        isBetween(yearMonth, tempSelection.from, tempSelection.to)
                          ? ((t) => {
                              const p = (t.vars || t).palette;
                              const dark = t.palette.mode === 'dark';

                              // 1) Mejor caso: usar el canal para rgba(... / opacity)
                              const bg =
                                p.primary && p.primary.mainChannel
                                  ? `rgba(${p.primary.mainChannel} / ${dark ? 0.22 : 0.15})`
                                  // 2) Fallback seguro sin alpha() (usa un seleccionado neutro del theme)
                                  : p.action?.selected ?? (dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)');

                              return {
                                bgcolor: bg,
                                color: p.primary.main,        // soporta var(...)
                                borderColor: p.primary.main,  // soporta var(...)
                                // resalta el “marco” en dark sin romper layout
                                boxShadow: `inset 0 0 0 1.5px ${p.primary.main}`,
                              };
                            })
                          : {}
                      ]}
                    >
                      {SHORT_MONTH_LABELS[monthIndex]}
                    </Button>
                  );
                })}
              </Box>
            </Box>
          ))}

          {/* Botón navegación abajo */}
          <Button
            fullWidth
            size="small"
            onClick={() => handleNavigateYears('down')}
            sx={{ 
              borderRadius: 1,
              minHeight: '20px',
              height: '20px',
              py: 0,
              color: 'text.secondary'
            }}
          >
            ⮟
          </Button>

          {/* Botones de acción siempre visibles */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            mt: 1, 
            justifyContent: 'flex-end',
            borderTop: 1,
            borderColor: 'divider',
            pt: 1
          }}>
            <Button 
              size="small"
              onClick={handleClear}
              color="inherit"
            >
              Limpiar
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleConfirm}
              disabled={!tempSelection.from || !tempSelection.to}
              sx={{
                minWidth: '100px',
                '&.Mui-disabled': {
                  backgroundColor: 'grey.200',
                  color: 'grey.600',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: 'grey.200'
                  }
                }
              }}
            >
              Confirmar
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
}