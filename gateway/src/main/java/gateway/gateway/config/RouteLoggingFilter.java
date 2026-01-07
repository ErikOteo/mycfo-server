package gateway.gateway.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;

/**
 * Filtro para mostrar información de routing del gateway
 */
@Component
public class RouteLoggingFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(RouteLoggingFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Obtener la ruta seleccionada
        Route route = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
        if (route != null) {
            logger.info("🛣️ ROUTE SELECTED - ID: {} | URI: {} | Path: {} | Order: {}", 
                route.getId(),
                route.getUri(),
                route.getPredicate(),
                route.getOrder()
            );
        } else {
            logger.warn("⚠️ NO ROUTE SELECTED - Request will not be forwarded to any service");
        }

        // Obtener la URI final después del routing
        URI targetUri = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR);
        if (targetUri != null) {
            logger.info("🎯 TARGET URI - Final destination: {}", targetUri);
        }

        // Mostrar el request modificado antes de enviarlo al backend
        ServerHttpRequest modifiedRequest = exchange.getRequest();
        logger.info("📤 FORWARDING REQUEST - Method: {} | Path: {} | URI: {}", 
            modifiedRequest.getMethod(),
            modifiedRequest.getPath(),
            modifiedRequest.getURI()
        );

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        // Ejecutar después del LoggingFilter pero antes del routing
        return -500;
    }
}
