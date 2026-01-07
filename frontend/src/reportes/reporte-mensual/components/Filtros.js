import React, { useEffect, useMemo, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import API_CONFIG from '../../../config/api-config';

const Filtros = ({
                     selectedMonth,
                     selectedYear,
                     onMonthChange,
                     onYearChange,
                     selectedCategoria,
                     onCategoriaChange,
                 }) => {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const años = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    const categoriasBase = ['Alimentos y Bebidas', 'Transporte', 'Vivienda', 'Servicios Básicos', 'Ocio y Entretenimiento', 'Compras Personales', 'Salud', 'Educación', 'Impuestos y Tasas', 'Servicios Financieros', 'Compras de Negocio', 'Otros Egresos', 'Ventas de Productos', 'Prestación de Servicios', 'Cobranzas', 'Transferencias Recibidas', 'Inversiones y Rendimientos', 'Otros Ingresos'];
    const [categoriasExtra, setCategoriasExtra] = useState([]);

    useEffect(() => {
        const baseUrl = API_CONFIG.REGISTRO;
        if (!baseUrl) return;

        fetch(`${baseUrl}/api/categorias`)
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const data = await r.json();
                const nombres = Array.isArray(data)
                    ? data.map((c) => (typeof c === 'string' ? c : (c?.nombre ?? ''))).filter(Boolean)
                    : [];
                setCategoriasExtra(nombres);
            })
            .catch(() => setCategoriasExtra([]));
    }, []);

    const categorias = useMemo(
        () => Array.from(new Set([...categoriasBase, ...categoriasExtra])),
        [categoriasExtra]
    );

    useEffect(() => {
        const actual = Array.isArray(selectedCategoria) ? selectedCategoria : [];
        const saneada = actual.filter((c) => categorias.includes(c));
        if (saneada.length !== actual.length) {
            onCategoriaChange({ target: { value: saneada } });
        }
    }, [categorias]);

    const handleCategoriaChange = (e) => {
        const v = e.target.value;
        const arr = Array.isArray(v)
            ? v
            : typeof v === 'string'
                ? (v ? v.split(',') : [])
                : [];
        const unique = Array.from(new Set(arr));
        const allSelected = unique.length === categorias.length;
        onCategoriaChange({ target: { value: allSelected ? [] : unique } });
    };

    return (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            {/* Mes */}
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="mes-label">Mes</InputLabel>
                <Select labelId="mes-label" id="mes-select" value={selectedMonth} onChange={onMonthChange} label="Mes">
                    {meses.map((mes, index) => (
                        <MenuItem key={index} value={index}>{mes}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Año */}
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="anio-label">Año</InputLabel>
                <Select labelId="anio-label" id="anio-select" value={selectedYear} onChange={onYearChange} label="Año">
                    {años.map((año) => (
                        <MenuItem key={año} value={año}>{año}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Categoría */}
            <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="categoria-label" shrink>Categoría</InputLabel>
                <Select
                    labelId="categoria-label"
                    id="categoria-select"
                    multiple
                    displayEmpty
                    value={Array.isArray(selectedCategoria) ? selectedCategoria : []}
                    onChange={handleCategoriaChange}
                    label="Categoría"
                    renderValue={(selected) => {
                        if (!selected || selected.length === 0 || selected.length === categorias.length) {
                            return <span style={{ opacity: 0.6 }}>Todas</span>;
                        }
                        if (selected.length === 1) return selected[0];
                        return 'Varios';
                    }}
                >
                    {categorias.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

export default Filtros;
