import React, { useEffect, useMemo, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { fetchCategorias } from '../../../shared-services/categoriasService';

const Filtros = ({
    selectedMonth,
    selectedYear,
    onMonthChange,
    onYearChange,
    selectedCategoria,
    onCategoriaChange,
}) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    const categoriasBase = ['Alimentos y Bebidas', 'Transporte', 'Vivienda', 'Servicios Basicos', 'Ocio y Entretenimiento', 'Compras Personales', 'Salud', 'Educacion', 'Impuestos y Tasas', 'Servicios Financieros', 'Compras de Negocio', 'Otros Egresos', 'Ventas de Productos', 'Prestacion de Servicios', 'Cobranzas', 'Transferencias Recibidas', 'Inversiones y Rendimientos', 'Otros Ingresos'];
    const [categoriasExtra, setCategoriasExtra] = useState([]);

    useEffect(() => {
        fetchCategorias()
            .then((lista) => setCategoriasExtra(lista))
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

            {/* Anio */}
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="anio-label">Año</InputLabel>
                <Select labelId="anio-label" id="anio-select" value={selectedYear} onChange={onYearChange} label="Anio">
                    {anios.map((anio) => (
                        <MenuItem key={anio} value={anio}>{anio}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Categoria */}
            <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="categoria-label" shrink>Categoría</InputLabel>
                <Select
                    labelId="categoria-label"
                    id="categoria-select"
                    multiple
                    displayEmpty
                    value={Array.isArray(selectedCategoria) ? selectedCategoria : []}
                    onChange={handleCategoriaChange}
                    label="Categoria"
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
