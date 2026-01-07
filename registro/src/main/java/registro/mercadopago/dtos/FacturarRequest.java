package registro.mercadopago.dtos;

import java.util.List;

public class FacturarRequest {
    private List<Long> paymentIds;
    public List<Long> getPaymentIds(){return paymentIds;}
    public void setPaymentIds(List<Long> v){this.paymentIds=v;}
}
