package gateway.gateway.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Filtro global que muestra por consola todos los requests que entran y salen del gateway
 */
@Component
public class LoggingFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(LoggingFilter.class);
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String timestamp = LocalDateTime.now().format(formatter);
        
        // Log del request entrante
        logger.info("🔵 [{}] GATEWAY REQUEST - Method: {} | URI: {} | Path: {} | Remote Address: {} | User-Agent: {}", 
            timestamp,
            request.getMethod(),
            request.getURI(),
            request.getPath(),
            request.getRemoteAddress() != null ? request.getRemoteAddress().getAddress().getHostAddress() : "unknown",
            request.getHeaders().getFirst("User-Agent")
        );
        
        // Log headers importantes del request
        logger.info("🔵 [{}] REQUEST HEADERS - Authorization: {} | X-Usuario-Sub: {} | Content-Type: {} | Content-Length: {} | Host: {}", 
            timestamp,
            request.getHeaders().getFirst("Authorization") != null ? "***REDACTED***" : "none",
            request.getHeaders().getFirst("X-Usuario-Sub"),
            request.getHeaders().getFirst("Content-Type"),
            request.getHeaders().getContentLength(),
            request.getHeaders().getFirst("Host")
        );
        
        // Log de query parameters si existen
        if (!request.getQueryParams().isEmpty()) {
            logger.info("🔵 [{}] REQUEST QUERY PARAMS: {}", timestamp, request.getQueryParams());
        }
        
        long startTime = System.currentTimeMillis();
        
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            ServerHttpResponse response = exchange.getResponse();
            String responseTimestamp = LocalDateTime.now().format(formatter);
            long duration = System.currentTimeMillis() - startTime;
            
            // Log del response saliente
            logger.info("🟢 [{}] GATEWAY RESPONSE - Status: {} | URI: {} | Path: {} | Duration: {}ms | Content-Type: {} | Content-Length: {}", 
                responseTimestamp,
                response.getStatusCode(),
                request.getURI(),
                request.getPath(),
                duration,
                response.getHeaders().getFirst("Content-Type"),
                response.getHeaders().getContentLength()
            );
            
            // Log headers importantes del response
            logger.info("🟢 [{}] RESPONSE HEADERS - Location: {} | Cache-Control: {} | All Headers: {}", 
                responseTimestamp,
                response.getHeaders().getFirst("Location"),
                response.getHeaders().getFirst("Cache-Control"),
                response.getHeaders()
            );
            
            // Log específico de headers CORS
            logger.info("🌐 [{}] CORS HEADERS - Access-Control-Allow-Origin: {} | Access-Control-Allow-Credentials: {} | Access-Control-Allow-Methods: {}", 
                responseTimestamp,
                response.getHeaders().getFirst("Access-Control-Allow-Origin"),
                response.getHeaders().getFirst("Access-Control-Allow-Credentials"),
                response.getHeaders().getFirst("Access-Control-Allow-Methods")
            );
            
            // Advertencia si no hay contenido
            if (response.getHeaders().getFirst("Content-Type") == null || response.getHeaders().getContentLength() == 0) {
                logger.warn("⚠️ [{}] RESPONSE WITHOUT CONTENT - Possible routing issue or empty response from service", responseTimestamp);
            }
        }));
    }

    @Override
    public int getOrder() {
        // Ejecutar antes que otros filtros para capturar todos los requests
        // Orden muy bajo para ejecutarse primero
        return -1000;
    }
}
