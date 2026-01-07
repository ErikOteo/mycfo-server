package reporte.dtos;

import java.time.LocalDateTime;

public class RegistroDTO {
    private Long id;
    private String tipo; // Ingreso, Egreso, Deuda, Acreencia
    private Double montoTotal;
    private LocalDateTime fechaEmision;
    private String categoria;
    private String medioPago;
    private DocumentoDTO documentoComercial;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public Double getMontoTotal() { return montoTotal; }
    public void setMontoTotal(Double montoTotal) { this.montoTotal = montoTotal; }

    public LocalDateTime getFechaEmision() { return fechaEmision; }
    public void setFechaEmision(LocalDateTime fechaEmision) { this.fechaEmision = fechaEmision; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getMedioPago() { return medioPago; }
    public void setMedioPago(String medioPago) { this.medioPago = medioPago; }

    public DocumentoDTO getDocumentoComercial() { return documentoComercial; }
    public void setDocumentoComercial(DocumentoDTO documentoComercial) { this.documentoComercial = documentoComercial; }

    // Sub-DTO para mapear el documento comercial embebido en /movimientos
    public static class DocumentoDTO {
        private Long idDocumento;
        private String tipoDocumento;
        private String categoria;
        private LocalDateTime fechaEmision;

        public Long getIdDocumento() { return idDocumento; }
        public void setIdDocumento(Long idDocumento) { this.idDocumento = idDocumento; }

        public String getTipoDocumento() { return tipoDocumento; }
        public void setTipoDocumento(String tipoDocumento) { this.tipoDocumento = tipoDocumento; }

        public String getCategoria() { return categoria; }
        public void setCategoria(String categoria) { this.categoria = categoria; }

        public LocalDateTime getFechaEmision() { return fechaEmision; }
        public void setFechaEmision(LocalDateTime fechaEmision) { this.fechaEmision = fechaEmision; }
    }
}
