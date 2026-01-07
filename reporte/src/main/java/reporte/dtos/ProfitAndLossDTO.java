package reporte.dtos;

import java.time.LocalDate;
import java.util.List;

/**
 * ProfitAndLossDTO – DTO extendido para el Estado de Resultados (P&L)
 * Utiliza el DTO externo DetalleCategoriaDTO para el desglose, asegurando consistencia.
 */
public class ProfitAndLossDTO {

    private int anio;
    private List<DocumentoComercialDTO> documentos;
    private double[] ingresosMensuales = new double[12];
    private double[] egresosMensuales = new double[12];
    private double resultadoAnual;

    // Usa la clase DetalleCategoriaDTO correcta del proyecto
    private List<DetalleCategoriaDTO> detalleIngresos;
    private List<DetalleCategoriaDTO> detalleEgresos;

    public ProfitAndLossDTO() {}

    public ProfitAndLossDTO(int anio, List<DocumentoComercialDTO> documentos,
                            double[] ingresosMensuales, double[] egresosMensuales, double resultadoAnual,
                            List<DetalleCategoriaDTO> detalleIngresos, List<DetalleCategoriaDTO> detalleEgresos) {
        this.anio = anio;
        this.documentos = documentos;
        this.ingresosMensuales = ingresosMensuales;
        this.egresosMensuales = egresosMensuales;
        this.resultadoAnual = resultadoAnual;
        this.detalleIngresos = detalleIngresos;
        this.detalleEgresos = detalleEgresos;
    }

    // --- Getters y Setters ---
    public int getAnio() { return anio; }
    public void setAnio(int anio) { this.anio = anio; }

    public List<DocumentoComercialDTO> getDocumentos() { return documentos; }
    public void setDocumentos(List<DocumentoComercialDTO> documentos) { this.documentos = documentos; }

    public double[] getIngresosMensuales() { return ingresosMensuales; }
    public void setIngresosMensuales(double[] ingresosMensuales) { this.ingresosMensuales = ingresosMensuales; }

    public double[] getEgresosMensuales() { return egresosMensuales; }
    public void setEgresosMensuales(double[] egresosMensuales) { this.egresosMensuales = egresosMensuales; }

    public double getResultadoAnual() { return resultadoAnual; }
    public void setResultadoAnual(double resultadoAnual) { this.resultadoAnual = resultadoAnual; }

    public List<DetalleCategoriaDTO> getDetalleIngresos() { return detalleIngresos; }
    public void setDetalleIngresos(List<DetalleCategoriaDTO> detalleIngresos) { this.detalleIngresos = detalleIngresos; }

    public List<DetalleCategoriaDTO> getDetalleEgresos() { return detalleEgresos; }
    public void setDetalleEgresos(List<DetalleCategoriaDTO> detalleEgresos) { this.detalleEgresos = detalleEgresos; }


    // --- Sub-DTO para la lista de documentos (sin cambios) ---
    public static class DocumentoComercialDTO {
        private Long idDocumento;
        private String tipoDocumento;
        private String categoria;
        private Double montoTotal;
        private LocalDate fechaEmision;

        // Getters y Setters... (sin cambios)
        public Long getIdDocumento() { return idDocumento; }
        public void setIdDocumento(Long idDocumento) { this.idDocumento = idDocumento; }
        public String getTipoDocumento() { return tipoDocumento; }
        public void setTipoDocumento(String tipoDocumento) { this.tipoDocumento = tipoDocumento; }
        public String getCategoria() { return categoria; }
        public void setCategoria(String categoria) { this.categoria = categoria; }
        public Double getMontoTotal() { return montoTotal; }
        public void setMontoTotal(Double montoTotal) { this.montoTotal = montoTotal; }
        public LocalDate getFechaEmision() { return fechaEmision; }
        public void setFechaEmision(LocalDate fechaEmision) { this.fechaEmision = fechaEmision; }
    }
}
