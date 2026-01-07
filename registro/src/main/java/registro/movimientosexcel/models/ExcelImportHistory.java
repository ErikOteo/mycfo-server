package registro.movimientosexcel.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
public class ExcelImportHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String fileName;
    private String tipoOrigen;
    private Integer totalRegistros;
    private Integer registrosProcesados;
    private Integer registrosGuardados;
    private LocalDateTime fechaImportacion;
    private UUID usuario;
    private String estado; // "COMPLETADO", "ERROR", "PARCIAL"
    private String observaciones;
    
    @PrePersist
    protected void onCreate() {
        fechaImportacion = LocalDateTime.now();
    }
}
