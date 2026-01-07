package registro.cargarDatos.dtos;

import lombok.Data;
import registro.cargarDatos.models.TipoMovimiento;

@Data
public class CargaDatosRequest {
    private String tipo; // "factura", "recibo", "pagare", "movimiento"
    private String metodo; // "formulario", "excel", "voz", "audio"
    private TipoMovimiento tipoMovimiento; // Ingreso, Egreso, Deuda, Acreencia
    private Object datos; // Los datos del documento/movimiento
    private String usuarioId;
    private Long organizacionId;
}

