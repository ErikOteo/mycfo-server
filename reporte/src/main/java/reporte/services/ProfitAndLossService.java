package reporte.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import reporte.dtos.DetalleCategoriaDTO;
import reporte.dtos.ProfitAndLossDTO;
import reporte.dtos.ProfitAndLossDTO.DocumentoComercialDTO;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProfitAndLossService {

    @Value("${mycfo.registro.url}")
    private String registroUrl; // Ej: http://localhost:8086

    private final RestTemplate restTemplate = new RestTemplate();

    public ProfitAndLossDTO obtenerFacturasPorAnio(int anio) {
        String url = registroUrl + "/documentos-comerciales";

        DocumentoComercialDTO[] documentos;
        try {
            documentos = restTemplate.getForObject(url, DocumentoComercialDTO[].class);
        } catch (Exception e) {
            System.err.println("❌ Error al consultar el servicio Registro: " + e.getMessage());
            return new ProfitAndLossDTO(anio, List.of(), new double[12], new double[12], 0.0, new ArrayList<>(), new ArrayList<>());
        }

        if (documentos == null) {
            System.out.println("⚠️ No se recibieron documentos desde el servicio Registro");
            return new ProfitAndLossDTO(anio, List.of(), new double[12], new double[12], 0.0, new ArrayList<>(), new ArrayList<>());
        }

        List<DocumentoComercialDTO> filtrados = Arrays.stream(documentos)
                .filter(d -> d.getFechaEmision() != null && d.getFechaEmision().getYear() == anio)
                .collect(Collectors.toList());

        double[] ingresosMensuales = new double[12];
        double[] egresosMensuales = new double[12];

        Map<String, Double> ingresosPorCategoria = new HashMap<>();
        Map<String, Double> egresosPorCategoria = new HashMap<>();

        for (DocumentoComercialDTO doc : filtrados) {
            int mes = doc.getFechaEmision().getMonthValue() - 1;
            double monto = Optional.ofNullable(doc.getMontoTotal()).orElse(0.0);
            String categoria = Optional.ofNullable(doc.getCategoria()).orElse("Sin Categoría");

            if ("Ventas".equalsIgnoreCase(categoria)) {
                ingresosMensuales[mes] += monto;
                ingresosPorCategoria.put(categoria, ingresosPorCategoria.getOrDefault(categoria, 0.0) + monto);
            } else {
                egresosMensuales[mes] += monto;
                egresosPorCategoria.put(categoria, egresosPorCategoria.getOrDefault(categoria, 0.0) + monto);
            }
        }

        // Convertir los mapas a la lista de objetos DetalleCategoriaDTO correcta
        List<DetalleCategoriaDTO> detalleIngresosList = ingresosPorCategoria.entrySet().stream()
                .map(entry -> new DetalleCategoriaDTO(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());

        List<DetalleCategoriaDTO> detalleEgresosList = egresosPorCategoria.entrySet().stream()
                .map(entry -> new DetalleCategoriaDTO(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());

        double totalIngresos = Arrays.stream(ingresosMensuales).sum();
        double totalEgresos = Arrays.stream(egresosMensuales).sum();
        double resultadoAnual = totalIngresos - totalEgresos;

        return new ProfitAndLossDTO(anio, filtrados, ingresosMensuales, egresosMensuales, resultadoAnual, detalleIngresosList, detalleEgresosList);
    }

    public ProfitAndLossDTO obtenerFacturasPorAnio(int anio, String userSub) {
        // Para evitar tocar otros módulos, basamos P&L en movimientos filtrados por usuario/empresa
        // y calculamos ingresos/egresos mensuales por Categoría, usando DEVENGADO (fecha del documento comercial)
        var desde = java.time.LocalDate.of(anio, 1, 1);
        var hasta = java.time.LocalDate.of(anio, 12, 31);
        String url = registroUrl + "/movimientos?fechaDesde=" + desde +
                "&fechaHasta=" + hasta +
                "&tipos=Ingreso&tipos=Egreso&page=0&size=1000&sortBy=fechaEmision&sortDir=asc";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.add("X-Usuario-Sub", userSub);
            ResponseEntity<reporte.dtos.PageResponse<reporte.dtos.RegistroDTO>> res = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new org.springframework.core.ParameterizedTypeReference<reporte.dtos.PageResponse<reporte.dtos.RegistroDTO>>() {}
            );
            java.util.List<reporte.dtos.RegistroDTO> movimientos = java.util.Optional.ofNullable(res.getBody())
                    .map(reporte.dtos.PageResponse::getContent)
                    .orElse(java.util.List.of());

            double[] ingresosMensuales = new double[12];
            double[] egresosMensuales = new double[12];
            java.util.Map<String, Double> ingresosPorCategoria = new java.util.HashMap<>();
            java.util.Map<String, Double> egresosPorCategoria = new java.util.HashMap<>();

            for (reporte.dtos.RegistroDTO mov : movimientos) {
                if (mov.getMontoTotal() == null || mov.getTipo() == null) continue;

                java.time.LocalDate fechaDevengado = (mov.getDocumentoComercial() != null && mov.getDocumentoComercial().getFechaEmision() != null)
                        ? mov.getDocumentoComercial().getFechaEmision().toLocalDate()
                        : (mov.getFechaEmision() != null ? mov.getFechaEmision().toLocalDate() : null);
                if (fechaDevengado == null) continue;

                int mes = fechaDevengado.getMonthValue() - 1;
                double monto = mov.getMontoTotal();
                String categoria = java.util.Optional
                        .ofNullable(mov.getCategoria())
                        .or(() -> java.util.Optional.ofNullable(mov.getDocumentoComercial()).map(reporte.dtos.RegistroDTO.DocumentoDTO::getCategoria))
                        .orElse("Sin Categoría");

                if ("Ingreso".equalsIgnoreCase(mov.getTipo())) {
                    ingresosMensuales[mes] += monto;
                    ingresosPorCategoria.put(categoria, ingresosPorCategoria.getOrDefault(categoria, 0.0) + monto);
                } else if ("Egreso".equalsIgnoreCase(mov.getTipo())) {
                    egresosMensuales[mes] += monto;
                    egresosPorCategoria.put(categoria, egresosPorCategoria.getOrDefault(categoria, 0.0) + monto);
                }
            }

            java.util.List<DetalleCategoriaDTO> detalleIngresosList = ingresosPorCategoria.entrySet().stream()
                    .map(entry -> new DetalleCategoriaDTO(entry.getKey(), entry.getValue()))
                    .collect(java.util.stream.Collectors.toList());

            java.util.List<DetalleCategoriaDTO> detalleEgresosList = egresosPorCategoria.entrySet().stream()
                    .map(entry -> new DetalleCategoriaDTO(entry.getKey(), entry.getValue()))
                    .collect(java.util.stream.Collectors.toList());

            double totalIngresos = java.util.Arrays.stream(ingresosMensuales).sum();
            double totalEgresos = java.util.Arrays.stream(egresosMensuales).sum();
            double resultadoAnual = totalIngresos - totalEgresos;

            // El primer parǭmetro del DTO original es 'anio' y una lista de documentos; reutilizamos movimientos como referencia
            return new ProfitAndLossDTO(anio, java.util.List.of(), ingresosMensuales, egresosMensuales, resultadoAnual, detalleIngresosList, detalleEgresosList);
        } catch (Exception e) {
            System.err.println("Error al consultar movimientos del servicio Registro: " + e.getMessage());
            return new ProfitAndLossDTO(anio, java.util.List.of(), new double[12], new double[12], 0.0, new java.util.ArrayList<>(), new java.util.ArrayList<>());
        }
    }
}

