package pronostico.controllers;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import pronostico.models.Presupuesto;
import pronostico.repositories.PresupuestoRepository;
import pronostico.services.AdministracionService;

import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PresupuestoControllerSecurityIT {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private PresupuestoRepository presupuestoRepository;

    @MockBean
    private AdministracionService administracionService;

    @BeforeEach
    void setUp() {
        presupuestoRepository.deleteAll();
    }

    @Test
    void unauthenticatedShouldReturn401() throws Exception {
        mvc.perform(get("/api/presupuestos"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void authenticatedListsOrganizationBudgets() throws Exception {
        Presupuesto propio = presupuestoRepository.save(buildPresupuesto("Mine", "sub-user-A", 42L));
        Presupuesto otro = presupuestoRepository.save(buildPresupuesto("Other", "sub-user-B", 42L));
        presupuestoRepository.save(buildPresupuesto("OtherOrg", "sub-user-C", 99L));

        when(administracionService.obtenerEmpresaIdPorUsuarioSub("sub-user-A")).thenReturn(42L);

        mvc.perform(get("/api/presupuestos")
                .with(jwt().jwt(jwt -> jwt.subject("sub-user-A")))
                .header("X-Usuario-Sub", "sub-user-A")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.content[*].id", hasItems(propio.getId().intValue(), otro.getId().intValue())))
            .andExpect(jsonPath("$.content[*].nombre", hasItems("Mine", "Other")));
    }

    @Test
    void forbidAccessingBudgetsFromAnotherOrganization() throws Exception {
        Presupuesto otro = presupuestoRepository.save(buildPresupuesto("Other", "sub-user-B", 99L));

        when(administracionService.obtenerEmpresaIdPorUsuarioSub("sub-user-A")).thenReturn(42L);

        mvc.perform(get("/api/presupuestos/" + otro.getId())
                .with(jwt().jwt(jwt -> jwt.subject("sub-user-A")))
                .header("X-Usuario-Sub", "sub-user-A")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }

    private Presupuesto buildPresupuesto(String nombre, String ownerSub, long organizacionId) {
        return Presupuesto.builder()
            .nombre(nombre)
            .ownerSub(ownerSub)
            .organizacionId(organizacionId)
            .desde("2024-01-01")
            .hasta("2024-12-31")
            .build();
    }
}
