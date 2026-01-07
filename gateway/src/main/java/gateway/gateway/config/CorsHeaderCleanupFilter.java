package gateway.gateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class CorsHeaderCleanupFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            HttpHeaders headers = exchange.getResponse().getHeaders();
            
            // Limpiar header duplicado de Access-Control-Allow-Credentials
            if (headers.containsKey("Access-Control-Allow-Credentials")) {
                // Obtener todos los valores
                var values = headers.get("Access-Control-Allow-Credentials");
                if (values != null && values.size() > 1) {
                    // Remover todos y agregar solo uno
                    headers.remove("Access-Control-Allow-Credentials");
                    headers.add("Access-Control-Allow-Credentials", "true");
                }
            }
            
            // Asegurar que Access-Control-Allow-Origin sea el origen del request
            String origin = exchange.getRequest().getHeaders().getFirst("Origin");
            if (origin != null && headers.containsKey("Access-Control-Allow-Origin")) {
                var originValues = headers.get("Access-Control-Allow-Origin");
                if (originValues != null && originValues.size() > 1) {
                    headers.remove("Access-Control-Allow-Origin");
                    headers.add("Access-Control-Allow-Origin", origin);
                }
            }
        }));
    }

    @Override
    public int getOrder() {
        // Ejecutar después de todos los demás filtros pero antes de enviar la respuesta
        return Ordered.LOWEST_PRECEDENCE;
    }
}
