package reporte.dtos;

public class DetalleCategoriaDTO {
    private String categoria;
    private Double total;

    public DetalleCategoriaDTO(String categoria, Double total) {
        this.categoria = categoria;
        this.total = total;
    }

    public String getCategoria() { return categoria; }
    public Double getTotal() { return total; }
}
