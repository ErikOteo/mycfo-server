import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Componente personalizado para mostrar un mensaje cuando una tabla no tiene datos.
 * @param {string} message - El mensaje a mostrar.
 */
const CustomNoRowsOverlay = ({ message }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%',
            }}
        >
            <Typography color="text.secondary" variant="body2">
                {message}
            </Typography>
        </Box>
    );
};

export default CustomNoRowsOverlay;
