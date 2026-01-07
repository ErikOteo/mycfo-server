package registro.cargarDatos.dtos;

import java.time.LocalDate;
import java.util.List;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ConciliacionResumenResponse {
    Long organizacionId;
    String usuarioId;
    String periodo;
    long totalMovimientos;
    long conciliados;
    long pendientes;
    double porcentajeConciliados;
    LocalDate ultimaConciliacion;
    LocalDate ultimoPendiente;
    List<ConciliacionTipoResumen> porTipo;
}

