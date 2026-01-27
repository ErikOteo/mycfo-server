import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Chip } from '@mui/material';
import dayjs from 'dayjs';

function calcularAnchoTexto(texto) {
  const promedioPxPorCaracter = 8; // aproximación Roboto
  return texto.length * promedioPxPorCaracter + 24; // padding extra
}

export default function TablaDinamica({
  data,
  onChipClick,
  filterModel,
  onFilterModelChange,
  columnVisibilityModel,
  onColumnVisibilityModelChange
}) {
  // Generar columnas dinámicamente
  const columns = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    return Object.keys(data[0]).map((key) => {
      const header = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();

      // Calcular ancho máximo entre encabezado y datos
      let anchoMax = calcularAnchoTexto(header);
      data.forEach((row) => {
        let valor = row[key];
        if (Array.isArray(valor)) {
          valor = valor.join(', ');
        } else if (
          key.toLowerCase().includes('fecha') ||
          key.toLowerCase().includes('hora') ||
          key.toLowerCase().includes('tiempo')
        ) {
          valor = valor ? dayjs(valor).format('DD/MM/YYYY HH:mm') : '';
        }
        anchoMax = Math.max(anchoMax, calcularAnchoTexto(String(valor ?? '')));
      });

      return {
        field: key,
        headerName: header,
        width: anchoMax,
        renderCell: (params) => {
          // Chips para categorías
          if (key.toLowerCase() === 'categorias' && Array.isArray(params.value)) {
            return (
              <>
                {params.value.map((cat, i) => (
                  <Chip
                    key={i}
                    label={cat}
                    size="small"
                    sx={{ mr: 0.5, cursor: 'pointer' }}
                    onClick={() => onChipClick?.(cat)}
                  />
                ))}
              </>
            );
          }

          // Formatear fecha/hora
          if (
            key.toLowerCase().includes('fecha') ||
            key.toLowerCase().includes('hora') ||
            key.toLowerCase().includes('tiempo')
          ) {
            return params.value
              ? dayjs(params.value).format('DD/MM/YYYY HH:mm')
              : '';
          }

          return params.value;
        },
      };
    });
  }, [data, onChipClick]);

  // Asegurar que cada fila tenga un id
  const rows = React.useMemo(() => {
    if (!data) return [];
    return data.map((row, index) => ({
      id: row.id ?? index,
      ...row,
    }));
  }, [data]);

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      filterModel={filterModel}                          // filtros controlados
      onFilterModelChange={onFilterModelChange}
      columnVisibilityModel={columnVisibilityModel}      // visibilidad columnas controlada
      onColumnVisibilityModelChange={onColumnVisibilityModelChange}
      getRowClassName={(params) =>
        params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
      }
      initialState={{
        pagination: { paginationModel: { pageSize: 20 } },
      }}
      pageSizeOptions={[10, 20, 50]}
      disableColumnResize
      density="compact"
      sx={{
        backgroundColor: "background.paper",
        borderRadius: 2,
        border: "none",
        "& .MuiDataGrid-cell": {
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          display: "flex",
          alignItems: "center",
        },
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.05)"
              : "#f5f5f5",
          color: "text.primary",
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        },
        "& .MuiDataGrid-columnHeader": {
          "&:focus": { outline: "none" },
        },
        "& .MuiDataGrid-sortIcon": {
          display: "none",
        },
        "& .MuiDataGrid-iconButtonContainer": {
          visibility: "hidden",
        },
        "& .MuiDataGrid-columnHeader:hover .MuiDataGrid-iconButtonContainer": {
          visibility: "visible",
        },
        "& .MuiDataGrid-columnHeader .MuiDataGrid-iconButtonContainer .MuiIconButton-root:not([aria-label*='menu'])":
        {
          display: "none",
        },
        "& .MuiDataGrid-row:hover": {
          backgroundColor: (theme) => theme.palette.action.hover,
        },
        "& .MuiDataGrid-row.Mui-selected": {
          backgroundColor: (theme) =>
            `${theme.palette.primary.main}15 !important`,
          "&:hover": {
            backgroundColor: (theme) =>
              `${theme.palette.primary.main}25 !important`,
          },
        },
      }}
    />
  );
}
