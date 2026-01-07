package registro.mercadopago.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import registro.cargarDatos.models.Movimiento;
import registro.cargarDatos.repositories.MovimientoRepository;
import registro.mercadopago.dtos.PaymentDTO;
import registro.mercadopago.repositories.MpImportedPaymentRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Servicio para detectar pagos duplicados de Mercado Pago
 * antes de importarlos a la base de datos
 */
@Service
public class MpDuplicateDetectionService {
    
    @Autowired
    private MovimientoRepository MovimientoRepo;
    
    @Autowired
    private MpImportedPaymentRepository mpImportedPaymentRepository;
    
    /**
     * Detecta duplicados en la base de datos para una lista de pagos de Mercado Pago
     * Un pago es duplicado si ya existe en la BD con:
     * - Misma fecha
     * - Mismo monto
     * - Misma descripción
     * - Mismo origen (MercadoPago o email del payer)
     * 
     * @param pagosPreview Lista de pagos a verificar
     * @return Lista de pagos con información de duplicados actualizada
     */
    public List<PaymentDTO> detectarDuplicadosEnBD(List<PaymentDTO> pagosPreview, Long organizacionId) {
        if (pagosPreview == null || pagosPreview.isEmpty()) {
            return pagosPreview;
        }
        if (organizacionId == null) {
            throw new IllegalArgumentException("El ID de organización es obligatorio para validar duplicados");
        }
        
        // 1. Verificar duplicados por ID de Mercado Pago (más confiable)
        Set<String> mpPaymentIds = pagosPreview.stream()
            .map(PaymentDTO::getMpPaymentId)
            .filter(id -> id != null)
            .map(String::valueOf)
            .collect(Collectors.toSet());
        
        Set<String> mpIdsExistentes = mpImportedPaymentRepository.findByMpPaymentIdIn(mpPaymentIds)
            .stream()
            .map(mp -> mp.getMpPaymentId())
            .collect(Collectors.toSet());
        
        // 2. Verificar duplicados por datos del movimiento (fallback)
        Set<PagoKey> pagosParaVerificar = pagosPreview.stream()
            .map(this::crearPagoKey)
            .collect(Collectors.toSet());
        
        List<Movimiento> duplicadosEnBD = buscarDuplicadosEnBD(pagosParaVerificar, organizacionId);
        
        Set<PagoKey> duplicadosSet = duplicadosEnBD.stream()
            .map(this::crearPagoKey)
            .collect(Collectors.toSet());
        
        // 3. Marcar duplicados en los pagos preview
        return pagosPreview.stream()
            .map(pago -> {
                String mpPaymentIdStr = pago.getMpPaymentId() != null ? 
                    String.valueOf(pago.getMpPaymentId()) : null;
                    
                boolean esDuplicadoPorId = mpPaymentIdStr != null && mpIdsExistentes.contains(mpPaymentIdStr);
                boolean esDuplicadoPorDatos = duplicadosSet.contains(crearPagoKey(pago));
                
                if (esDuplicadoPorId) {
                    pago.setEsDuplicado(true);
                    pago.setMotivoDuplicado("Este pago de Mercado Pago ya fue importado previamente");
                } else if (esDuplicadoPorDatos) {
                    pago.setEsDuplicado(true);
                    pago.setMotivoDuplicado("Ya existe un movimiento con la misma fecha, monto y descripción");
                }
                
                return pago;
            })
            .collect(Collectors.toList());
    }
    
    /**
     * Busca duplicados en la base de datos usando una consulta optimizada
     */
    private List<Movimiento> buscarDuplicadosEnBD(Set<PagoKey> pagosParaVerificar, Long organizacionId) {
        // Obtener todas las fechas únicas (solo día) y convertir a LocalDateTime al inicio del día
        Set<java.time.LocalDateTime> fechasUnicas = pagosParaVerificar.stream()
            .map(PagoKey::getFechaEmision)
            .filter(fecha -> fecha != null)
            .map(fecha -> fecha.atStartOfDay())
            .collect(Collectors.toSet());
        
        if (fechasUnicas.isEmpty()) {
            return List.of();
        }
        
        // Buscar registros que coincidan en fecha (primer filtro)
        List<Movimiento> registrosPorFecha = MovimientoRepo.findByOrganizacionIdAndFechaEmisionIn(organizacionId, fechasUnicas);
        
        // Filtrar los que realmente son duplicados (comparar fecha, monto, descripción, origen)
        return registrosPorFecha.stream()
            .filter(movimiento -> {
                PagoKey key = crearPagoKey(movimiento);
                return pagosParaVerificar.contains(key);
            })
            .collect(Collectors.toList());
    }
    
    /**
     * Crea una clave única para identificar pagos duplicados (desde PaymentDTO)
     */
    private PagoKey crearPagoKey(PaymentDTO pago) {
        return new PagoKey(
            pago.getFecha(),
            pago.getMontoTotal() != null ? pago.getMontoTotal().doubleValue() : null,
            pago.getDescripcion(),
            pago.getOrigen()
        );
    }
    
    /**
     * Crea una clave única para identificar pagos duplicados (desde Registro en BD)
     */
    private PagoKey crearPagoKey(Movimiento movimiento) {
        return new PagoKey(
                movimiento.getFechaEmision() != null ? movimiento.getFechaEmision().toLocalDate() : null,
                movimiento.getMontoTotal(),
                movimiento.getDescripcion(),
                movimiento.getOrigenNombre()
        );
    }
    
    /**
     * Clase interna para representar una clave única de pago
     * Se considera duplicado si coinciden: fecha + monto + descripción + origen
     */
    private static class PagoKey {
        private final LocalDate fechaEmision;
        private final Double montoTotal;
        private final String descripcion;
        private final String origen;
        
        public PagoKey(LocalDate fechaEmision, Double montoTotal, String descripcion, String origen) {
            this.fechaEmision = fechaEmision;
            this.montoTotal = montoTotal;
            this.descripcion = descripcion != null ? descripcion.trim().toLowerCase() : null;
            this.origen = origen != null ? origen.trim().toLowerCase() : null;
        }
        
        public LocalDate getFechaEmision() { return fechaEmision; }
        public Double getMontoTotal() { return montoTotal; }
        public String getDescripcion() { return descripcion; }
        public String getOrigen() { return origen; }
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            
            PagoKey that = (PagoKey) o;
            
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

