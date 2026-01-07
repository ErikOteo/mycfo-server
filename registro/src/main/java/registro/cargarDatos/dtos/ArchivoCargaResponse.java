package registro.cargarDatos.dtos;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class ArchivoCargaResponse {
    int totalFilas;
    int registrosCargados;
    List<ArchivoError> errores;

    @Value
    @Builder
    public static class ArchivoError {
        int fila;
        String mensaje;
    }
}


