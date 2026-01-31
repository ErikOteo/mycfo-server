package registro.mercadopago.services;

import registro.mercadopago.dtos.PaymentDTO;
import java.util.List;

public interface MpPaymentImportService {
    int importPaymentById(String userIdApp, Long paymentId, String usuarioSub);
    int importByMonth(String userIdApp, int month, int year, String usuarioSub);
    int importByExternalReference(String userIdApp, String externalRef, String usuarioSub);
    
    // Métodos de preview (sin guardar)
    List<PaymentDTO> previewPaymentById(String userIdApp, Long paymentId, String usuarioSub);
    List<PaymentDTO> previewByMonth(String userIdApp, int month, int year, String usuarioSub);
    List<PaymentDTO> previewByExternalReference(String userIdApp, String externalRef, String usuarioSub);
    
    // Importar pagos seleccionados
    int importSelectedPayments(String userIdApp, List<Long> paymentIds, String usuarioSub);
    
    // Actualizar categoría de un pago
    int updatePaymentCategory(String userIdApp, Long paymentId, String newCategory);
}

