import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';

/**
 * Componente wrapper para lazy loading de formularios
 * Evita cargar todos los formularios al inicio
 */
const LazyFormWrapper = ({ children }) => {
  return (
    <Suspense fallback={
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 200,
        width: '100%'
      }}>
        <CircularProgress size={40} />
      </Box>
    }>
      {children}
    </Suspense>
  );
};

export default LazyFormWrapper;
