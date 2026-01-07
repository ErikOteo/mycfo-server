package registro.mercadopago.dtos;

import java.util.ArrayList;
import java.util.List;

public class FacturarResponse {
    private int creadas;
    private int omitidas;
    private List<String> errores = new ArrayList<>();
    public FacturarResponse() {}
    public FacturarResponse(int c, int o){this.creadas=c; this.omitidas=o;}
    public int getCreadas(){return creadas;} public void setCreadas(int v){this.creadas=v;}
    public int getOmitidas(){return omitidas;} public void setOmitidas(int v){this.omitidas=v;}
    public List<String> getErrores(){return errores;} public void setErrores(List<String> v){this.errores=v;}
}
