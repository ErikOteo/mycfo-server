package registro.movimientosexcel.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class ExcelLibreConfigDTO {
    /**
     * Mapeo de campos canónicos -> índice de columna (0-based).
     * Obligatorios: fecha, descripcion, monto.
     * Opcionales: categoria, tipo, moneda, medioPago, origen, referencia.
     */
    private Map<String, Integer> columnMap;

    /**
     * Fila (1-based) donde comienzan los datos (no el header).
     * Ej: si el header está en fila 1, dataStartRow = 2.
     */
    private Integer dataStartRow;

    /**
     * Formato de fecha opcional, ej: "dd/MM/yyyy".
     */
    private String dateFormat;

    /**
     * Separador decimal opcional, ej: "," o ".".
     */
    private String decimalSeparator;
}
