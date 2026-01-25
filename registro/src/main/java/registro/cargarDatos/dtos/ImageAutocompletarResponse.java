package registro.cargarDatos.dtos;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class ImageAutocompletarResponse {
    private String rawText;
    private Map<String, Object> campos;
    private List<String> warnings;
}
