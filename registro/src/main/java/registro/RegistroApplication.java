package registro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"registro", "registro.config"})
public class RegistroApplication {

    public static void main(String[] args) {
        SpringApplication.run(RegistroApplication.class, args);
    }
}