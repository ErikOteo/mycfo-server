package registro.cargarDatos.dtos;

import java.time.LocalDate;

public class DocumentoComercialResponseDTO {

    private Long idDocumento;
    private String tipoDocumento;
    private String categoria;
    private Double montoTotal;
    private LocalDate fechaEmision;

    public DocumentoComercialResponseDTO(Long idDocumento, String tipoDocumento,
                                         String categoria, Double montoTotal,
                                         LocalDate fechaEmision) {
        this.idDocumento = idDocumento;
        this.tipoDocumento = tipoDocumento;
        this.categoria = categoria;
        this.montoTotal = montoTotal;
        this.fechaEmision = fechaEmision;
    }

    public Long getIdDocumento() { return idDocumento; }
    public String getTipoDocumento() { return tipoDocumento; }
    public String getCategoria() { return categoria; }
    public Double getMontoTotal() { return montoTotal; }
    public LocalDate getFechaEmision() { return fechaEmision; }
}
