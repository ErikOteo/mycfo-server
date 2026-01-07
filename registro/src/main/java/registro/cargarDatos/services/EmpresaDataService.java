package registro.cargarDatos.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import registro.cargarDatos.models.Movimiento;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmpresaDataService {

    private final RestTemplate restTemplate;
    
    @Value("${mycfo.administracion.url}")
    private String administracionUrl;

    /**
     * Carga automáticamente los datos de la empresa del usuario en la factura
     * según la versión del documento (Original o Duplicado)
     */
    public void cargarDatosEmpresaEnFactura(registro.cargarDatos.models.Factura factura, String usuarioSub) {
        try {
            // Obtener datos del usuario y su empresa
            Map<String, Object> datosUsuario = obtenerDatosUsuario(usuarioSub);
            
            if (datosUsuario == null) {
                return; // No se pudieron obtener los datos
            }

            // Obtener datos de la empresa
            Object empresaIdObj = datosUsuario.get("empresaId");
            Long empresaId = null;
            if (empresaIdObj instanceof Integer) {
                empresaId = ((Integer) empresaIdObj).longValue();
            } else if (empresaIdObj instanceof Long) {
                empresaId = (Long) empresaIdObj;
            }
            
            String empresaNombre = (String) datosUsuario.get("empresaNombre");
            String empresaCuit = (String) datosUsuario.get("empresaCuit");
            String empresaCondicionIVA = (String) datosUsuario.get("empresaCondicionIVA");
            String empresaDomicilio = (String) datosUsuario.get("empresaDomicilio");

            if (empresaId == null) {
                return; // El usuario no tiene empresa asignada
            }

            // Cargar datos según la versión del documento
            String version = factura.getVersionDocumento() != null ? factura.getVersionDocumento().toString() : null;
            if ("Original".equals(version)) {
                // Para Original: empresa va en comprador
                cargarDatosComprador(factura, empresaNombre, empresaCuit, empresaCondicionIVA, empresaDomicilio);
            } else if ("Duplicado".equals(version)) {
                // Para Duplicado: empresa va en vendedor
                cargarDatosVendedor(factura, empresaNombre, empresaCuit, empresaCondicionIVA, empresaDomicilio);
            }

            // Establecer organización ID
            factura.setOrganizacionId(empresaId);

        } catch (Exception e) {
            // Log error pero no fallar la operación
            System.err.println("Error cargando datos de empresa en factura: " + e.getMessage());
        }
    }

    /**
     * Carga automáticamente los datos de la empresa del usuario en el movimiento
     * Completa los campos de origen o destino que estén vacíos con los datos de la organización
     */
    public void cargarDatosEmpresaEnMovimiento(Movimiento movimiento, String usuarioSub) {
        System.out.println("=== CARGANDO DATOS DE EMPRESA ===");
        System.out.println("Usuario Sub: " + usuarioSub);
        System.out.println("Tipo Movimiento: " + movimiento.getTipo());
        
        try {
            // Obtener datos del usuario y su empresa
            Map<String, Object> datosUsuario = obtenerDatosUsuario(usuarioSub);
            
            if (datosUsuario == null) {
                System.out.println("ERROR: No se pudieron obtener los datos del usuario");
                return; // No se pudieron obtener los datos
            }

            System.out.println("Datos del usuario obtenidos: " + datosUsuario);

            // Obtener datos de la empresa
            Object empresaIdObj = datosUsuario.get("empresaId");
            Long empresaId = null;
            if (empresaIdObj instanceof Integer) {
                empresaId = ((Integer) empresaIdObj).longValue();
            } else if (empresaIdObj instanceof Long) {
                empresaId = (Long) empresaIdObj;
            }
            
            String empresaNombre = (String) datosUsuario.get("empresaNombre");
            String empresaCuit = (String) datosUsuario.get("empresaCuit");

            System.out.println("Empresa ID: " + empresaId);
            System.out.println("Empresa Nombre: " + empresaNombre);
            System.out.println("Empresa CUIT: " + empresaCuit);

            if (empresaId == null) {
                System.out.println("ERROR: El usuario no tiene empresa asignada");
                return; // El usuario no tiene empresa asignada
            }

            // Establecer organización ID siempre
            movimiento.setOrganizacionId(empresaId);
            System.out.println("Organización ID establecido: " + empresaId);

            // Completar campos vacíos según el tipo de movimiento
            switch (movimiento.getTipo()) {
                case Ingreso:
                    // Para ingreso: completar destino si está vacío (nosotros recibimos)
                    System.out.println("Completando destino para INGRESO");
                    completarDestinoSiVacio(movimiento, empresaNombre, empresaCuit);
                    break;
                    
                case Egreso:
                    // Para egreso: completar origen si está vacío (nosotros pagamos)
                    System.out.println("Completando origen para EGRESO");
                    completarOrigenSiVacio(movimiento, empresaNombre, empresaCuit);
                    break;
                    
                case Deuda:
                    // Para deuda: completar origen si está vacío (nosotros debemos)
                    System.out.println("Completando origen para DEUDA");
                    completarOrigenSiVacio(movimiento, empresaNombre, empresaCuit);
                    break;
                    
                case Acreencia:
                    // Para acreencia: completar destino si está vacío (nosotros cobramos)
                    System.out.println("Completando destino para ACREENCIA");
                    completarDestinoSiVacio(movimiento, empresaNombre, empresaCuit);
                    break;
            }

            System.out.println("=== FIN CARGA DATOS EMPRESA ===");

        } catch (Exception e) {
            // Log error pero no fallar la operación
            System.err.println("ERROR cargando datos de empresa: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Obtiene los datos del usuario desde el módulo de administración
     */
    private Map<String, Object> obtenerDatosUsuario(String usuarioSub) {
        System.out.println("=== OBTENIENDO DATOS USUARIO ===");
        System.out.println("URL Administración: " + administracionUrl);
        System.out.println("Usuario Sub: " + usuarioSub);
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Usuario-Sub", usuarioSub);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            String url = administracionUrl + "/api/usuarios/perfil";
            System.out.println("URL completa: " + url);
            
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                (Class<Map<String, Object>>) (Class<?>) Map.class
            );
            
            System.out.println("Status Code: " + response.getStatusCode());
            System.out.println("Response Body: " + response.getBody());
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                System.out.println("=== DATOS OBTENIDOS EXITOSAMENTE ===");
                return response.getBody();
            } else {
                System.out.println("ERROR: Respuesta no exitosa o body nulo");
            }
            
        } catch (Exception e) {
            System.err.println("ERROR obteniendo datos del usuario: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("=== FIN OBTENER DATOS USUARIO ===");
        return null;
    }

    /**
     * Completa los campos de origen con datos de la empresa si están vacíos
     */
    private void completarOrigenSiVacio(Movimiento movimiento, String empresaNombre, String empresaCuit) {
        System.out.println("--- COMPLETANDO ORIGEN ---");
        System.out.println("Origen Nombre actual: '" + movimiento.getOrigenNombre() + "'");
        System.out.println("Origen CUIT actual: '" + movimiento.getOrigenCuit() + "'");
        
        if (movimiento.getOrigenNombre() == null || movimiento.getOrigenNombre().trim().isEmpty()) {
            movimiento.setOrigenNombre(empresaNombre);
            System.out.println("Origen Nombre completado con: " + empresaNombre);
        } else {
            System.out.println("Origen Nombre ya tiene valor, no se modifica");
        }
        
        if (movimiento.getOrigenCuit() == null || movimiento.getOrigenCuit().trim().isEmpty()) {
            movimiento.setOrigenCuit(empresaCuit);
            System.out.println("Origen CUIT completado con: " + empresaCuit);
        } else {
            System.out.println("Origen CUIT ya tiene valor, no se modifica");
        }
        
        System.out.println("--- FIN COMPLETAR ORIGEN ---");
    }

    /**
     * Completa los campos de destino con datos de la empresa si están vacíos
     */
    private void completarDestinoSiVacio(Movimiento movimiento, String empresaNombre, String empresaCuit) {
        System.out.println("--- COMPLETANDO DESTINO ---");
        System.out.println("Destino Nombre actual: '" + movimiento.getDestinoNombre() + "'");
        System.out.println("Destino CUIT actual: '" + movimiento.getDestinoCuit() + "'");
        
        if (movimiento.getDestinoNombre() == null || movimiento.getDestinoNombre().trim().isEmpty()) {
            movimiento.setDestinoNombre(empresaNombre);
            System.out.println("Destino Nombre completado con: " + empresaNombre);
        } else {
            System.out.println("Destino Nombre ya tiene valor, no se modifica");
        }
        
        if (movimiento.getDestinoCuit() == null || movimiento.getDestinoCuit().trim().isEmpty()) {
            movimiento.setDestinoCuit(empresaCuit);
            System.out.println("Destino CUIT completado con: " + empresaCuit);
        } else {
            System.out.println("Destino CUIT ya tiene valor, no se modifica");
        }
        
        System.out.println("--- FIN COMPLETAR DESTINO ---");
    }

    /**
     * Carga los datos de la empresa en los campos del comprador
     */
    private void cargarDatosComprador(registro.cargarDatos.models.Factura factura, String empresaNombre, String empresaCuit, String empresaCondicionIVA, String empresaDomicilio) {
        if (factura.getCompradorNombre() == null || factura.getCompradorNombre().isEmpty()) {
            factura.setCompradorNombre(empresaNombre);
        }
        if (factura.getCompradorCuit() == null || factura.getCompradorCuit().isEmpty()) {
            factura.setCompradorCuit(empresaCuit);
        }
        if (factura.getCompradorCondicionIVA() == null || factura.getCompradorCondicionIVA().isEmpty()) {
            factura.setCompradorCondicionIVA(empresaCondicionIVA);
        }
        if (factura.getCompradorDomicilio() == null || factura.getCompradorDomicilio().isEmpty()) {
            factura.setCompradorDomicilio(empresaDomicilio);
        }
    }

    /**
     * Carga los datos de la empresa en los campos del vendedor
     */
    private void cargarDatosVendedor(registro.cargarDatos.models.Factura factura, String empresaNombre, String empresaCuit, String empresaCondicionIVA, String empresaDomicilio) {
        if (factura.getVendedorNombre() == null || factura.getVendedorNombre().isEmpty()) {
            factura.setVendedorNombre(empresaNombre);
        }
        if (factura.getVendedorCuit() == null || factura.getVendedorCuit().isEmpty()) {
            factura.setVendedorCuit(empresaCuit);
        }
        if (factura.getVendedorCondicionIVA() == null || factura.getVendedorCondicionIVA().isEmpty()) {
            factura.setVendedorCondicionIVA(empresaCondicionIVA);
        }
        if (factura.getVendedorDomicilio() == null || factura.getVendedorDomicilio().isEmpty()) {
            factura.setVendedorDomicilio(empresaDomicilio);
        }
    }
}
