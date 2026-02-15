// consolidacion/mercadopago/services/MpWalletMovementImportService.java
package registro.mercadopago.services.util;

import java.time.LocalDate;

public interface MpWalletMovementImportService {
    /** Importa por rango de fechas (inclusive). Devuelve cantidad importada/actualizada. */
    int importRange(String userIdApp, LocalDate from, LocalDate to);

    /** Importa por “número de movimiento” (string alfanumérico). */
    int importByMovementId(String userIdApp, String movementId);
}
