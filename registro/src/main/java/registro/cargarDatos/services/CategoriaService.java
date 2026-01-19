package registro.cargarDatos.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import registro.cargarDatos.models.Categoria;
import registro.cargarDatos.models.TipoMovimiento;
import registro.cargarDatos.repositories.CategoriaRepository;
import registro.movimientosexcel.services.CategorySuggestionService;
import registro.services.AdministracionService;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final CategorySuggestionService categorySuggestionService;
    private final AdministracionService administracionService;

    public List<String> obtenerCategorias(String usuarioSub, TipoMovimiento tipo) {
        Long orgId = null;
        if (usuarioSub != null && !usuarioSub.isBlank()) {
            try {
                orgId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
            } catch (RuntimeException e) {
                log.warn("No se pudo resolver organizacion para {}: {}", usuarioSub, e.getMessage());
            }
        }

        Set<String> resultado = new LinkedHashSet<>();

        // Categorías fijas (siempre presentes)
        if (tipo == null) {
            resultado.addAll(categorySuggestionService.obtenerTodasLasCategorias());
        } else {
            resultado.addAll(categorySuggestionService.obtenerCategorias(tipo));
        }

        if (orgId != null) {
            List<Categoria> personalizadas;
            if (tipo == null) {
                personalizadas = categoriaRepository.findByOrganizacionIdAndActivoTrue(orgId);
            } else {
                personalizadas = categoriaRepository.findActivasPorOrgYTipo(orgId, tipo);
            }
            personalizadas.stream()
                    .map(Categoria::getNombre)
                    .filter(StringUtils::hasText)
                    .map(String::trim)
                    .forEach(resultado::add);
        }

        return new ArrayList<>(resultado);
    }

    public Categoria crearCategoria(String usuarioSub, String nombre, TipoMovimiento tipo) {
        if (!StringUtils.hasText(nombre)) {
            throw new IllegalArgumentException("El nombre de la categoría es obligatorio");
        }

        Long orgId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);

        String normalizada = nombre.trim();

        // Evitar duplicados (case-insensitive) dentro de la organización
        var existente = categoriaRepository.findFirstByOrganizacionIdAndNombreIgnoreCaseAndActivoTrue(orgId, normalizada);
        if (existente.isPresent()) {
            return existente.get();
        }

        Categoria nueva = new Categoria();
        nueva.setNombre(normalizada);
        nueva.setTipo(tipo);
        nueva.setOrganizacionId(orgId);
        nueva.setUsuarioId(usuarioSub);
        nueva.setActivo(true);

        return categoriaRepository.save(nueva);
    }
}
