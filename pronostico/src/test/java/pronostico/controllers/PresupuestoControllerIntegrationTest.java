package pronostico.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import pronostico.dtos.CrearPresupuestoRequest;
import pronostico.models.PresupuestoLinea;
import pronostico.repositories.PresupuestoLineaRepository;
import pronostico.services.AdministracionService;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PresupuestoControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PresupuestoLineaRepository presupuestoLineaRepository;

    @MockBean
    private AdministracionService administracionService;

    private static CrearPresupuestoRequest buildRequest() {
        CrearPresupuestoRequest.PlantillaLinea sueldos = CrearPresupuestoRequest.PlantillaLinea.builder()
                .categoria("Sueldos")
                .tipo("EGRESO")
                .montoEstimado(new BigDecimal("100.00"))
                .meses(List.of(
                        CrearPresupuestoRequest.PlantillaMes.builder().mes("2027-01").montoEstimado(new BigDecimal("100.00")).build(),
                        CrearPresupuestoRequest.PlantillaMes.builder().mes("2027-02").montoEstimado(new BigDecimal("110.00")).build(),
                        CrearPresupuestoRequest.PlantillaMes.builder().mes("2027-03").montoEstimado(new BigDecimal("121.00")).build(),
                        CrearPresupuestoRequest.PlantillaMes.builder().mes("2027-04").montoEstimado(new BigDecimal("133.10")).build()
                ))
                .build();

        CrearPresupuestoRequest.PlantillaLinea alquiler = CrearPresupuestoRequest.PlantillaLinea.builder()
                .categoria("Alquiler")
                .tipo("EGRESO")
                .montoEstimado(new BigDecimal("80.00"))
                .meses(List.of(
                        CrearPresupuestoRequest.PlantillaMes.builder().mes("2027-01").montoEstimado(new BigDecimal("80.00")).build(),
                        CrearPresupuestoRequest.PlantillaMes.builder().mes("2027-02").montoEstimado(new BigDecimal("80.00")).build(),
                        CrearPresupuestoRequest.PlantillaMes.builder().mes("2027-03").montoEstimado(new BigDecimal("80.00")).build(),
                        CrearPresupuestoRequest.PlantillaMes.builder().mes("2027-04").montoEstimado(new BigDecimal("80.00")).build()
                ))
                .build();

        return CrearPresupuestoRequest.builder()
                .nombre("Presupuesto Integracion")
                .desde("2027-01")
                .hasta("2027-04")
                .autogenerarCeros(false)
                .plantilla(List.of(sueldos, alquiler))
                .build();
    }

    private static CrearPresupuestoRequest buildCompoundRequest() {
        Map<String, String> sueldosMontos = new LinkedHashMap<>();
        sueldosMontos.put("2028-01", "100000.00");
        sueldosMontos.put("2028-02-01", "110000.00");
        sueldosMontos.put("2028-03", "121000.00");
        sueldosMontos.put("2028-04", "133100.00");
        sueldosMontos.put("2028-05", "146410.00");
        sueldosMontos.put("2028-06-01", "161051.00");

        Map<String, String> alquilerMontos = new LinkedHashMap<>();
        alquilerMontos.put("2028-01-01", "100000.00");
        alquilerMontos.put("2028-02", "100000.00");
        alquilerMontos.put("2028-03-01", "100000.00");
        alquilerMontos.put("2028-04", "100000.00");
        alquilerMontos.put("2028-05-01", "100000.00");
        alquilerMontos.put("2028-06", "100000.00");

        Map<String, String> ventasMontos = new LinkedHashMap<>();
        ventasMontos.put("2028-01", "300000.00");
        ventasMontos.put("2028-02", "300000.00");
        ventasMontos.put("2028-03-01", "300000.00");
        ventasMontos.put("2028-04", "300000.00");
        ventasMontos.put("2028-05-15", "300000.00");
        ventasMontos.put("2028-06", "300000.00");

        return CrearPresupuestoRequest.builder()
                .nombre("Presupuesto Compuesto Integración")
                .desde("2028-01")
                .hasta("2028-06")
                .autogenerarCeros(false)
                .plantilla(List.of(
                        buildLinea("Alquiler", "EGRESO", alquilerMontos),
                        buildLinea("Sueldos", "EGRESO", sueldosMontos),
                        buildLinea("Ventas esperadas", "INGRESO", ventasMontos)
                ))
                .build();
    }

    private static CrearPresupuestoRequest.PlantillaLinea buildLinea(String categoria, String tipo, Map<String, String> montos) {
        List<CrearPresupuestoRequest.PlantillaMes> meses = montos.entrySet().stream()
                .map(entry -> CrearPresupuestoRequest.PlantillaMes.builder()
                        .mes(entry.getKey())
                        .montoEstimado(new BigDecimal(entry.getValue()))
                        .build())
                .sorted(Comparator.comparing(CrearPresupuestoRequest.PlantillaMes::getMes))
                .collect(Collectors.toList());

        BigDecimal montoBase = meses.isEmpty() ? BigDecimal.ZERO : meses.get(0).getMontoEstimado();

        return CrearPresupuestoRequest.PlantillaLinea.builder()
                .categoria(categoria)
                .tipo(tipo)
                .montoEstimado(montoBase)
                .meses(meses)
                .build();
    }

    @Test
    @DisplayName("POST /api/presupuestos debe persistir los montos mensuales enviados")
    void shouldPersistMonthlyValuesThroughController() throws Exception {
        CrearPresupuestoRequest request = buildRequest();
        when(administracionService.obtenerEmpresaIdPorUsuarioSub("user-test")).thenReturn(1L);

        mockMvc.perform(post("/api/presupuestos")
                .with(jwt().jwt(jwt -> jwt.subject("user-test")))
                .header("X-Usuario-Sub", "user-test")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());

        List<PresupuestoLinea> lineas = presupuestoLineaRepository.findAll().stream()
                .sorted(Comparator.comparing(PresupuestoLinea::getCategoria).thenComparing(PresupuestoLinea::getMes))
                .collect(Collectors.toList());

        assertThat(lineas).hasSize(8);

        Map<String, List<BigDecimal>> porCategoria = lineas.stream()
                .collect(Collectors.groupingBy(PresupuestoLinea::getCategoria,
                        Collectors.mapping(PresupuestoLinea::getMontoEstimado, Collectors.toList())));

        assertThat(porCategoria.get("Sueldos"))
                .containsExactly(new BigDecimal("100.00"), new BigDecimal("110.00"), new BigDecimal("121.00"), new BigDecimal("133.10"));
        assertThat(porCategoria.get("Alquiler"))
                .containsExactly(new BigDecimal("80.00"), new BigDecimal("80.00"), new BigDecimal("80.00"), new BigDecimal("80.00"));
    }

    @Test
    @DisplayName("POST + GET debe respetar montos compuestos y devolverlos exactamente")
    void shouldPersistAndRetrieveCompoundValuesThroughEndpoints() throws Exception {
        CrearPresupuestoRequest request = buildCompoundRequest();

        when(administracionService.obtenerEmpresaIdPorUsuarioSub("user-integration")).thenReturn(2L);

        String creationResponse = mockMvc.perform(post("/api/presupuestos")
                .with(jwt().jwt(jwt -> jwt.subject("user-integration")))
                .header("X-Usuario-Sub", "user-integration")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

        Map<String, Object> created = objectMapper.readValue(creationResponse, new TypeReference<>() {});
        Long presupuestoId = ((Number) created.get("id")).longValue();

        Map<String, Map<String, BigDecimal>> valoresPorMes = new LinkedHashMap<>();
        LinkedHashMap<String, BigDecimal> esperadoSueldos = new LinkedHashMap<>();
        esperadoSueldos.put("2028-01", new BigDecimal("100000.00"));
        esperadoSueldos.put("2028-02", new BigDecimal("110000.00"));
        esperadoSueldos.put("2028-03", new BigDecimal("121000.00"));
        esperadoSueldos.put("2028-04", new BigDecimal("133100.00"));
        esperadoSueldos.put("2028-05", new BigDecimal("146410.00"));
        esperadoSueldos.put("2028-06", new BigDecimal("161051.00"));

        LinkedHashMap<String, BigDecimal> esperadoAlquiler = new LinkedHashMap<>();
        LinkedHashMap<String, BigDecimal> esperadoVentas = new LinkedHashMap<>();
        for (Map.Entry<String, BigDecimal> entry : esperadoSueldos.entrySet()) {
            esperadoAlquiler.put(entry.getKey(), new BigDecimal("100000.00"));
            esperadoVentas.put(entry.getKey(), new BigDecimal("300000.00"));
        }

        for (String ym : esperadoSueldos.keySet()) {
            String body = mockMvc.perform(get("/api/presupuestos/{id}/mes/{ym}", presupuestoId, ym)
                    .with(jwt().jwt(jwt -> jwt.subject("user-integration")))
                    .header("X-Usuario-Sub", "user-integration"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

            List<Map<String, Object>> lineas = objectMapper.readValue(body, new TypeReference<>() {});
            Map<String, BigDecimal> valores = lineas.stream()
                    .collect(Collectors.toMap(
                            l -> (String) l.get("categoria"),
                            l -> new BigDecimal(l.get("montoEstimado").toString()),
                            (a, b) -> a,
                            LinkedHashMap::new
                    ));
            valoresPorMes.put(ym, valores);
        }

        esperadoSueldos.forEach((mes, monto) ->
                assertThat(valoresPorMes.get(mes).get("Sueldos")).isEqualByComparingTo(monto));
        esperadoAlquiler.forEach((mes, monto) ->
                assertThat(valoresPorMes.get(mes).get("Alquiler")).isEqualByComparingTo(monto));
        esperadoVentas.forEach((mes, monto) ->
                assertThat(valoresPorMes.get(mes).get("Ventas esperadas")).isEqualByComparingTo(monto));
    }
}
