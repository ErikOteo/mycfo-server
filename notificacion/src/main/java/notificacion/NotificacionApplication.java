package notificacion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ComponentScan(basePackages = {"notificacion", "notificacion.config", "notificacion.controllers", "notificacion.services"})
@EnableScheduling
public class NotificacionApplication {

	public static void main(String[] args) {
		SpringApplication.run(NotificacionApplication.class, args);
	}

}
