import React from 'react';
import {
    TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Box
} from '@mui/material';

const TablaDetalle = ({ year, ingresos, egresos, saldoInicial }) => {
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    const ahora = new Date();
    const ultimoMes = (year === ahora.getFullYear()) ? ahora.getMonth() : 11;
    const mesesVisibles = meses.slice(0, ultimoMes + 1);

    const normalizeCategoria = (c) => {
        const s = (c ?? '').toString().trim();
        return s.length ? s : 'Sin categoría';
    };

    const agruparYOrdenar = (data) => {
        const map = {};
        data.forEach((tx) => {
            const mes = new Date(tx.fecha).getMonth();
            const cat = normalizeCategoria(tx.categoria);
            if (!map[cat]) {
                map[cat] = Array(12).fill(0);
            }
            map[cat][mes] += tx.monto;
        });
        return Object.entries(map)
            .map(([categoria, valores]) => ({
                categoria,
                valores,
                total: valores.reduce((a, b) => a + b, 0),
            }))
            .sort((a, b) => b.total - a.total);
    };

    const ingresosPorCategoria = agruparYOrdenar(ingresos);
    const egresosPorCategoria = agruparYOrdenar(egresos);

    const totalIngresos = Array(12).fill(0);
    const totalEgresos = Array(12).fill(0);
    ingresos.forEach((tx) => totalIngresos[new Date(tx.fecha).getMonth()] += Number(tx.monto) || 0);
    egresos.forEach((tx) => totalEgresos[new Date(tx.fecha).getMonth()] += Math.abs(Number(tx.monto) || 0));

    const netos = totalIngresos.map((v, i) => v - totalEgresos[i]);
    const saldoFinal = [];
    saldoFinal[0] = saldoInicial + netos[0];
    for (let i = 1; i < 12; i++) saldoFinal[i] = saldoFinal[i - 1] + netos[i];

    return (
        <Box>
            <TableContainer component={Paper}>
                <Table
                    size="small"
                    stickyHeader
                    sx={{
                        '& .MuiTableCell-root': {
                            border: '1px solid rgba(224, 224, 224, 1)',
                        },
                        '& .MuiTableHead-root .MuiTableCell-root': {
                            fontWeight: 700,
                            textAlign: 'center',
                        },
                        '& .MuiTableBody-root .MuiTableCell-root:nth-of-type(n + 2)': {
                            textAlign: 'right',
                        },
                        '& .MuiTableHead-root .MuiTableCell-root': {
                            fontWeight: 700,
                        },
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell align="left">Concepto</TableCell>
                            {mesesVisibles.map((m) => (
                                <TableCell key={m} align="center">{m}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>

                        <TableRow
                            sx={{
                                '& td, & th': { borderTop: '2px solid rgba(0,0,0,0.25)' },
                                backgroundColor: 'rgba(46, 125, 50, 0.08)',
                            }}
                        >
                            <TableCell><b>Ingresos</b></TableCell>
                            {mesesVisibles.map((_, i) => <TableCell key={i} />)}
                        </TableRow>
                        {ingresosPorCategoria.map(({ categoria, valores }) => (
                            <TableRow key={categoria}>
                                <TableCell sx={{ pl: 4 }}>{normalizeCategoria(categoria)}</TableCell>
                                {mesesVisibles.map((_, i) => (
                                    <TableCell key={i} align="right" sx={{ color: 'green' }}>
                                        {valores[i] ? `$${valores[i].toLocaleString()}` : '-'}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}

                        <TableRow
                            sx={{
                                '& td, & th': { borderTop: '2px solid rgba(0,0,0,0.25)' },
                                backgroundColor: 'rgba(198, 40, 40, 0.08)',
                            }}
                        >
                            <TableCell><b>Egresos</b></TableCell>
                            {mesesVisibles.map((_, i) => <TableCell key={i} />)}
                        </TableRow>
                        {egresosPorCategoria.map(({ categoria, valores }) => (
                            <TableRow key={categoria}>
                                <TableCell sx={{ pl: 4 }}>{normalizeCategoria(categoria)}</TableCell>
                                {mesesVisibles.map((_, i) => (
                                    <TableCell key={i} align="right" sx={{ color: 'red' }}>
                                        {valores[i] ? `-$${Math.abs(valores[i]).toLocaleString()}` : '-'}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}

                        <TableRow sx={{ '& td, & th': { borderTop: '2px solid rgba(0,0,0,0.25)' } }}>
                            <TableCell><b>Total Ingresos</b></TableCell>
                            {mesesVisibles.map((_, i) => (
                                <TableCell key={i} align="right" sx={{ color: 'green' }}>
                                    ${totalIngresos[i].toLocaleString()}
                                </TableCell>
                            ))}
                        </TableRow>
                        <TableRow sx={{ '& td, & th': { borderTop: '2px solid rgba(0,0,0,0.25)' } }}>
                            <TableCell><b>Total Egresos</b></TableCell>
                            {mesesVisibles.map((_, i) => (
                                <TableCell key={i} align="right" sx={{ color: 'red' }}>
                                    -${totalEgresos[i].toLocaleString()}
                                </TableCell>
                            ))}
                        </TableRow>
                        <TableRow sx={{ '& td, & th': { borderTop: '2px solid rgba(0,0,0,0.25)' } }}>
                            <TableCell><b>Net Cash Flow</b></TableCell>
                            {mesesVisibles.map((_, i) => (
                                <TableCell key={i} align="right" sx={{ color: netos[i] >= 0 ? 'green' : 'red' }}>
                                    {netos[i] >= 0
                                        ? `$${netos[i].toLocaleString()}`
                                        : `-$${Math.abs(netos[i]).toLocaleString()}`}
                                </TableCell>
                            ))}
                        </TableRow>
                        <TableRow sx={{ '& td, & th': { borderTop: '2px solid rgba(0,0,0,0.25)' } }}>
                            <TableCell><b>Cash on hand (Fin)</b></TableCell>
                            {mesesVisibles.map((_, i) => (
                                <TableCell key={i} align="right">
                                    ${saldoFinal[i].toLocaleString()}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default TablaDetalle;
