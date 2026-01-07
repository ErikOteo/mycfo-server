package reporte.dtos;

import java.util.List;

public class CashflowDTO {
    private int anio;
    private double saldoInicial;
    private List<MesCashflowDTO> meses;

    public CashflowDTO(int anio, double saldoInicial, List<MesCashflowDTO> meses) {
        this.anio = anio;
        this.saldoInicial = saldoInicial;
        this.meses = meses;
    }

    public int getAnio() { return anio; }
    public double getSaldoInicial() { return saldoInicial; }
    public List<MesCashflowDTO> getMeses() { return meses; }
}
