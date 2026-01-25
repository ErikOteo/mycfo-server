package reporte.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import reporte.dtos.RegistroDTO;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CashflowService {

    @Value("${mycfo.registro.url}")
    private String registroUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public List<RegistroDTO> obtenerRegistrosPorAnio(int anio) {
        String url = registroUrl + "/registros";
        RegistroDTO[] registros = restTemplate.getForObject(url, RegistroDTO[].class);

        if (registros == null) return List.of();

        // Filtrar solo ingresos y egresos válidos para el año
        List<String> mediosValidos = List.of("Efectivo", "Transferencia", "MercadoPago");

        return Arrays.stream(registros)
                .filter(r -> r.getFechaEmision() != null
                        && r.getFechaEmision().toLocalDate().getYear() == anio
                        && r.getTipo() != null
                        && ("Ingreso".equalsIgnoreCase(r.getTipo()) || "Egreso".equalsIgnoreCase(r.getTipo()))
                        && r.getMedioPago() != null
                        && mediosValidos.contains(r.getMedioPago()))
                .collect(Collectors.toList());
    }

    public List<RegistroDTO> obtenerRegistrosPorAnio(int anio, String userSub) {
        return obtenerRegistrosPorAnio(anio, userSub, null, null);
    }

    public List<RegistroDTO> obtenerRegistrosPorAnio(int anio, String userSub, String moneda) {
        return obtenerRegistrosPorAnio(anio, userSub, moneda, null);
    }

    public List<RegistroDTO> obtenerRegistrosPorAnio(int anio, String userSub, String moneda, String authorization) {
        LocalDate desde = LocalDate.of(anio, 1, 1);
        LocalDate hasta = LocalDate.of(anio, 12, 31);
        String url = registroUrl + "/movimientos?fechaDesde=" + desde +
                "&fechaHasta=" + hasta +
                "&tipos=Ingreso&tipos=Egreso&page=0&size=1000&sortBy=fechaEmision&sortDir=asc";

        if (moneda != null && !moneda.isBlank()) {
            url = url + "&moneda=" + moneda;
        }

        HttpHeaders headers = new HttpHeaders();
        if (userSub != null) {
            headers.add("X-Usuario-Sub", userSub);
        }
        if (authorization != null && !authorization.isBlank()) {
            headers.add("Authorization", authorization);
        }

        ResponseEntity<reporte.dtos.PageResponse<RegistroDTO>> response;
        try {
            response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<reporte.dtos.PageResponse<RegistroDTO>>() {}
            );
        } catch (HttpClientErrorException e) {
            var status = e.getStatusCode();
            if (status.value() == HttpStatus.UNAUTHORIZED.value() || status.value() == HttpStatus.FORBIDDEN.value()) {
                throw new ResponseStatusException(status, "No autorizado al consultar movimientos en Registro", e);
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Error consultando movimientos en Registro", e);
        }

        List<RegistroDTO> lista = Optional.ofNullable(response.getBody())
                .map(reporte.dtos.PageResponse::getContent)
                .orElse(List.of());

        List<String> mediosValidos = List.of("Efectivo", "Transferencia", "MercadoPago");

        return lista.stream()
                .filter(r -> r.getFechaEmision() != null
                        && r.getFechaEmision().toLocalDate().getYear() == anio
                        && r.getTipo() != null
                        && ("Ingreso".equalsIgnoreCase(r.getTipo()) || "Egreso".equalsIgnoreCase(r.getTipo()))
                        && r.getMedioPago() != null
                        && mediosValidos.contains(r.getMedioPago()))
                .collect(Collectors.toList());
    }

    // No category filtering in Cashflow (by product decision)
}
