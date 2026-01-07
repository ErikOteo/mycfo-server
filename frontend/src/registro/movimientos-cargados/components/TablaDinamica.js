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
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid #e0e0e0',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
        },
        '& .MuiDataGrid-cell:last-of-type': {
          borderRight: 'none',
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#f5f5f5',
          fontSize: '0.95rem',
          borderTop: '1px solid #e0e0e0',
          borderBottom: '1px solid #e0e0e0',
        },
        '& .MuiDataGrid-columnHeader': {
          borderLeft: '1px solid #e0e0e0',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        },
        '& .MuiDataGrid-columnHeader:first-of-type': {
          borderLeft: 'none',
        },
        '& .MuiDataGrid-columnHeader:last-of-type': {
          borderRight: 'none',
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: 700,
        },
        '& .MuiDataGrid-columnSeparator': {
          opacity: 1,
          visibility: 'visible',
          color: '#d5d5d5',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
        '& .MuiDataGrid-sortIcon': {
          display: 'none',
        },
        '& .MuiDataGrid-columnHeaderTitleContainer': {
          paddingRight: '8px',
          display: 'flex',
          alignItems: 'center',
        },
        '& .MuiDataGrid-columnHeader .MuiDataGrid-iconButtonContainer': {
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '& .MuiDataGrid-columnHeader .MuiIconButton-root': {
          padding: '4px',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '& .MuiDataGrid-menuIcon': {
          fontSize: '16px',
          display: 'block !important',
        },
        '& .MuiDataGrid-columnHeader .MuiDataGrid-iconButtonContainer .MuiIconButton-root:not([aria-label*="menu"])': {
          display: 'none',
        },
      }}
    />
  );
}
