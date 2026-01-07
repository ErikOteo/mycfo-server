# ===== BUILD =====
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY .. /app
RUN mvn -pl mycfo1 -am clean package -DskipTests

# ===== RUN =====
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/mycfo1/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
