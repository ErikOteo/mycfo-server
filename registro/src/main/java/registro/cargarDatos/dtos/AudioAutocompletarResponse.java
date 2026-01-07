package registro.cargarDatos.dtos;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class AudioAutocompletarResponse {
    private String transcript;
    private Map<String, String> campos;
    private List<String> warnings;
}

