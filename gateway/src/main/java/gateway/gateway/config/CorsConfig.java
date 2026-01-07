package gateway.gateway.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

    @Bean
    @Primary
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsWebFilter corsWebFilter() {

        CorsConfiguration config = new CorsConfiguration();

        // Permitir orígenes específicos en lugar de wildcards
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "https://*.ngrok-free.app",
                "http://*.ngrok-free.app",
                "https://*.tunnelmole.net",
                "http://*.tunnelmole.net",
                "https://*.trycloudflare.com",
                "https://martin-fedorenko.github.io",
                "https://martin-fedorenko.github.io/#",
                "https://martin-fedorenko.github.io/mycfo/",
                "https://martin-fedorenko.github.io/mycfo/#"
        ));

        config.setAllowedMethods(Arrays.asList(
                HttpMethod.GET.name(),
                HttpMethod.POST.name(),
                HttpMethod.PUT.name(),
                HttpMethod.PATCH.name(),
                HttpMethod.DELETE.name(),
                HttpMethod.OPTIONS.name()
        ));

        config.addAllowedHeader("*");
        config.setAllowCredentials(true);

        config.setExposedHeaders(List.of(
                "Content-Type",
                "X-Usuario-Sub"
        ));

        // Configurar max age para preflight requests
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}
