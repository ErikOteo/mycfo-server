package pronostico.dtos;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PresupuestoDTO {
    private Long id;
    private String nombre;
    private String desde;
    private String hasta;
    private String createdAt;
    private boolean deleted;
    private String deletedAt;
    private String deletedBy;
}
