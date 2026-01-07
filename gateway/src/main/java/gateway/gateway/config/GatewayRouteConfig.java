package gateway.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;

@Configuration
public class GatewayRouteConfig {

    @Value("${mycfo.services.administracion.url}")
    private String administracionUrl;

    @Value("${mycfo.services.registro.url}")
    private String registroUrl;

    @Value("${mycfo.services.reporte.url}")
    private String reporteUrl;

    @Value("${mycfo.services.pronostico.url}")
    private String pronosticoUrl;

    @Value("${mycfo.services.ia.url}")
    private String iaUrl;

    @Value("${mycfo.services.notificacion.url}")
    private String notificacionUrl;

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()

                // ============================
                //    Administración
                // ============================
                .route("administracion-route", r -> r
                        .path("/administracion/**")
                        .filters(f -> f
                                .stripPrefix(1)
                                .dedupeResponseHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "RETAIN_FIRST"))
                        .uri(administracionUrl))

                // ============================
                //    Registro
                // ============================
                .route("registro-route", r -> r
                        .path("/registro/**")
                        .filters(f -> f
                                .stripPrefix(1)
                                .dedupeResponseHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "RETAIN_FIRST"))
                        .uri(registroUrl))

                // ============================
                //    Reporte
                // ============================
                .route("reporte-route", r -> r
                        .path("/reporte/**")
                        .filters(f -> f
                                .stripPrefix(1)
                                .dedupeResponseHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "RETAIN_FIRST"))
                        .uri(reporteUrl))

                // ============================
                //    Pronóstico
                // ============================
                .route("pronostico-route", r -> r
                        .path("/pronostico/**")
                        .filters(f -> f
                                .stripPrefix(1)
                                .dedupeResponseHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "RETAIN_FIRST"))
                        .uri(pronosticoUrl))

                // ============================
                //    IA
                // ============================
                .route("ia-route", r -> r
                        .path("/ia/**")
                        .filters(f -> f
                                .stripPrefix(1)
                                .dedupeResponseHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "RETAIN_FIRST"))
                        .uri(iaUrl))

                // ============================
                //    NOTIFICACIONES
                // ============================
                .route("notificacion-route", r -> r
                        .path("/notificacion/**")
                        .filters(f -> f
                                .stripPrefix(1)
                                .dedupeResponseHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "RETAIN_FIRST"))
                        .uri(notificacionUrl))

                .build();
    }
}
