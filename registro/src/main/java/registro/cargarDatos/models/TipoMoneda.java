package registro.cargarDatos.models;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum TipoMoneda {
    ARS,
    USD,
    EUR;

    @JsonCreator
    public static TipoMoneda fromString(String value) {
        return value == null ? null : TipoMoneda.valueOf(value.toUpperCase());
    }
}
