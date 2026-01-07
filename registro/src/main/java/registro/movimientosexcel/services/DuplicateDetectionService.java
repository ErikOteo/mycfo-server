package registro.movimientosexcel.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import registro.cargarDatos.models.Movimiento;
import registro.cargarDatos.repositories.MovimientoRepository;
import registro.movimientosexcel.dtos.RegistroPreviewDTO;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DuplicateDetectionService {
    
    @Autowired
    private MovimientoRepository movimientoRepository;
    
    /**
     * Detecta duplicados en la base de datos para una lista de registros preview
     * @param registrosPreview Lista de registros a verificar
     * @param organizacionId   Tenant actual para limitar la búsqueda
     * @return Lista de registros con información de duplicados actualizada
     */
    public List<RegistroPreviewDTO> detectarDuplicadosEnBD(List<RegistroPreviewDTO> registrosPreview, Long organizacionId) {
        if (registrosPreview.isEmpty()) {
            return registrosPreview;
        }
        
        if (organizacionId == null) {
            throw new IllegalArgumentException("La organización es requerida para detectar duplicados");
        }
        
        // Crear un set de registros únicos para verificar eficientemente
        Set<RegistroKey> registrosParaVerificar = registrosPreview.stream()
            .map(this::crearMovimientoKey)
            .collect(Collectors.toSet());
        
        // Buscar duplicados en la BD de una sola vez
        List<Movimiento> duplicadosEnBD = buscarDuplicadosEnBD(registrosParaVerificar, organizacionId);
        
        // Crear un set de duplicados para búsqueda rápida
        Set<RegistroKey> duplicadosSet = duplicadosEnBD.stream()
            .map(this::crearMovimientoKey)
            .collect(Collectors.toSet());
        
        // Marcar duplicados en los registros preview
        return registrosPreview.stream()
            .map(registro -> {
                RegistroKey key = crearMovimientoKey(registro);
                if (duplicadosSet.contains(key)) {
                    registro.setEsDuplicado(true);
                    registro.setMotivoDuplicado("Movimiento ya existe en la base de datos");
                }
                return registro;
            })
            .collect(Collectors.toList());
    }
    
    /**
     * Busca duplicados en la base de datos usando una consulta optimizada
     */
    private List<Movimiento> buscarDuplicadosEnBD(Set<RegistroKey> registrosParaVerificar, Long organizacionId) {
        // Obtener todas las fechas únicas (solo día) y convertir a LocalDateTime al inicio del día
        Set<java.time.LocalDateTime> fechasUnicas = registrosParaVerificar.stream()
            .map(RegistroKey::getFechaEmision)
            .filter(fecha -> fecha != null)
            .map(fecha -> fecha.atStartOfDay())
            .collect(Collectors.toSet());
        
        // Buscar registros que coincidan en fecha (primer filtro)
        List<Movimiento> registrosPorFecha = movimientoRepository.findByOrganizacionIdAndFechaEmisionIn(organizacionId, fechasUnicas);
        
        // Filtrar los que realmente son duplicados
        return registrosPorFecha.stream()
            .filter(registro -> {
                RegistroKey key = crearMovimientoKey(registro);
                return registrosParaVerificar.contains(key);
            })
            .collect(Collectors.toList());
    }
    
    /**
     * Crea una clave única para identificar registros duplicados
     */
    private RegistroKey crearMovimientoKey(RegistroPreviewDTO movimiento) {
        return new RegistroKey(
            movimiento.getFechaEmision(),
            movimiento.getMontoTotal(),
            movimiento.getDescripcion(),
            movimiento.getOrigen()
        );
    }
    
    /**
     * Crea una clave única para identificar registros duplicados desde la BD
     */
    private RegistroKey crearMovimientoKey(Movimiento movimiento) {
        return new RegistroKey(
            movimiento.getFechaEmision() != null ? movimiento.getFechaEmision().toLocalDate() : null,
            movimiento.getMontoTotal(),
            movimiento.getDescripcion(),
            movimiento.getOrigenNombre()
        );
    }
    
    /**
     * Clase interna para representar una clave única de registro
     */
    private static class RegistroKey {
        private final LocalDate fechaEmision;
        private final Double montoTotal;
        private final String descripcion;
        private final String origen;
        
        public RegistroKey(LocalDate fechaEmision, Double montoTotal, String descripcion, String origen) {
            this.fechaEmision = fechaEmision;
            this.montoTotal = montoTotal;
            this.descripcion = descripcion != null ? descripcion.trim() : null;
            this.origen = origen;
        }
        
        public LocalDate getFechaEmision() { return fechaEmision; }
        public Double getMontoTotal() { return montoTotal; }
        public String getDescripcion() { return descripcion; }
        public String getOrigen() { return origen; }
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            
            RegistroKey that = (RegistroKey) o;
            
            if (fechaEmision != null ? !fechaEmision.equals(that.fechaEmision) : that.fechaEmision != null)
                return false;
            if (montoTotal != null ? !montoTotal.equals(that.montoTotal) : that.montoTotal != null)
                return false;
            if (descripcion != null ? !descripcion.equals(that.descripcion) : that.descripcion != null)
                return false;
            return origen != null ? origen.equals(that.origen) : that.origen == null;
        }
        
        @Override
        public int hashCode() {
            int result = fechaEmision != null ? fechaEmision.hashCode() : 0;
            result = 31 * result + (montoTotal != null ? montoTotal.hashCode() : 0);
            result = 31 * result + (descripcion != null ? descripcion.hashCode() : 0);
            result = 31 * result + (origen != null ? origen.hashCode() : 0);
            return result;
        }
    }
}
