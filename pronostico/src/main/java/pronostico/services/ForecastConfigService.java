package pronostico.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pronostico.dtos.*;
import pronostico.models.ForecastConfig;
import pronostico.repositories.ForecastConfigRepository;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForecastConfigService {

    private final ForecastConfigRepository repository;
    private final AdministracionService administracionService;

    private static final DateTimeFormatter ISO_DATE_TIME = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Obtiene todas las configuraciones de una empresa
     */
    public List<ForecastConfigDTO> obtenerConfiguraciones(Long organizacionId) {
        List<ForecastConfig> configs = repository.findByOrganizacionId(organizacionId);
        return configs.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene solo las configuraciones activas de una empresa
     */
    public List<ForecastConfigDTO> obtenerConfiguracionesActivas(Long organizacionId) {
        List<ForecastConfig> configs = repository.findByOrganizacionIdAndActivo(organizacionId, true);
        return configs.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene una configuración por ID
     */
    public ForecastConfigDTO obtenerPorId(Long id) {
        ForecastConfig config = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Configuración no encontrada"));
        return toDto(config);
    }

    /**
     * Crea una nueva configuración
     */
    @Transactional
    public ForecastConfigDTO crearConfiguracion(CrearForecastConfigRequest request, String usuarioSub) {
        // Validar que el usuario tiene empresa asociada
        Long organizacionId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        
        // Validar que no exista una configuración con el mismo nombre
        if (repository.existsByOrganizacionIdAndNombre(organizacionId, request.getNombre())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, 
                    "Ya existe una configuración con el nombre: " + request.getNombre());
        }
        
        // Validar campos
        if (request.getMesesFrecuencia() == null || request.getMesesFrecuencia() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Los meses de frecuencia deben ser mayor a 0");
        }
        
        if (request.getHorizonteMeses() == null || request.getHorizonteMeses() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "El horizonte de meses debe ser mayor a 0");
        }
        
        // Crear configuración
        ForecastConfig config = ForecastConfig.builder()
                .organizacionId(organizacionId)
                .nombre(request.getNombre())
                .mesesFrecuencia(request.getMesesFrecuencia())
                .horizonteMeses(request.getHorizonteMeses())
                .creadoPor(usuarioSub)
                .activo(true)
                .build();
        
        config = repository.save(config);
        log.info("Configuración de forecast creada: ID={}, Organización={}, Nombre={}", 
                config.getId(), config.getOrganizacionId(), config.getNombre());
        
        return toDto(config);
    }

    /**
     * Actualiza una configuración existente
     */
    @Transactional
    public ForecastConfigDTO actualizarConfiguracion(Long id, ActualizarForecastConfigRequest request, String usuarioSub) {
        ForecastConfig config = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Configuración no encontrada"));
        
        // Verificar que el usuario tiene acceso a esta configuración
        Long organizacionId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        if (!config.getOrganizacionId().equals(organizacionId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tiene permisos para modificar esta configuración");
        }
        
        // Actualizar campos
        if (request.getNombre() != null) {
            // Verificar que el nuevo nombre no exista en otra configuración
            if (!request.getNombre().equals(config.getNombre()) && 
                repository.existsByOrganizacionIdAndNombre(organizacionId, request.getNombre())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, 
                        "Ya existe una configuración con el nombre: " + request.getNombre());
            }
            config.setNombre(request.getNombre());
        }
        
        if (request.getMesesFrecuencia() != null) {
            if (request.getMesesFrecuencia() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "Los meses de frecuencia deben ser mayor a 0");
            }
            config.setMesesFrecuencia(request.getMesesFrecuencia());
        }
        
        if (request.getHorizonteMeses() != null) {
            if (request.getHorizonteMeses() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "El horizonte de meses debe ser mayor a 0");
            }
            config.setHorizonteMeses(request.getHorizonteMeses());
        }
        
        if (request.getActivo() != null) {
            config.setActivo(request.getActivo());
        }
        
        config = repository.save(config);
        log.info("Configuración de forecast actualizada: ID={}", id);
        
        return toDto(config);
    }

    /**
     * Elimina una configuración (soft delete)
     */
    @Transactional
    public void eliminarConfiguracion(Long id, String usuarioSub) {
        ForecastConfig config = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Configuración no encontrada"));
        
        // Verificar permisos
        Long organizacionId = administracionService.obtenerEmpresaIdPorUsuarioSub(usuarioSub);
        if (!config.getOrganizacionId().equals(organizacionId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tiene permisos para eliminar esta configuración");
        }
        
        repository.delete(config);
        log.info("Configuración de forecast eliminada: ID={}", id);
    }

    /**
     * Convierte entidad a DTO
     */
    private ForecastConfigDTO toDto(ForecastConfig config) {
        return ForecastConfigDTO.builder()
                .id(config.getId())
                .organizacionId(config.getOrganizacionId())
                .nombre(config.getNombre())
                .mesesFrecuencia(config.getMesesFrecuencia())
                .horizonteMeses(config.getHorizonteMeses())
                .creadoPor(config.getCreadoPor())
                .createdAt(config.getCreatedAt() != null ? config.getCreatedAt().format(ISO_DATE_TIME) : null)
                .updatedAt(config.getUpdatedAt() != null ? config.getUpdatedAt().format(ISO_DATE_TIME) : null)
                .activo(config.isActivo())
                .build();
    }
}

