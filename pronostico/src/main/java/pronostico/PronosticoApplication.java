package pronostico;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
// FORZAMOS A SPRING A BUSCAR EN EL PAQUETE CONFIG
@ComponentScan(basePackages = {"pronostico", "pronostico.config", "pronostico.controllers", "pronostico.services"})
public class PronosticoApplication {

	public static void main(String[] args) {
		SpringApplication.run(PronosticoApplication.class, args);
	}

}
