import axios from "axios";
import API_CONFIG from "../../../config/api-config";

const BASE_URL = API_CONFIG.REGISTRO;

const withUserHeaders = () => {
  const usuarioSub = sessionStorage.getItem("sub");
  if (!usuarioSub) {
    throw new Error("No se encontró información de usuario (sub) en la sesión.");
  }
  return {
    headers: {
      "X-Usuario-Sub": usuarioSub,
    },
    withCredentials: true,
  };
};

export const fetchFacturas = async ({
  page = 0,
  size = 10,
  sortBy = "fechaEmision",
  sortDir = "desc",
  fechaDesde,
  fechaHasta,
  tipoFactura,
  estadoPago,
  search,
  searchDate,
} = {}) => {
  const params = new URLSearchParams({
    page,
    size,
    sortBy,
    sortDir,
  });

  if (fechaDesde) params.append("fechaDesde", fechaDesde);
  if (fechaHasta) params.append("fechaHasta", fechaHasta);
  if (tipoFactura) params.append("tipoFactura", tipoFactura);
  if (estadoPago) params.append("estadoPago", estadoPago);
  if (search) params.append("search", search);
  if (searchDate) params.append("searchDate", searchDate);

  const response = await axios.get(
    `${BASE_URL}/facturas/buscar?${params.toString()}`,
    withUserHeaders()
  );

  return response.data;
};

export const deleteFactura = async (id) => {
  await axios.delete(`${BASE_URL}/facturas/${id}`, withUserHeaders());
};

const serializeFactura = (payload) => {
  const data = { ...payload };
  if (data.fechaEmision && typeof data.fechaEmision?.format === "function") {
    // Incluir fecha y hora completas tal como se eligieron en el formulario
    data.fechaEmision = data.fechaEmision.format("YYYY-MM-DDTHH:mm:ss");
  }
  return data;
};

export const updateFactura = async (id, payload) => {
  const response = await axios.put(
    `${BASE_URL}/facturas/${id}`,
    serializeFactura(payload),
    withUserHeaders()
  );
  return response.data;
};

export const getFacturaById = async (id) => {
  const response = await axios.get(
    `${BASE_URL}/facturas/${id}`,
    withUserHeaders()
  );
  return response.data;
};


