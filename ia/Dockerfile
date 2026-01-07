# Base de docker
FROM eclipse-temurin:24-jdk

# Crear directorio de la app
WORKDIR /app

# Copiar el .jar generado por Spring Boot
COPY target/ia-0.0.1-SNAPSHOT.jar app.jar


# Exponer el puerto
EXPOSE 8083

# Comando de arranque
ENTRYPOINT ["java", "-jar", "app.jar"]
