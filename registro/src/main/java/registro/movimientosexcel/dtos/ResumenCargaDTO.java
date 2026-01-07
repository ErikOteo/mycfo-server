package registro.movimientosexcel.dtos;

import java.util.List;

public class ResumenCargaDTO {
    private int total;
    private int correctos;
    private List<FilaConErrorDTO> errores;

    public ResumenCargaDTO(int total, int correctos, List<FilaConErrorDTO> errores) {
        this.total = total;
        this.correctos = correctos;
        this.errores = errores;
    }

    public int getTotal() {
        return total;
    }

    public int getCorrectos() {
        return correctos;
    }

    public List<FilaConErrorDTO> getErrores() {
        return errores;
    }
}
