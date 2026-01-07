package registro.cargarDatos.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        
        // Configurar los nombres de caché que usaremos
        cacheManager.setCacheNames(java.util.Arrays.asList(
            "movimientosPresupuesto"
        ));
        
        // Permitir crear cachés dinámicamente si es necesario
        cacheManager.setAllowNullValues(false);
        
        return cacheManager;
    }
}
