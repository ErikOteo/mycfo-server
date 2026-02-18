package registro.cargarDatos.services;

import org.springframework.stereotype.Service;
import registro.cargarDatos.models.TipoMovimiento;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AudioParserService {

    private static final Pattern MONTO_PATTERN = Pattern.compile(
            "(?i)(?:monto(?:\\s+(?:total|final))?|importe(?:\\s+(?:total|final))?|total(?:\\s+(?:a\\s+pagar|general|final))?|valor(?:\\s+total)?|suma(?:\\s+total)?|saldo(?:\\s+total)?|cantidad(?:\\s+(?:total|a\\s+pagar))?)(?:\\s*(?:de|es|=|:))?\\s*(?:son\\s+)?\\$?\\s*([0-9]+(?:[\\.,][0-9]{3})*(?:[\\.,][0-9]{1,2})?)");
    private static final Pattern NUMERO_SIMPLE_PATTERN = Pattern.compile("\\$?\\s*([0-9]+(?:[\\.,][0-9]{3})*(?:[\\.,][0-9]{1,2})?)");
    private static final List<String> PALABRAS_CLAVE_MONTO = List.of(
            "monto", "importe", "total", "valor", "suma", "saldo", "cantidad", "pago");

    private static final Pattern ETIQUETAS_CORTE_PATTERN = Pattern.compile(
            "(?i)\\b(vendedor|comprador|cliente|proveedor|destino|origen|descripcion|descripción|concepto|categoria|categoría|medio\\s+de\\s+pago|medio|cuit|factura|numero|número|tipo|version|versión|fecha|monto|moneda|documento)\\b");

    private static final Pattern NUMERO_DOCUMENTO_PATTERN = Pattern.compile(
            "(?i)(?:numero|número|factura|comprobante)\\s*(?:de)?\\s*(?:factura)?\\s*[:#\\-]?\\s*([A-Z]{1,3}-?\\d{3,4}-?\\d{4,8}|\\d{6,12})");

    private static final Pattern TIPO_FACTURA_PATTERN = Pattern.compile("(?i)factura\\s+([ABC])\\b");

    private static final Pattern VERSION_DOCUMENTO_PATTERN = Pattern.compile("(?i)\\b(original|duplicado)\\b");

    private static final Pattern FECHA_NUMERICA_PATTERN = Pattern.compile("(\\d{1,2})[\\/-](\\d{1,2})[\\/-](\\d{2,4})");

    private static final Pattern FECHA_LETRAS_PATTERN = Pattern.compile(
            "(?i)(\\d{1,2})\\s+de\\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\\s+de\\s+(\\d{4})");

    private static final Map<String, Integer> MESES = Map.ofEntries(
            Map.entry("enero", 1),
            Map.entry("febrero", 2),
            Map.entry("marzo", 3),
            Map.entry("abril", 4),
            Map.entry("mayo", 5),
            Map.entry("junio", 6),
            Map.entry("julio", 7),
            Map.entry("agosto", 8),
            Map.entry("septiembre", 9),
            Map.entry("setiembre", 9),
            Map.entry("octubre", 10),
            Map.entry("noviembre", 11),
            Map.entry("diciembre", 12)
    );

    public Map<String, String> parseMovimiento(String transcript, TipoMovimiento tipoMovimiento) {
        Map<String, String> resultado = new LinkedHashMap<>();

        String textoProcesado = prepararTexto(transcript);

        extraerMonto(textoProcesado).ifPresent(valor -> resultado.put("montoTotal", valor));
        extraerMoneda(textoProcesado).ifPresent(valor -> resultado.put("moneda", valor));
        extraerFecha(textoProcesado).ifPresent(valor -> resultado.put("fechaEmision", valor));
        extraerMedioPago(textoProcesado).ifPresent(valor -> resultado.put("medioPago", valor));
        extraerCategoria(textoProcesado).ifPresent(valor -> resultado.put("categoria", valor));
        extraerDescripcion(textoProcesado).ifPresent(valor -> resultado.put("descripcion", valor));
        extraerDatoPorEtiquetas(textoProcesado, List.of("numero de factura asociada", "factura asociada")).ifPresent(valor -> resultado.put("numeroDocumentoAsociado", valor));

        if (tipoMovimiento == TipoMovimiento.Ingreso || tipoMovimiento == null) {
            extraerDatoPorEtiquetas(textoProcesado, List.of("cliente", "cobramos a", "origen", "comprador", "destinatario")).ifPresent(valor -> resultado.put("origenNombre", valor));
        } else {
            extraerDatoPorEtiquetas(textoProcesado, List.of("proveedor", "destino", "pagamos a", "vendedor", "emitida por")).ifPresent(valor -> resultado.put("destinoNombre", valor));
        }

        extraerDatoPorEtiquetas(textoProcesado, List.of("cuit", "c u i t", "cuit vendedor", "cuit comprador")).ifPresent(valor -> {
            if (tipoMovimiento == TipoMovimiento.Ingreso || tipoMovimiento == null) {
                resultado.put("origenCuit", valor);
            } else {
                resultado.put("destinoCuit", valor);
            }
        });

        extraerDatoPorEtiquetas(textoProcesado, List.of("numero de documento", "numero", "número", "documento")).ifPresent(valor -> resultado.put("numeroDocumento", valor));
        extraerDatoPorEtiquetas(textoProcesado, List.of("tipo de documento", "tipo")).ifPresent(valor -> resultado.put("tipoDocumento", valor));

        return resultado;
    }

    public Map<String, String> parseFactura(String transcript) {
        Map<String, String> resultado = new LinkedHashMap<>();

        String textoProcesado = prepararTexto(transcript);

        extraerMonto(textoProcesado).ifPresent(valor -> resultado.put("montoTotal", valor));
        extraerMoneda(textoProcesado).ifPresent(valor -> resultado.put("moneda", valor));
        extraerFecha(textoProcesado).ifPresent(valor -> resultado.put("fechaEmision", valor));
        extraerNumeroDocumento(textoProcesado).ifPresent(valor -> resultado.put("numeroDocumento", valor));
        extraerTipoFactura(textoProcesado).ifPresent(valor -> resultado.put("tipoFactura", valor));
        extraerVersionDocumento(textoProcesado).ifPresent(valor -> resultado.put("versionDocumento", valor));
        extraerDatoPorEtiquetas(textoProcesado, List.of("vendedor", "proveedor", "emitida por")).ifPresent(valor -> resultado.put("vendedorNombre", valor));
        extraerDatoPorEtiquetas(textoProcesado, List.of("comprador", "cliente", "destinatario")).ifPresent(valor -> resultado.put("compradorNombre", valor));
        extraerDatoPorEtiquetas(textoProcesado, List.of("categoria", "categoría")).ifPresent(valor -> resultado.put("categoria", valor));
        extraerDatoPorEtiquetas(textoProcesado, List.of("descripcion", "descripción", "concepto")).ifPresent(valor -> resultado.put("descripcion", valor));

        extraerDatoPorEtiquetas(textoProcesado, List.of("cuit vendedor", "cuit del vendedor", "cuit proveedor")).ifPresent(valor -> resultado.put("vendedorCuit", valor));
        extraerDatoPorEtiquetas(textoProcesado, List.of("cuit comprador", "cuit del comprador", "cuit cliente")).ifPresent(valor -> resultado.put("compradorCuit", valor));
        extraerDatoPorEtiquetas(textoProcesado, List.of("condicion iva vendedor", "condición iva vendedor")).ifPresent(valor -> resultado.put("vendedorCondicionIVA", valor));
        extraerDatoPorEtiquetas(textoProcesado, List.of("condicion iva comprador", "condición iva comprador")).ifPresent(valor -> resultado.put("compradorCondicionIVA", valor));
        extraerDatoPorEtiquetas(textoProcesado, List.of("domicilio vendedor")).ifPresent(valor -> resultado.put("vendedorDomicilio", valor));
        extraerDatoPorEtiquetas(textoProcesado, List.of("domicilio comprador")).ifPresent(valor -> resultado.put("compradorDomicilio", valor));

        return resultado;
    }

    public List<String> buildWarnings(Map<String, String> camposDetectados, Collection<String> camposEsperados) {
        if (camposEsperados == null) {
            return List.of();
        }

        return camposEsperados.stream()
                .filter(campo -> !camposDetectados.containsKey(campo))
                .map(campo -> "No se detectó el campo \"" + campo + "\" en el audio.")
                .collect(Collectors.toList());
    }

    private Optional<String> extraerMonto(String texto) {
        texto = prepararTexto(texto);
        Matcher matcher = MONTO_PATTERN.matcher(texto);
        if (matcher.find()) {
            String monto = matcher.group(1);
            if (monto == null) {
                return Optional.empty();
            }
            String normalizado = monto.replace(".", "").replace(" ", "").replace(",", ".");
            return Optional.of(normalizado);
        }
        String[] secciones = texto.split("[\\.;\\n]");
        for (String seccion : secciones) {
            String normalizada = normalizar(seccion);
            boolean contieneClave = PALABRAS_CLAVE_MONTO.stream()
                    .anyMatch(normalizada::contains);
            if (contieneClave) {
                Matcher numeroMatcher = NUMERO_SIMPLE_PATTERN.matcher(seccion);
                if (numeroMatcher.find()) {
                    String monto = numeroMatcher.group(1);
                    if (monto != null && !monto.isBlank()) {
                        String normalizado = monto.replace(".", "").replace(" ", "").replace(",", ".");
                        return Optional.of(normalizado);
                    }
                }
            }
        }
        return Optional.empty();
    }

    private Optional<String> extraerMoneda(String texto) {
        String normalizado = normalizar(texto);
        if (normalizado.contains("usd") || normalizado.contains("dolar") || normalizado.contains("dolares")) {
            return Optional.of("USD");
        }
        if (normalizado.contains("ars") || normalizado.contains("peso") || normalizado.contains("pesos")) {
            return Optional.of("ARS");
        }
        return Optional.empty();
    }

    private Optional<String> extraerFecha(String texto) {
        texto = prepararTexto(texto);
        Matcher matcherNumerico = FECHA_NUMERICA_PATTERN.matcher(texto);
        if (matcherNumerico.find()) {
            int dia = Integer.parseInt(matcherNumerico.group(1));
            int mes = Integer.parseInt(matcherNumerico.group(2));
            int anio = Integer.parseInt(ajustarAnio(matcherNumerico.group(3)));
            return construirFecha(anio, mes, dia);
        }

        Matcher matcherLetras = FECHA_LETRAS_PATTERN.matcher(texto.toLowerCase(Locale.ROOT));
        if (matcherLetras.find()) {
            int dia = Integer.parseInt(matcherLetras.group(1));
            String mesTexto = matcherLetras.group(2);
            int anio = Integer.parseInt(matcherLetras.group(3));
            Integer mes = MESES.get(mesTexto);
            if (mes != null) {
                return construirFecha(anio, mes, dia);
            }
        }
        return Optional.empty();
    }

    private Optional<String> construirFecha(int anio, int mes, int dia) {
        try {
            LocalDate fecha = LocalDate.of(anio, mes, dia);
            return Optional.of(fecha.format(DateTimeFormatter.ISO_LOCAL_DATE));
        } catch (DateTimeParseException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private Optional<String> extraerNumeroDocumento(String texto) {
        texto = prepararTexto(texto);
        Matcher matcher = NUMERO_DOCUMENTO_PATTERN.matcher(texto);
        if (matcher.find()) {
            return Optional.of(matcher.group(1).replace(" ", ""));
        }
        return Optional.empty();
    }

    private Optional<String> extraerTipoFactura(String texto) {
        texto = prepararTexto(texto);
        Matcher matcher = TIPO_FACTURA_PATTERN.matcher(texto);
        if (matcher.find()) {
            return Optional.of(matcher.group(1).toUpperCase(Locale.ROOT));
        }
        return Optional.empty();
    }

    private Optional<String> extraerVersionDocumento(String texto) {
        texto = prepararTexto(texto);
        Matcher matcher = VERSION_DOCUMENTO_PATTERN.matcher(texto);
        if (matcher.find()) {
            String valor = matcher.group(1);
            if (valor != null) {
                String capitalizado = valor.substring(0, 1).toUpperCase(Locale.ROOT) + valor.substring(1).toLowerCase(Locale.ROOT);
                return Optional.of(capitalizado);
            }
        }
        return Optional.empty();
    }

    private Optional<String> extraerMedioPago(String texto) {
        return extraerDatoPorEtiquetas(texto, List.of("medio de pago", "pago con", "pagamos con", "cobramos con"));
    }

    private Optional<String> extraerCategoria(String texto) {
        return extraerDatoPorEtiquetas(texto, List.of("categoria", "categoría"));
    }

    private Optional<String> extraerDescripcion(String texto) {
        return extraerDatoPorEtiquetas(texto, List.of("descripcion", "descripción", "concepto", "detalle"));
    }

    private Optional<String> extraerDatoPorEtiquetas(String texto, List<String> etiquetas) {
        if (texto == null || texto.isBlank()) {
            return Optional.empty();
        }
        String textoPreparado = prepararTexto(texto);
        String[] secciones = textoPreparado.split("[\\.;\\n]");
        for (String seccion : secciones) {
            String seccionNormalizada = normalizar(seccion);
            for (String etiqueta : etiquetas) {
                String etiquetaNormalizada = normalizar(etiqueta);
                if (!etiquetaNormalizada.isEmpty() && seccionNormalizada.contains(etiquetaNormalizada)) {
                    String limpio = limpiarDato(seccion, etiqueta);
                    if (!limpio.isBlank()) {
                        return Optional.of(limpio);
                    }
                }
            }
        }
        return Optional.empty();
    }

    private String limpiarDato(String seccionOriginal, String etiqueta) {
        seccionOriginal = prepararTexto(seccionOriginal);
        String regex = "(?i)" + Pattern.quote(etiqueta) + "\\s*(?:es|de|del|la|el|los|las|:|=)?\\s*";
        String valor = seccionOriginal.replaceAll(regex, "");
        valor = valor.replaceAll("(?i)con\\s+", "");
        valor = valor.replaceAll("(?i)el\\s+", "");
        valor = valor.replaceAll("(?i)la\\s+", "");
        valor = valor.replaceAll("(?i)un\\s+", "");
        valor = valor.replaceAll("(?i)una\\s+", "");
        valor = valor.replaceAll("(?i)de\\s+", "");
        valor = valor.replaceAll("(?i)para\\s+", "");
        valor = valor.replaceAll("[:=]", "");
        valor = prepararTexto(valor);
        valor = truncarPorSiguienteEtiqueta(valor);
        if (valor.length() > 80) {
            valor = valor.substring(0, 80).trim();
        }
        return valor;
    }

    private String truncarPorSiguienteEtiqueta(String texto) {
        if (texto == null || texto.isBlank()) {
            return texto;
        }
        Matcher matcher = ETIQUETAS_CORTE_PATTERN.matcher(texto);
        if (matcher.find()) {
            int inicio = matcher.start();
            if (inicio > 0) {
                String recortado = texto.substring(0, inicio).trim();
                if (!recortado.isBlank()) {
                    return recortado;
                }
            }
        }
        return texto;
    }

    private String normalizar(String texto) {
        String limpio = prepararTexto(texto);
        String lower = limpio.toLowerCase(Locale.ROOT);
        String sinTildes = Normalizer.normalize(lower, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        sinTildes = sinTildes.replaceAll("[^a-z0-9\\s]", " ");
        return sinTildes.replaceAll("\\s+", " ").trim();
    }

    private String ajustarAnio(String valor) {
        if (valor.length() == 2) {
            int anio = Integer.parseInt(valor);
            return String.valueOf(anio >= 70 ? 1900 + anio : 2000 + anio);
        }
        return valor;
    }

    private String prepararTexto(String texto) {
        if (texto == null) {
            return "";
        }
        String reemplazado = texto.replace('\u00A0', ' ');
        return reemplazado.replaceAll("\\s+", " ").trim();
    }
}

