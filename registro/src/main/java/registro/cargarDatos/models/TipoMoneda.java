package registro.cargarDatos.models;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum TipoMoneda {
    ARS,
    USD,
    EUR;

    @JsonCreator
    public static TipoMoneda fromString(String value) {
        if (value == null || value.isBlank())
            return null;

        // Normalización para quitar acentos
        String clean = java.text.Normalizer.normalize(value.toLowerCase(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim();

        if (clean.contains("dolar") || clean.contains("usd") || clean.contains("u$s"))
            return USD;
        if (clean.contains("peso") || clean.contains("ars") || clean.contains("$"))
            return ARS;
        if (clean.contains("euro") || clean.contains("eur"))
            return EUR;
        try {
            return TipoMoneda.valueOf(clean.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
