package administracion.dtos;

import lombok.Data;

@Data
public class CambiarPasswordDTO {
    private String oldPassword;
    private String newPassword;
}
