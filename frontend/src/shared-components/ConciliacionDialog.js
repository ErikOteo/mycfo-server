import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  Box,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

export default function ConciliacionDialog({ tipo = "factura", width = "100%" }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const theme = useTheme();

  // 🔹 Datos hardcodeados según tipo
  const items =
    tipo === "factura"
      ? [
          { id: 1, monto: 500, categoria: "Transporte", tipo: "Egreso", fecha: "2025-09-01" },
          { id: 2, monto: 300, categoria: "Ventas", tipo: "Ingreso", fecha: "2025-09-10" },
          { id: 3, monto: 150, categoria: "Marketing", tipo: "Egreso", fecha: "2025-09-15" },
          { id: 4, monto: 900, categoria: "Consultoría", tipo: "Egreso", fecha: "2025-09-18" },
          { id: 5, monto: 750, categoria: "Servicios", tipo: "Ingreso", fecha: "2025-09-20" },
        ]
      : [
          { id: 101, nro: "FAC-123", monto: 1200, categoria: "Servicios", fecha: "2025-08-30" },
          { id: 102, nro: "FAC-456", monto: 700, categoria: "Insumos", fecha: "2025-09-05" },
        ];

  // 🔹 Definir columnas dinámicamente
  const columns = useMemo(() => {
    if (tipo === "factura") {
      return [
        { field: "id", headerName: "ID", width: 80 },
        { field: "monto", headerName: "Monto", width: 120 },
        { field: "categoria", headerName: "Categoría", width: 150 },
        { field: "tipo", headerName: "Tipo", width: 120 },
        { field: "fecha", headerName: "Fecha", width: 150 },
      ];
    }
    return [
      { field: "id", headerName: "ID", width: 80 },
      { field: "nro", headerName: "Factura", width: 150 },
      { field: "monto", headerName: "Monto", width: 120 },
      { field: "categoria", headerName: "Categoría", width: 150 },
      { field: "fecha", headerName: "Fecha", width: 150 },
    ];
  }, [tipo]);

  return (
    <>
      {/* Botón trigger con estilo DatePicker */}
      <Box sx={{ width }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setOpen(true)}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 1.5,
            textTransform: "none",
            fontWeight: 400,
            color: theme.palette.text.secondary,
            borderColor: theme.palette.divider,
            backgroundColor: theme.palette.background.paper,
            transition: "border-color 0.25s ease-in-out",
          }}
        >
          Conciliar
        </Button>
      </Box>

      {/* Dialog con DataGrid */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Conciliación</DialogTitle>
        <DialogContent>
          <Box sx={{ height: 400, width: "100%" }}>
            <DataGrid
              rows={items}
              columns={columns}
              getRowId={(row) => row.id} // ✅ asegura IDs
              checkboxSelection
              disableRowSelectionOnClick
              selectionModel={selected} // 🔹 usar selectionModel en community
              onSelectionModelChange={(newSelection) => {
                if (tipo === "movimiento") {
                  setSelected(newSelection.slice(-1)); // solo una factura
                } else {
                  setSelected(newSelection);
                }
              }}
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: { paginationModel: { pageSize: 5 } },
              }}
              density="compact"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="error">
            Cancelar
          </Button>
          <Button
            onClick={() => {
              console.log("Seleccionados:", selected);
              setOpen(false);
            }}
            color="primary"
            variant="contained"
          >
            Conciliar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
