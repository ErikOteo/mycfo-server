package registro.movimientosexcel.services;

import org.springframework.stereotype.Service;
import registro.cargarDatos.models.TipoMovimiento;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Servicio inteligente de sugerencia de categorías para movimientos bancarios.
 * Utiliza múltiples estrategias de clasificación con sistema de prioridades.
 */
@Service
public class CategorySuggestionService {
    
    // Categorías para EGRESOS
    public static final String CAT_ALIMENTOS = "Alimentos y Bebidas";
    public static final String CAT_TRANSPORTE = "Transporte";
    public static final String CAT_VIVIENDA = "Vivienda";
    public static final String CAT_SERVICIOS_BASICOS = "Servicios Básicos";
    public static final String CAT_OCIO = "Ocio y Entretenimiento";
    public static final String CAT_COMPRAS_PERSONALES = "Compras Personales";
    public static final String CAT_SALUD = "Salud";
    public static final String CAT_EDUCACION = "Educación";
    public static final String CAT_IMPUESTOS = "Impuestos y Tasas";
    public static final String CAT_SERVICIOS_FINANCIEROS = "Servicios Financieros";
    public static final String CAT_COMPRAS_NEGOCIO = "Compras de Negocio";
    public static final String CAT_OTROS_EGRESOS = "Otros Egresos";
    
    // Categorías para INGRESOS
    public static final String CAT_VENTAS_PRODUCTOS = "Ventas de Productos";
    public static final String CAT_PRESTACION_SERVICIOS = "Prestación de Servicios";
    public static final String CAT_COBRANZAS = "Cobranzas";
    public static final String CAT_TRANSFERENCIAS_RECIBIDAS = "Transferencias Recibidas";
    public static final String CAT_INVERSIONES = "Inversiones y Rendimientos";
    public static final String CAT_OTROS_INGRESOS = "Otros Ingresos";
    
    // Mapas de patrones organizados por categoría
    private final Map<String, List<PatronCategoria>> patronesEgresos = new HashMap<>();
    private final Map<String, List<PatronCategoria>> patronesIngresos = new HashMap<>();
    
    public CategorySuggestionService() {
        inicializarPatronesEgresos();
        inicializarPatronesIngresos();
    }
    
    /**
     * Sugiere una categoría basándose en la descripción y el tipo de registro
     */
    public String sugerirCategoria(String descripcion, TipoMovimiento tipo) {
        if (descripcion == null || descripcion.trim().isEmpty()) {
            return tipo == TipoMovimiento.Egreso ? CAT_OTROS_EGRESOS : CAT_OTROS_INGRESOS;
        }
        
        String descripcionLower = descripcion.toLowerCase().trim();
        
        // Elegir el mapa de patrones según el tipo
        Map<String, List<PatronCategoria>> patrones = 
            tipo == TipoMovimiento.Egreso ? patronesEgresos : patronesIngresos;
        
        // Buscar coincidencias con prioridad
        List<CoincidenciaCategoria> coincidencias = new ArrayList<>();
        
        for (Map.Entry<String, List<PatronCategoria>> entry : patrones.entrySet()) {
            String categoria = entry.getKey();
            List<PatronCategoria> listaPatrones = entry.getValue();
            
            for (PatronCategoria patron : listaPatrones) {
                if (patron.coincide(descripcionLower)) {
                    coincidencias.add(new CoincidenciaCategoria(categoria, patron.prioridad));
                    break; // Solo una coincidencia por categoría
                }
            }
        }
        
        // Si hay coincidencias, devolver la de mayor prioridad
        if (!coincidencias.isEmpty()) {
            coincidencias.sort(Comparator.comparingInt(c -> -c.prioridad)); // Orden descendente
            return coincidencias.get(0).categoria;
        }
        
        // Categoría por defecto
        return tipo == TipoMovimiento.Egreso ? CAT_OTROS_EGRESOS : CAT_OTROS_INGRESOS;
    }
    
    /**
     * Sobrecarga para compatibilidad con código existente (asume Egreso por defecto)
     */
    public String sugerirCategoria(String descripcion) {
        return sugerirCategoria(descripcion, TipoMovimiento.Egreso);
    }
    
    /**
     * Obtiene todas las categorías disponibles según el tipo de registro
     */
    public List<String> obtenerCategorias(TipoMovimiento tipo) {
        if (tipo == TipoMovimiento.Egreso) {
            return List.of(
                CAT_ALIMENTOS, CAT_TRANSPORTE, CAT_VIVIENDA, CAT_SERVICIOS_BASICOS,
                CAT_OCIO, CAT_COMPRAS_PERSONALES, CAT_SALUD, CAT_EDUCACION,
                CAT_IMPUESTOS, CAT_SERVICIOS_FINANCIEROS, CAT_COMPRAS_NEGOCIO,
                CAT_OTROS_EGRESOS
            );
        } else {
            return List.of(
                CAT_VENTAS_PRODUCTOS, CAT_PRESTACION_SERVICIOS, CAT_COBRANZAS,
                CAT_TRANSFERENCIAS_RECIBIDAS, CAT_INVERSIONES, CAT_OTROS_INGRESOS
            );
        }
    }
    
    /**
     * Obtiene todas las categorías (para autocomplete genérico)
     */
    public List<String> obtenerTodasLasCategorias() {
        List<String> todas = new ArrayList<>();
        todas.addAll(obtenerCategorias(TipoMovimiento.Egreso));
        todas.addAll(obtenerCategorias(TipoMovimiento.Ingreso));
        return todas;
    }
    
    private void inicializarPatronesEgresos() {
        // ALIMENTOS Y BEBIDAS (Prioridad 10 = muy específico, 5 = genérico)
        patronesEgresos.put(CAT_ALIMENTOS, List.of(
            new PatronCategoria(List.of("mcdonald", "burger king", "subway", "kfc"), 10),
            new PatronCategoria(List.of("pedidos ya", "rappi", "uber eats", "delivery"), 10),
            new PatronCategoria(List.of("restaurant", "bar", "cafe", "cafeteria", "parrilla"), 9),
            new PatronCategoria(List.of("supermercado", "carrefour", "disco", "coto", "dia"), 9),
            new PatronCategoria(List.of("farmacity", "jumbo", "mercado", "verduleria"), 8),
            new PatronCategoria(List.of("pizza", "empanadas", "sushi", "comida"), 7),
            new PatronCategoria(List.of("alimento", "bebida", "almacen"), 6)
        ));
        
        // TRANSPORTE (Muy importante distinguir Uber/SUBE)
        patronesEgresos.put(CAT_TRANSPORTE, List.of(
            new PatronCategoria(List.of("uber", "cabify", "didi", "beat"), 10),
            new PatronCategoria(List.of("sube", "recarga sube", "transporte publico", "colectivo", "subte"), 10),
            new PatronCategoria(List.of("ypf", "shell", "axion", "puma", "combustible", "nafta", "gasoil"), 10),
            new PatronCategoria(List.of("peaje", "autopista", "estacionamiento", "parking", "cochera"), 9),
            new PatronCategoria(List.of("taxi", "remis", "viaje", "transporte"), 8),
            new PatronCategoria(List.of("gomeria", "mecanico", "taller", "service auto"), 7),
            new PatronCategoria(List.of("seguro auto", "patente", "vtv"), 7)
        ));
        
        // VIVIENDA
        patronesEgresos.put(CAT_VIVIENDA, List.of(
            new PatronCategoria(List.of("alquiler", "renta", "inmueble"), 10),
            new PatronCategoria(List.of("expensas", "consorcio"), 10),
            new PatronCategoria(List.of("pintura", "plomero", "electricista", "gasista", "reparacion"), 8),
            new PatronCategoria(List.of("ferreteria", "easy", "sodimac"), 7),
            new PatronCategoria(List.of("muebles", "deco", "hogar"), 6)
        ));
        
        // SERVICIOS BÁSICOS
        patronesEgresos.put(CAT_SERVICIOS_BASICOS, List.of(
            new PatronCategoria(List.of("edesur", "edenor", "luz", "electricidad"), 10),
            new PatronCategoria(List.of("metrogas", "gas natural", "camuzzi", "gas"), 10),
            new PatronCategoria(List.of("aysa", "absa", "agua corriente", "aguas"), 10),
            new PatronCategoria(List.of("telecom", "fibertel", "movistar", "claro", "personal", "internet"), 9),
            new PatronCategoria(List.of("telefono", "celular", "mobile", "recarga celular", "prepago"), 8),
            new PatronCategoria(List.of("cable", "directv", "flow"), 7)
        ));
        
        // OCIO Y ENTRETENIMIENTO
        patronesEgresos.put(CAT_OCIO, List.of(
            new PatronCategoria(List.of("netflix", "spotify", "disney+", "hbo", "amazon prime", "youtube premium"), 10),
            new PatronCategoria(List.of("steam", "playstation", "xbox", "nintendo", "epic games"), 10),
            new PatronCategoria(List.of("cine", "teatro", "show", "concierto", "recital"), 9),
            new PatronCategoria(List.of("gimnasio", "gym", "deporte", "club"), 8),
            new PatronCategoria(List.of("viaje", "turismo", "hotel", "airbnb", "booking"), 8),
            new PatronCategoria(List.of("entretenimiento", "ocio", "diversion", "salida"), 6)
        ));
        
        // COMPRAS PERSONALES
        patronesEgresos.put(CAT_COMPRAS_PERSONALES, List.of(
            new PatronCategoria(List.of("zara", "h&m", "nike", "adidas", "ropa"), 9),
            new PatronCategoria(List.of("mercado libre", "amazon", "compra online"), 8),
            new PatronCategoria(List.of("perfumeria", "cosmetica", "maquillaje"), 8),
            new PatronCategoria(List.of("libreria", "papeleria"), 7),
            new PatronCategoria(List.of("electronica", "tecnologia", "celular", "notebook"), 7),
            new PatronCategoria(List.of("zapateria", "accesorios"), 6)
        ));
        
        // SALUD
        patronesEgresos.put(CAT_SALUD, List.of(
            new PatronCategoria(List.of("farmacia", "medicamento", "droga"), 10),
            new PatronCategoria(List.of("osde", "swiss medical", "galeno", "medife", "prepaga"), 10),
            new PatronCategoria(List.of("medico", "doctor", "clinica", "hospital", "consultorio"), 9),
            new PatronCategoria(List.of("odontologo", "dentista", "ortodoncia"), 9),
            new PatronCategoria(List.of("laboratorio", "analisis", "estudio"), 8),
            new PatronCategoria(List.of("kinesiologia", "terapia", "tratamiento"), 7)
        ));
        
        // EDUCACIÓN
        patronesEgresos.put(CAT_EDUCACION, List.of(
            new PatronCategoria(List.of("colegio", "escuela", "universidad", "instituto"), 10),
            new PatronCategoria(List.of("curso", "capacitacion", "seminario", "taller"), 9),
            new PatronCategoria(List.of("udemy", "coursera", "platzi", "educacion online"), 9),
            new PatronCategoria(List.of("libro", "texto", "manual", "material educativo"), 7),
            new PatronCategoria(List.of("cuota", "matricula", "inscripcion"), 7)
        ));
        
        // IMPUESTOS Y TASAS
        patronesEgresos.put(CAT_IMPUESTOS, List.of(
            new PatronCategoria(List.of("afip", "iva", "ganancias", "ingresos brutos", "monotributo"), 10),
            new PatronCategoria(List.of("abl", "arba", "agip", "municipal", "municipal"), 10),
            new PatronCategoria(List.of("impuesto", "tasa", "contribucion"), 8),
            new PatronCategoria(List.of("patente", "automotor"), 7)
        ));
        
        // SERVICIOS FINANCIEROS
        patronesEgresos.put(CAT_SERVICIOS_FINANCIEROS, List.of(
            new PatronCategoria(List.of("comision", "banco", "bancaria", "mantenimiento cuenta", "fee mp", "comision mp", "ajuste mp", "bank transfer fee"), 10),
            new PatronCategoria(List.of("tarjeta credito", "resumen tarjeta", "visa", "mastercard"), 9),
            new PatronCategoria(List.of("prestamo", "cuota", "financiacion", "transfer out", "bank transfer"), 8),
            new PatronCategoria(List.of("seguro", "insurance"), 7)
        ));
        
        // COMPRAS DE NEGOCIO
        patronesEgresos.put(CAT_COMPRAS_NEGOCIO, List.of(
            new PatronCategoria(List.of("insumo", "materia prima", "stock", "mercaderia"), 9),
            new PatronCategoria(List.of("proveedor", "compra mayorista"), 8),
            new PatronCategoria(List.of("equipamiento", "maquinaria", "herramienta"), 8),
            new PatronCategoria(List.of("oficina", "papeleria comercial"), 7)
        ));
    }
    
    private void inicializarPatronesIngresos() {
        // VENTAS DE PRODUCTOS
        patronesIngresos.put(CAT_VENTAS_PRODUCTOS, List.of(
            new PatronCategoria(List.of("venta producto", "venta mercaderia", "venta articulo"), 10),
            new PatronCategoria(List.of("venta", "cobro venta"), 8),
            new PatronCategoria(List.of("producto vendido", "item vendido", "producto de"), 7)
        ));
        
        // PRESTACIÓN DE SERVICIOS
        patronesIngresos.put(CAT_PRESTACION_SERVICIOS, List.of(
            new PatronCategoria(List.of("prestacion servicio", "honorario", "consultor"), 10),
            new PatronCategoria(List.of("servicio profesional", "trabajo realizado"), 9),
            new PatronCategoria(List.of("facturacion servicio", "cobro servicio", "suscripcion", "abono"), 8)
        ));
        
        // COBRANZAS
        patronesIngresos.put(CAT_COBRANZAS, List.of(
            new PatronCategoria(List.of("cobranza", "cobro", "pago recibido"), 10),
            new PatronCategoria(List.of("factura cobrada", "recibo", "pago cliente"), 9),
            new PatronCategoria(List.of("transferencia cliente", "deposito cliente"), 8)
        ));
        
        // TRANSFERENCIAS RECIBIDAS
        patronesIngresos.put(CAT_TRANSFERENCIAS_RECIBIDAS, List.of(
            new PatronCategoria(List.of("transferencia recibida", "deposito", "acreditacion", "cbu", "alias", "bank transfer", "bank transfer in"), 10),
            new PatronCategoria(List.of("transferencia", "envio dinero", "payout", "mp", "mercado pago", "link de pago", "qr", "pos", "transfer in", "transferencia banco"), 8)
        ));
        
        // INVERSIONES
        patronesIngresos.put(CAT_INVERSIONES, List.of(
            new PatronCategoria(List.of("rendimiento", "interes", "dividendo", "renta"), 10),
            new PatronCategoria(List.of("inversion", "plazo fijo", "bono"), 9),
            new PatronCategoria(List.of("ganancia capital", "plus"), 8)
        ));
    }
    
    /**
     * Clase interna para representar un patrón de categorización
     */
    private static class PatronCategoria {
        private final int prioridad;
        private final Pattern pattern;
        
        public PatronCategoria(List<String> palabrasClave, int prioridad) {
            this.prioridad = prioridad;
            // Crear un patrón regex que busque cualquiera de las palabras clave
            String regex = palabrasClave.stream()
                .map(Pattern::quote)
                .collect(Collectors.joining("|"));
            this.pattern = Pattern.compile(regex, Pattern.CASE_INSENSITIVE);
        }
        
        public boolean coincide(String texto) {
            return pattern.matcher(texto).find();
        }
    }
    
    /**
     * Clase interna para almacenar coincidencias con prioridad
     */
    private static class CoincidenciaCategoria {
        private final String categoria;
        private final int prioridad;
        
        public CoincidenciaCategoria(String categoria, int prioridad) {
            this.categoria = categoria;
            this.prioridad = prioridad;
        }
    }
}
