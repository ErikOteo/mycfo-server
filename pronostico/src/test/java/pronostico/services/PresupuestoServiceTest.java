package pronostico.services;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import pronostico.dtos.CrearPresupuestoRequest;
import pronostico.dtos.PresupuestoDTO;
import pronostico.models.Presupuesto;
import pronostico.models.PresupuestoLinea;
import pronostico.repositories.PresupuestoLineaRepository;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PresupuestoServiceTest {

    @Autowired
    private PresupuestoService presupuestoService;

    @Autowired
    private PresupuestoLineaRepository presupuestoLineaRepository;

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

    private List<PresupuestoLinea> obtenerLineasOrdenadas(Long presupuestoId) {
        return presupuestoLineaRepository.findByPresupuesto_Id(presupuestoId).stream()
                .sorted(Comparator.comparing(PresupuestoLinea::getMes))
                .collect(Collectors.toList());
    }

    private CrearPresupuestoRequest simpleRequest(String nombre) {
        return CrearPresupuestoRequest.builder()
            .nombre(nombre)
            .desde("2027-01")
            .hasta("2027-03")
            .autogenerarCeros(true)
            .build();
    }

    @Test
    @DisplayName("Debe persistir montos compuestos para varias líneas aun con meses en formato flexible")
    void shouldPersistCompoundMonthlyValuesAcrossCategories() {
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

        CrearPresupuestoRequest request = CrearPresupuestoRequest.builder()
                .nombre("Presupuesto Compuesto")
                .desde("2028-01")
                .hasta("2028-06")
                .autogenerarCeros(false)
                .plantilla(List.of(
                        buildLinea("Alquiler", "EGRESO", alquilerMontos),
                        buildLinea("Sueldos", "EGRESO", sueldosMontos),
                        buildLinea("Ventas esperadas", "INGRESO", ventasMontos)
                ))
                .build();

        Presupuesto presupuesto = presupuestoService.crearPresupuesto(request, 1L, "user-compuesto");
        List<PresupuestoLinea> lineas = obtenerLineasOrdenadas(presupuesto.getId());

        assertThat(lineas).hasSize(18);

        Map<String, List<BigDecimal>> porCategoria = lineas.stream()
                .collect(Collectors.groupingBy(PresupuestoLinea::getCategoria,
                        Collectors.mapping(PresupuestoLinea::getMontoEstimado, Collectors.toList())));

        assertThat(porCategoria.get("Alquiler"))
                .hasSize(6)
                .containsExactly(
                        new BigDecimal("100000.00"),
                        new BigDecimal("100000.00"),
                        new BigDecimal("100000.00"),
                        new BigDecimal("100000.00"),
                        new BigDecimal("100000.00"),
                        new BigDecimal("100000.00")
                );

        assertThat(porCategoria.get("Sueldos"))
                .hasSize(6)
                .containsExactly(
                        new BigDecimal("100000.00"),
                        new BigDecimal("110000.00"),
                        new BigDecimal("121000.00"),
                        new BigDecimal("133100.00"),
                        new BigDecimal("146410.00"),
                        new BigDecimal("161051.00")
                );

        assertThat(porCategoria.get("Ventas esperadas"))
                .hasSize(6)
                .containsExactly(
                        new BigDecimal("300000.00"),
                        new BigDecimal("300000.00"),
                        new BigDecimal("300000.00"),
                        new BigDecimal("300000.00"),
                        new BigDecimal("300000.00"),
                        new BigDecimal("300000.00")
                );
    }

    @Test
    @DisplayName("Debe persistir todos los meses con los importes enviados en la plantilla")
    void shouldPersistMonthlyAmountsFromRequest() {
        CrearPresupuestoRequest request = CrearPresupuestoRequest.builder()
                .nombre("Presupuesto Sueldos")
                .desde("2027-01")
                .hasta("2027-04")
                .autogenerarCeros(false)
                .plantilla(List.of(
                        buildLinea("Sueldos", "EGRESO", Map.of(
                                "2027-01", "100.00",
                                "2027-02", "110.00",
                                "2027-03", "121.00",
                                "2027-04", "133.10"
                        ))
                ))
                .build();

        Presupuesto presupuesto = presupuestoService.crearPresupuesto(request, 1L, "user-test");
        List<PresupuestoLinea> lineas = obtenerLineasOrdenadas(presupuesto.getId());

        assertThat(lineas).hasSize(4);
        assertThat(lineas).extracting(PresupuestoLinea::getMes)
                .containsExactly("2027-01-01", "2027-02-01", "2027-03-01", "2027-04-01");
        assertThat(lineas).extracting(PresupuestoLinea::getMontoEstimado)
                .containsExactly(new BigDecimal("100.00"), new BigDecimal("110.00"), new BigDecimal("121.00"), new BigDecimal("133.10"));
    }

    @Test
    @DisplayName("Debe mantener independientes los importes de diferentes categorías")
    void shouldNotInterfereBetweenCategories() {
        CrearPresupuestoRequest request = CrearPresupuestoRequest.builder()
                .nombre("Presupuesto Mixto")
                .desde("2027-01")
                .hasta("2027-04")
                .autogenerarCeros(false)
                .plantilla(List.of(
                        buildLinea("Sueldos", "EGRESO", Map.of(
                                "2027-01", "100.00",
                                "2027-02", "110.00",
                                "2027-03", "121.00",
                                "2027-04", "133.10"
                        )),
                        buildLinea("Alquiler", "EGRESO", Map.of(
                                "2027-01", "80.00",
                                "2027-02", "80.00",
                                "2027-03", "80.00",
                                "2027-04", "80.00"
                        ))
                ))
                .build();

        Presupuesto presupuesto = presupuestoService.crearPresupuesto(request, 1L, "user-test");
        List<PresupuestoLinea> lineas = obtenerLineasOrdenadas(presupuesto.getId());

        Map<String, List<BigDecimal>> porCategoria = lineas.stream()
                .collect(Collectors.groupingBy(PresupuestoLinea::getCategoria,
                        Collectors.mapping(PresupuestoLinea::getMontoEstimado, Collectors.toList())));

        assertThat(porCategoria.get("Sueldos"))
                .containsExactly(new BigDecimal("100.00"), new BigDecimal("110.00"), new BigDecimal("121.00"), new BigDecimal("133.10"));
        assertThat(porCategoria.get("Alquiler"))
                .containsExactly(new BigDecimal("80.00"), new BigDecimal("80.00"), new BigDecimal("80.00"), new BigDecimal("80.00"));
    }

    @Test
    @DisplayName("Debe aceptar porcentajes negativos (decrecimiento)")
    void shouldPersistNegativeAdjustments() {
        CrearPresupuestoRequest request = CrearPresupuestoRequest.builder()
                .nombre("Presupuesto Decreciente")
                .desde("2027-01")
                .hasta("2027-04")
                .autogenerarCeros(false)
                .plantilla(List.of(
                        buildLinea("Bonificaciones", "INGRESO", Map.of(
                                "2027-01", "200.00",
                                "2027-02", "190.00",
                                "2027-03", "180.50",
                                "2027-04", "171.48"
                        ))
                ))
                .build();

        Presupuesto presupuesto = presupuestoService.crearPresupuesto(request, 1L, "user-test");
        List<PresupuestoLinea> lineas = obtenerLineasOrdenadas(presupuesto.getId());

        assertThat(lineas).extracting(PresupuestoLinea::getMontoEstimado)
                .containsExactly(new BigDecimal("200.00"), new BigDecimal("190.00"), new BigDecimal("180.50"), new BigDecimal("171.48"));
    }

    @Test
    @DisplayName("Debe calcular montos compuestos cuando solo se indica porcentaje mensual negativo")
    void shouldGenerateCompoundValuesWithNegativePercentageWithoutMonthlyBreakdown() {
        CrearPresupuestoRequest.PlantillaLinea decreciente = CrearPresupuestoRequest.PlantillaLinea.builder()
                .categoria("Costos variables")
                .tipo("EGRESO")
                .montoEstimado(new BigDecimal("100000.00"))
                .porcentajeMensual(new BigDecimal("-5"))
                .build();

        CrearPresupuestoRequest request = CrearPresupuestoRequest.builder()
                .nombre("Presupuesto Decreciente Compuesto")
                .desde("2028-01")
                .hasta("2028-06")
                .autogenerarCeros(false)
                .plantilla(List.of(decreciente))
                .build();

        Presupuesto presupuesto = presupuestoService.crearPresupuesto(request, 1L, "user-negativo");
        List<PresupuestoLinea> lineas = obtenerLineasOrdenadas(presupuesto.getId());

        assertThat(lineas).hasSize(6);
        assertThat(lineas).extracting(PresupuestoLinea::getMontoEstimado)
                .containsExactly(
                        new BigDecimal("100000.00"),
                        new BigDecimal("95000.00"),
                        new BigDecimal("90250.00"),
                        new BigDecimal("85737.50"),
                        new BigDecimal("81450.63"),
                        new BigDecimal("77378.10")
                );
    }

    @Test
    @DisplayName("Debe listar los presupuestos de toda la organizacion")
    void shouldListBudgetsForEntireOrganization() {
        presupuestoService.crearPresupuesto(simpleRequest("Org-A-1"), 5L, "owner-a");
        presupuestoService.crearPresupuesto(simpleRequest("Org-A-2"), 5L, "owner-b");
        presupuestoService.crearPresupuesto(simpleRequest("Org-B-1"), 6L, "owner-c");

        List<PresupuestoDTO> resultado = presupuestoService.listByStatus(5L, PresupuestoService.ListStatus.ACTIVE);

        assertThat(resultado).extracting(PresupuestoDTO::getNombre)
            .contains("Org-A-1", "Org-A-2")
            .doesNotContain("Org-B-1");
    }

    @Test
    @DisplayName("Debe obtener presupuestos de otros owners dentro de la misma organizacion")
    void shouldRetrieveBudgetFromDifferentOwnerWithinOrganization() {
        Presupuesto presupuesto = presupuestoService.crearPresupuesto(simpleRequest("Org-C-1"), 9L, "owner-d");

        PresupuestoDTO dto = presupuestoService.getOneForOrganizacion(presupuesto.getId(), 9L);

        assertThat(dto.getNombre()).isEqualTo("Org-C-1");
    }
}
