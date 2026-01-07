package registro.movimientosexcel.dtos;

public class FilaConErrorDTO {
    private int fila;
    private String mensaje;

    public FilaConErrorDTO(int fila, String mensaje) {
        this.fila = fila;
        this.mensaje = mensaje;
    }

    public int getFila() {
        return fila;
    }

    public String getMensaje() {
        return mensaje;
    }
}

