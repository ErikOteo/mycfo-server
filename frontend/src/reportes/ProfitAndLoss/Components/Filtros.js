import React from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

const Filtros = ({ selectedYear, onYearChange }) => {
    const años = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="anio-label">Año</InputLabel>
                <Select
                    labelId="anio-label"
                    id="anio-select"
                    value={selectedYear}
                    onChange={onYearChange}
                    label="Año"
                >
                    {años.map((año) => (
                        <MenuItem key={año} value={año}>{año}</MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

export default Filtros;
