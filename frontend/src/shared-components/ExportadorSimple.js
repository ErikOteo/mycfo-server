import * as React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import GridOnIcon from '@mui/icons-material/GridOn'; // <-- Nuevo icono para Excel

const EXPORT_PDF_BG = '#FDE4E3';
const EXPORT_PDF_BG_HOVER = '#FACDCA';
const EXPORT_EXCEL_BG = '#E5F4E5';
const EXPORT_EXCEL_BG_HOVER = '#CAE7CB';

export default function ExportadorSimple({
    onExportPdf,
    onExportExcel,
    exportingPdf = false,
    exportingExcel = false,
    disabledPdf = false,
    disabledExcel = false,
    sx = {},
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                gap: 1,
                // NO posición fija por defecto para mayor flexibilidad
                ...sx,
            }}
        >
            <Tooltip title={exportingPdf ? "Generando PDF..." : "Exportar PDF"}>
                <IconButton
                    onClick={onExportPdf}
                    size="small"
                    color="error"
                    disabled={disabledPdf || exportingPdf}
                    sx={(theme) => {
                        const hoverStyles = {
                            bgcolor: `${EXPORT_PDF_BG_HOVER} !important`,
                            backgroundColor: `${EXPORT_PDF_BG_HOVER} !important`,
                            borderColor: '#d32f2f',
                            '& .MuiSvgIcon-root': {
                                color: '#000 !important',
                            },
                        };
                        return {
                            border: '1px solid',
                            borderColor: '#d32f2f',
                            bgcolor: `${EXPORT_PDF_BG} !important`,
                            backgroundColor: `${EXPORT_PDF_BG} !important`,
                            '& .MuiSvgIcon-root': {
                                color: '#000 !important',
                            },
                            '&:hover': hoverStyles,
                            width: 36,
                            height: 36,
                            opacity: (disabledPdf || exportingPdf) ? 0.6 : 1,
                            cursor: (disabledPdf || exportingPdf) ? 'not-allowed' : 'pointer',
                            ...theme.applyStyles('dark', {
                                borderColor: '#d32f2f',
                                '&:hover': hoverStyles,
                            }),
                        };
                    }}
                    aria-label="Exportar PDF"
                    aria-busy={exportingPdf}
                >
                    <PictureAsPdfIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title={exportingExcel ? "Generando Excel..." : "Exportar Excel"}>
                <IconButton
                    onClick={onExportExcel}
                    size="small"
                    color="success"
                    disabled={disabledExcel || exportingExcel}
                    sx={(theme) => {
                        const hoverStyles = {
                            bgcolor: `${EXPORT_EXCEL_BG_HOVER} !important`,
                            backgroundColor: `${EXPORT_EXCEL_BG_HOVER} !important`,
                            borderColor: '#2e7d32',
                            '& .MuiSvgIcon-root': {
                                color: '#000 !important',
                            },
                        };
                        return {
                            border: '1px solid',
                            borderColor: '#2e7d32',
                            bgcolor: `${EXPORT_EXCEL_BG} !important`,
                            backgroundColor: `${EXPORT_EXCEL_BG} !important`,
                            '& .MuiSvgIcon-root': {
                                color: '#000 !important',
                            },
                            '&:hover': hoverStyles,
                            width: 36,
                            height: 36,
                            opacity: (disabledExcel || exportingExcel) ? 0.6 : 1,
                            cursor: (disabledExcel || exportingExcel) ? 'not-allowed' : 'pointer',
                            ...theme.applyStyles('dark', {
                                borderColor: '#2e7d32',
                                '&:hover': hoverStyles,
                            }),
                        };
                    }}
                    aria-label="Exportar Excel"
                    aria-busy={exportingExcel}
                >
                    <GridOnIcon fontSize="small" /> {/* Icono de tabla tipo Excel */}
                </IconButton>
            </Tooltip>
        </Box>
    );
}
