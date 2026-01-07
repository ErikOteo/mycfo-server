package notificacion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"notificacion", "notificacion.config", "notificacion.controllers", "notificacion.services"})
public class NotificacionApplication {

	public static void main(String[] args) {
		SpringApplication.run(NotificacionApplication.class, args);
	}

}
