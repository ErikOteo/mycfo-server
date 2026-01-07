package registro.mercadopago.services;

import registro.mercadopago.dtos.PaymentDTO;
import java.util.List;

public interface MpPaymentImportService {
    int importPaymentById(Long userIdApp, Long paymentId, String usuarioSub);
    int importByMonth(Long userIdApp, int month, int year, String usuarioSub);
    int importByExternalReference(Long userIdApp, String externalRef, String usuarioSub);
    
    // Métodos de preview (sin guardar)
    List<PaymentDTO> previewPaymentById(Long userIdApp, Long paymentId, String usuarioSub);
    List<PaymentDTO> previewByMonth(Long userIdApp, int month, int year, String usuarioSub);
    List<PaymentDTO> previewByExternalReference(Long userIdApp, String externalRef, String usuarioSub);
    
    // Importar pagos seleccionados
    int importSelectedPayments(Long userIdApp, List<Long> paymentIds, String usuarioSub);
    
    // Actualizar categoría de un pago
    int updatePaymentCategory(Long userIdApp, Long paymentId, String newCategory);
}

