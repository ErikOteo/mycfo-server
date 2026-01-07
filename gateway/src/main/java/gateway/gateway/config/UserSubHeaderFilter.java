package gateway.gateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Filtro global que extrae el 'sub' del token JWT y lo agrega como header X-Usuario-Sub
 * para los módulos backend. Si el header X-Usuario-Sub ya viene del frontend, lo mantiene.
 */
@Component
public class UserSubHeaderFilter implements GlobalFilter, Ordered {

    private static final String HEADER_X_USUARIO_SUB = "X-Usuario-Sub";
    private static final String HEADER_AUTHORIZATION = "Authorization";
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        HttpHeaders headers = request.getHeaders();
        
        // Si ya viene el header X-Usuario-Sub del frontend, no hacer nada
        String existingSub = headers.getFirst(HEADER_X_USUARIO_SUB);
        if (existingSub != null && !existingSub.trim().isEmpty()) {
            return chain.filter(exchange);
        }
        
        // Intentar extraer el 'sub' del token JWT
        String authHeader = headers.getFirst(HEADER_AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7); // Remover "Bearer "
                String sub = extractSubFromJwt(token);
                
                if (sub != null && !sub.isEmpty()) {
                    // Agregar el header X-Usuario-Sub a la petición modificada
                    ServerHttpRequest modifiedRequest = request.mutate()
                            .header(HEADER_X_USUARIO_SUB, sub)
                            .build();
                    
                    return chain.filter(exchange.mutate().request(modifiedRequest).build());
                }
            } catch (Exception e) {
                // Si hay error extrayendo el sub, continuar sin el header
                // Los módulos backend pueden manejar la ausencia del header
            }
        }
        
        return chain.filter(exchange);
    }

    /**
     * Extrae el 'sub' (subject) de un token JWT sin validar la firma.
     * Los JWT tienen el formato: header.payload.signature
     */
    private String extractSubFromJwt(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return null;
            }
            
            // Decodificar el payload (segunda parte)
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            
            // Parsear el JSON para obtener el 'sub'
            // Formato simple: {"sub":"valor","otro":"campo",...}
            int subIndex = payload.indexOf("\"sub\"");
            if (subIndex == -1) {
                return null;
            }
            
            // Buscar el valor después de "sub":
            int colonIndex = payload.indexOf(":", subIndex);
            if (colonIndex == -1) {
                return null;
            }
            
            // Buscar la comilla de inicio del valor
            int startQuote = payload.indexOf("\"", colonIndex);
            if (startQuote == -1) {
                return null;
            }
            
            // Buscar la comilla de fin del valor
            int endQuote = payload.indexOf("\"", startQuote + 1);
            if (endQuote == -1) {
                return null;
            }
            
            return payload.substring(startQuote + 1, endQuote);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public int getOrder() {
        // Ejecutar antes de otros filtros pero después del filtro de CORS
        // Orden bajo (número alto negativo) para ejecutarse temprano
        return -100;
    }
}

