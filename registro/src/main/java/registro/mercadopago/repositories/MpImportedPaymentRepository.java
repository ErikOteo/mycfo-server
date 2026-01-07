package registro.mercadopago.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import registro.mercadopago.models.MpImportedPayment;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface MpImportedPaymentRepository extends JpaRepository<MpImportedPayment, Long>, JpaSpecificationExecutor<MpImportedPayment> {
    
    // Buscar pagos importados por usuario
    Page<MpImportedPayment> findByUsuarioIdOrderByFechaEmisionDesc(UUID usuarioId, Pageable pageable);
    
    // Buscar pagos importados por usuario y cuenta de MP
    Page<MpImportedPayment> findByUsuarioIdAndMpAccountIdOrderByFechaEmisionDesc(
        UUID usuarioId, String mpAccountId, Pageable pageable);
    
    // Buscar por rango de fechas
    @Query("SELECT p FROM MpImportedPayment p WHERE p.usuarioId = :usuarioId " +
           "AND p.fechaEmision BETWEEN :from AND :to " +
           "ORDER BY p.fechaEmision DESC")
    Page<MpImportedPayment> findByUsuarioIdAndFechaEmisionBetween(
        @Param("usuarioId") UUID usuarioId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        Pageable pageable);
    
    // Buscar por descripción (búsqueda de texto)
    @Query("SELECT p FROM MpImportedPayment p WHERE p.usuarioId = :usuarioId " +
           "AND (LOWER(p.descripcion) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%'))) " +
           "ORDER BY p.fechaEmision DESC")
    Page<MpImportedPayment> findByUsuarioIdAndDescriptionContaining(
        @Param("usuarioId") UUID usuarioId,
        @Param("q") String query,
        Pageable pageable);
    
    // Buscar por ID de pago de Mercado Pago
    MpImportedPayment findByMpPaymentIdAndUsuarioId(String mpPaymentId, UUID usuarioId);
    
    // Buscar por registro ID
    MpImportedPayment findByRegistroId(Long registroId);
    
    // Contar pagos importados por usuario
    long countByUsuarioId(UUID usuarioId);
    
    // Obtener pagos por categoría
    @Query("SELECT p FROM MpImportedPayment p WHERE p.usuarioId = :usuarioId " +
           "AND p.categoria = :categoria " +
           "ORDER BY p.fechaEmision DESC")
    List<MpImportedPayment> findByUsuarioIdAndCategoria(
        @Param("usuarioId") UUID usuarioId,
        @Param("categoria") String categoria);
    
    // Buscar por múltiples IDs de Mercado Pago (para detección de duplicados)
    List<MpImportedPayment> findByMpPaymentIdIn(Collection<String> mpPaymentIds);
}
