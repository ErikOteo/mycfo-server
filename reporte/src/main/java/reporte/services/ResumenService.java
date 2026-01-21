package reporte.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import reporte.dtos.DetalleCategoriaDTO;
import reporte.dtos.RegistroDTO;
import reporte.dtos.PageResponse;
import reporte.dtos.ResumenMensualDTO;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ResumenService {

    @Value("${mycfo.registro.url}")
    private String registroUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public ResumenMensualDTO obtenerResumenMensual(int anio, int mes, List<String> categoriasFiltro) {
        String url = registroUrl + "/registros";
        RegistroDTO[] registros = restTemplate.getForObject(url, RegistroDTO[].class);

        if (registros == null) return new ResumenMensualDTO(0, 0, 0, List.of(), List.of());

        // Filtrar por mes/año
        List<RegistroDTO> filtrados = Arrays.stream(registros)
                .filter(r -> r.getFechaEmision() != null
                        && r.getFechaEmision().getYear() == anio
                        && r.getFechaEmision().getMonthValue() == mes)
                .toList();

        // Criterio percibido (caja) también para la versión sin usuario (retrocompatibilidad)
        List<String> mediosValidos = java.util.List.of("Efectivo", "Transferencia", "MercadoPago");
        filtrados = filtrados.stream()
                .filter(r -> r.getMedioPago() != null && mediosValidos.contains(r.getMedioPago()))
                .toList();

        // Filtro por categorías (OR inclusivo)
        if (categoriasFiltro != null && !categoriasFiltro.isEmpty()) {
            Set<String> filtrosNorm = categoriasFiltro.stream()
                    .map(this::normalize)
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toSet());

            if (!filtrosNorm.isEmpty()) {
                filtrados = filtrados.stream()
                        .filter(r -> {
                            String cat = r.getCategoria();
                            if (cat == null) return false;
                            return filtrosNorm.contains(normalize(cat));
                        })
                        .toList();
            }
        }

        // Separar ingresos y egresos
        List<RegistroDTO> ingresos = filtrados.stream()
                .filter(r -> "Ingreso".equalsIgnoreCase(r.getTipo()))
                .toList();

        List<RegistroDTO> egresos = filtrados.stream()
                .filter(r -> "Egreso".equalsIgnoreCase(r.getTipo()))
                .toList();

        // Calcular totales
        double totalIngresos = ingresos.stream().mapToDouble(RegistroDTO::getMontoTotal).sum();
        double totalEgresos = egresos.stream().mapToDouble(RegistroDTO::getMontoTotal).sum();
        double balance = totalIngresos - totalEgresos;

        // Agrupar por categoría
        List<DetalleCategoriaDTO> detalleIngresos = ingresos.stream()
                .collect(Collectors.groupingBy(registro -> {
                            String categoria = registro.getCategoria();
                            return (categoria == null || categoria.isBlank()) ? "Sin categoría" : categoria;
                        },
                        Collectors.summingDouble(RegistroDTO::getMontoTotal)))
                .entrySet().stream()
                .map(e -> new DetalleCategoriaDTO(e.getKey(), e.getValue()))
                .toList();

        List<DetalleCategoriaDTO> detalleEgresos = egresos.stream()
                .collect(Collectors.groupingBy(registro -> {
                            String categoria = registro.getCategoria();
                            return (categoria == null || categoria.isBlank()) ? "Sin categoría" : categoria;
                        },
                        Collectors.summingDouble(RegistroDTO::getMontoTotal)))
                .entrySet().stream()
                .map(e -> new DetalleCategoriaDTO(e.getKey(), e.getValue()))
                .toList();

        return new ResumenMensualDTO(totalIngresos, totalEgresos, balance, detalleIngresos, detalleEgresos);
    }

    public ResumenMensualDTO obtenerResumenMensual(int anio, int mes, List<String> categoriasFiltro, String userSub, String authorization) {
        LocalDate desde = LocalDate.of(anio, mes, 1);
        LocalDate hasta = desde.withDayOfMonth(desde.lengthOfMonth());
        String url = registroUrl + "/movimientos?fechaDesde=" + desde +
                "&fechaHasta=" + hasta +
                "&tipos=Ingreso&tipos=Egreso&page=0&size=1000&sortBy=fechaEmision&sortDir=asc";

        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Usuario-Sub", userSub);
        headers.add("Authorization", authorization);

        ResponseEntity<PageResponse<RegistroDTO>> response;
        try {
            response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<PageResponse<RegistroDTO>>() {}
            );
        } catch (HttpClientErrorException e) {
            HttpStatus status = e.getStatusCode();
            if (status == HttpStatus.UNAUTHORIZED || status == HttpStatus.FORBIDDEN) {
                throw new ResponseStatusException(status, "No autorizado al consultar movimientos en Registro", e);
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Error consultando movimientos en Registro", e);
        }

        List<RegistroDTO> lista = Optional.ofNullable(response.getBody())
                .map(PageResponse::getContent)
                .orElse(List.of());

        List<RegistroDTO> filtrados = lista.stream()
                .filter(r -> r.getFechaEmision() != null
                        && r.getFechaEmision().toLocalDate().getYear() == anio
                        && r.getFechaEmision().toLocalDate().getMonthValue() == mes)
                .toList();

        if (categoriasFiltro != null && !categoriasFiltro.isEmpty()) {
            Set<String> filtrosNorm = categoriasFiltro.stream()
                    .map(this::normalize)
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toSet());

            if (!filtrosNorm.isEmpty()) {
                filtrados = filtrados.stream()
                        .filter(r -> {
                            String cat = r.getCategoria();
                            if (cat == null) return false;
                            return filtrosNorm.contains(normalize(cat));
                        })
                        .toList();
            }
        }

        List<RegistroDTO> ingresos = filtrados.stream()
                .filter(r -> "Ingreso".equalsIgnoreCase(r.getTipo()))
                .toList();

        List<RegistroDTO> egresos = filtrados.stream()
                .filter(r -> "Egreso".equalsIgnoreCase(r.getTipo()))
                .toList();

        double totalIngresos = ingresos.stream().mapToDouble(RegistroDTO::getMontoTotal).sum();
        double totalEgresos = egresos.stream().mapToDouble(RegistroDTO::getMontoTotal).sum();
        double balance = totalIngresos - totalEgresos;

        List<DetalleCategoriaDTO> detalleIngresos = ingresos.stream()
                .collect(Collectors.groupingBy(registro -> {
                            String categoria = registro.getCategoria();
                            return (categoria == null || categoria.isBlank()) ? "Sin categoría" : categoria;
                        },
                        Collectors.summingDouble(RegistroDTO::getMontoTotal)))
                .entrySet().stream()
                .map(e -> new DetalleCategoriaDTO(e.getKey(), e.getValue()))
                .toList();

        List<DetalleCategoriaDTO> detalleEgresos = egresos.stream()
                .collect(Collectors.groupingBy(registro -> {
                            String categoria = registro.getCategoria();
                            return (categoria == null || categoria.isBlank()) ? "Sin categoría" : categoria;
                        },
                        Collectors.summingDouble(RegistroDTO::getMontoTotal)))
                .entrySet().stream()
                .map(e -> new DetalleCategoriaDTO(e.getKey(), e.getValue()))
                .toList();

        return new ResumenMensualDTO(totalIngresos, totalEgresos, balance, detalleIngresos, detalleEgresos);
    }

    private String normalize(String input) {
        if (input == null) return "";
        String lower = input.trim().toLowerCase(Locale.ROOT);
        String normalized = Normalizer.normalize(lower, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", ""); // quita tildes
    }
}
