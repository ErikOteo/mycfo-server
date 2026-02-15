import React, { useEffect, useState } from "react";
import {
  Paper, IconButton, Box, TextField, Typography, InputAdornment, Snackbar, Alert
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import CategoriaAutoComplete from "../../shared-components/CategoriaAutoComplete";
import CustomDatePicker from "../../shared-components/CustomDatePicker";
import dayjs from "dayjs";
import { API_CONFIG } from "../../config/apiConfig";

export default function TablaRegistros() {
  const [registros, setRegistros] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [valoresEditados, setValoresEditados] = useState({});
  const [categorias, setCategorias] = useState([]);
  const [filtros, setFiltros] = useState({
    medioPago: ""
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // Opciones de categorías (pueden venir de backend o estar hardcodeadas)
  const categoriasHardcoded = ["Transporte", "Educación", "Ocio", "Salud", "Alimentación"];
  const tipos = ["Ingreso", "Gasto"];
  const mediosPago = ["Efectivo", "Tarjeta", "Transferencia"];

  useEffect(() => {
    fetch(`${API_CONFIG.registro}/registros`)
      .then((res) => res.json())
      .then((data) => setRegistros(data))
      .catch((err) => console.error("Error cargando registros:", err));
  }, []);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const lista = await fetchCategorias();
        if (activo) setCategorias(lista);
      } catch (err) {
        console.warn("No se pudieron obtener categorias din?micas, usando vac?o", err);
        if (activo) setCategorias([]);
      }
    };
    cargar();
    return () => { activo = false; };
  }, []);

  const handleEdit = (row) => {
    setEditandoId(row.id);
    setValoresEditados(row); // copia inicial de la fila
  };

  const handleCancel = () => {
    setEditandoId(null);
    setValoresEditados({});
  };

  const handleSave = async () => {
    try {
      // PUT o PATCH al backend
      const resp = await fetch(`${API_CONFIG.registro}/registros/${valoresEditados.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valoresEditados),
      });

      if (!resp.ok) throw new Error("Error guardando cambios");

      // actualizo la tabla en memoria
      setRegistros((prev) =>
        prev.map((r) => (r.id === valoresEditados.id ? valoresEditados : r))
      );
      setEditandoId(null);
      setValoresEditados({});
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Error al guardar el registro", severity: "error" });
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Filtrar registros según los filtros aplicados
  const registrosFiltrados = registros.filter(registro => {
    return Object.entries(filtros).every(([campo, valor]) => {
      if (!valor) return true;

      const valorRegistro = String(registro[campo] || "").toLowerCase();
      return valorRegistro.includes(valor.toLowerCase());
    });
  });

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Registros Financieros
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>


            {/* Fila de encabezados */}
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Fecha Emisión</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Origen</TableCell>
              <TableCell>Destino</TableCell>
              <TableCell>Medio Pago</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {registrosFiltrados.map((row) => (
              <TableRow key={row.id}>
                {/* Tipo */}
                <TableCell>
                  {editandoId === row.id ? (
                    <CategoriaAutoComplete
                      options={tipos}
                      value={valoresEditados.tipo}
                      onChange={(v) =>
                        setValoresEditados((prev) => ({
                          ...prev,
                          tipo: v,
                        }))
                      }
                    />
                  ) : (
                    row.tipo
                  )}
                </TableCell>

                {/* Monto */}
                <TableCell>
                  {editandoId === row.id ? (
                    <TextField
                      size="small"
                      type="number"
                      value={valoresEditados.montoTotal || ""}
                      onChange={(e) =>
                        setValoresEditados((prev) => ({
                          ...prev,
                          montoTotal: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    row.montoTotal
                  )}
                </TableCell>

                {/* Fecha Emisión */}
                <TableCell>
                  {editandoId === row.id ? (
                    <CustomDatePicker
                      value={dayjs(valoresEditados.fechaEmision)}
                      onChange={(newValue) =>
                        setValoresEditados((prev) => ({
                          ...prev,
                          fechaEmision: newValue.format('YYYY-MM-DD'),
                        }))
                      }
                    />
                  ) : (
                    row.fechaEmision
                  )}
                </TableCell>

                {/* Categoría */}
                <TableCell>
                  {editandoId === row.id ? (
                    <CategoriaAutoComplete
                      options={categoriasHardcoded}
                      value={valoresEditados.categoria}
                      onChange={(v) =>
                        setValoresEditados((prev) => ({
                          ...prev,
                          categoria: v,
                        }))
                      }
                    />
                  ) : (
                    row.categoria
                  )}
                </TableCell>

                {/* Origen */}
                <TableCell>
                  {editandoId === row.id ? (
                    <TextField
                      size="small"
                      value={valoresEditados.origen || ""}
                      onChange={(e) =>
                        setValoresEditados((prev) => ({
                          ...prev,
                          origen: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    row.origen
                  )}
                </TableCell>

                {/* Destino */}
                <TableCell>
                  {editandoId === row.id ? (
                    <TextField
                      size="small"
                      value={valoresEditados.destino || ""}
                      onChange={(e) =>
                        setValoresEditados((prev) => ({
                          ...prev,
                          destino: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    row.destino
                  )}
                </TableCell>

                {/* Medio Pago */}
                <TableCell>
                  {editandoId === row.id ? (
                    <CategoriaAutoComplete
                      options={mediosPago}
                      value={valoresEditados.medioPago}
                      onChange={(v) =>
                        setValoresEditados((prev) => ({
                          ...prev,
                          medioPago: v,
                        }))
                      }
                    />
                  ) : (
                    row.medioPago
                  )}
                </TableCell>

                {/* Acciones */}
                <TableCell align="right">
                  {editandoId === row.id ? (
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <IconButton color="success" onClick={handleSave}>
                        <CheckIcon />
                      </IconButton>
                      <IconButton color="error" onClick={handleCancel}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <IconButton onClick={() => handleEdit(row)}>
                      <EditIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}