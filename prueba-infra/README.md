# Proyecto MyCFO - Infraestructura AWS

Este proyecto contiene dos módulos Spring Boot (MyCFO1 y MyCFO2) diseñados para ser desplegados en AWS.

## Arquitectura

```
API Gateway → EC2 (MyCFO1) → EC2 (MyCFO2) → Lambda (Forecast)
```

### Flujo de Datos

1. **MyCFO1** expone endpoints a través de API Gateway
2. Cuando se llama al endpoint `/forecast`, MyCFO1 llama a MyCFO2
3. **MyCFO2** genera datos financieros y los envía a la Lambda de forecast
4. La Lambda procesa los datos y devuelve el resultado
5. MyCFO2 devuelve el resultado a MyCFO1
6. MyCFO1 devuelve la respuesta final al cliente

## Componentes

### MyCFO1
- **Puerto**: 8080
- **Endpoints**:
  - `GET /api/v1/forecast` - Llama a MyCFO2 para procesar forecast
  - `GET /api/v1/secret/test` - Muestra un secreto de AWS Secrets Manager
  - `GET /api/v1/environment/test` - Muestra una variable de entorno
  - `GET /actuator/health` - Health check

### MyCFO2
- **Puerto**: 8081
- **Endpoints**:
  - `GET /api/v1/forecast/process` - Genera datos y llama a Lambda
  - `GET /actuator/health` - Health check

## Requisitos Previos

1. **AWS CLI** configurado con credenciales apropiadas
2. **Terraform** >= 1.0 instalado
3. **Docker** instalado (para construir las imágenes)
4. **Maven** instalado (para compilar las aplicaciones)
5. **Java 17** instalado

## Despliegue

### 1. Compilar las Aplicaciones

```bash
# Compilar MyCFO1
cd mycfo1
mvn clean package -DskipTests

# Compilar MyCFO2
cd ../mycfo2
mvn clean package -DskipTests
```

### 2. Construir Imágenes Docker

```bash
# Construir imagen MyCFO1
cd mycfo1
docker build -t mycfo1:latest .

# Construir imagen MyCFO2
cd ../mycfo2
docker build -t mycfo2:latest .
```

### 3. Subir Imágenes a ECR (Opcional)

Si prefieres usar Amazon ECR para almacenar las imágenes:

```bash
# Autenticar Docker con ECR
aws ecr get-login-password --region sa-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.sa-east-1.amazonaws.com

# Crear repositorios
aws ecr create-repository --repository-name mycfo1 --region sa-east-1
aws ecr create-repository --repository-name mycfo2 --region sa-east-1

# Tag y push
docker tag mycfo1:latest <account-id>.dkr.ecr.sa-east-1.amazonaws.com/mycfo1:latest
docker tag mycfo2:latest <account-id>.dkr.ecr.sa-east-1.amazonaws.com/mycfo2:latest
docker push <account-id>.dkr.ecr.sa-east-1.amazonaws.com/mycfo1:latest
docker push <account-id>.dkr.ecr.sa-east-1.amazonaws.com/mycfo2:latest
```

### 4. Configurar Terraform

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edita `terraform.tfvars` con tus valores:

```hcl
aws_region           = "sa-east-1"
instance_type        = "t3.micro"
mycfo1_test_secret   = "TuSecretoDePrueba"
app_test_env_var     = "TuVariableDeEntorno"
lambda_forecast_url  = "https://bhhjxxuar5.execute-api.sa-east-1.amazonaws.com/PROD/forecast"
```

### 5. Desplegar Infraestructura

```bash
cd terraform

# Inicializar Terraform
terraform init

# Revisar plan
terraform plan

# Aplicar cambios
terraform apply
```

Después de aplicar, Terraform mostrará los outputs con las URLs e IPs.

### 6. Desplegar Aplicaciones en EC2

Una vez que las instancias EC2 estén creadas, necesitas:

1. **Conectar a las instancias EC2**:
   ```bash
   ssh -i tu-key.pem ec2-user@<MYCFO1_IP>
   ssh -i tu-key.pem ec2-user@<MYCFO2_IP>
   ```

2. **Subir las imágenes Docker o el código fuente**:
   - Opción A: Subir las imágenes Docker a ECR y hacer pull en EC2
   - Opción B: Subir el código fuente y construir en EC2
   - Opción C: Usar un sistema de CI/CD

3. **Ejecutar los contenedores**:
   ```bash
   # En MyCFO1
   docker run -d -p 8080:8080 \
     -e MYCFO2_URL=http://<MYCFO2_PRIVATE_IP>:8081 \
     -e APP_TEST_ENV_VAR="TuVariable" \
     -e AWS_REGION=sa-east-1 \
     mycfo1:latest

   # En MyCFO2
   docker run -d -p 8081:8081 \
     -e AWS_REGION=sa-east-1 \
     mycfo2:latest
   ```

## Configuración de Secrets Manager

Los secretos se crean automáticamente con Terraform. Spring Boot los lee automáticamente usando Spring Cloud AWS.

Para actualizar un secreto:

```bash
aws secretsmanager put-secret-value \
  --secret-id mycfo1/secrets \
  --secret-string '{"app.test.secret":"NuevoValor"}' \
  --region sa-east-1
```

## Variables de Entorno

Las variables de entorno se configuran en el user_data de las instancias EC2. Puedes actualizarlas en Terraform o manualmente en las instancias.

## API Gateway

Los endpoints están disponibles a través de API Gateway:

- `GET {api_gateway_url}/prod/forecast` - Forecast
- `GET {api_gateway_url}/prod/secret/test` - Secreto
- `GET {api_gateway_url}/prod/environment/test` - Variable de entorno

## Testing Local

Para probar localmente:

```bash
# MyCFO2
cd mycfo2
mvn spring-boot:run

# MyCFO1 (en otra terminal)
cd mycfo1
export MYCFO2_URL=http://localhost:8081
mvn spring-boot:run
```

## Estructura del Proyecto

```
prueba-infra/
├── mycfo1/                    # Aplicación MyCFO1
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── mycfo2/                    # Aplicación MyCFO2
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
└── terraform/                 # Infraestructura como código
    ├── main.tf
    ├── ec2.tf
    ├── api_gateway.tf
    ├── secrets.tf
    ├── iam.tf
    └── variables.tf
```

## Troubleshooting

### Las aplicaciones no pueden acceder a Secrets Manager
- Verifica que los IAM roles tengan los permisos correctos
- Verifica que los secrets existan en AWS Secrets Manager
- Revisa los logs de las aplicaciones

### MyCFO1 no puede conectarse a MyCFO2
- Verifica que MyCFO2 esté ejecutándose
- Verifica que el Security Group de MyCFO2 permita tráfico desde MyCFO1
- Verifica la variable MYCFO2_URL

### API Gateway no responde
- Verifica que el VPC Link esté activo
- Verifica que el Network Load Balancer tenga targets saludables
- Revisa los logs de CloudWatch

## Limpieza

Para destruir toda la infraestructura:

```bash
cd terraform
terraform destroy
```

## Notas Importantes

1. **Costo**: Las instancias EC2, API Gateway y otros recursos incurren en costos. Recuerda destruir los recursos cuando no los necesites.

2. **Seguridad**: 
   - Los secrets están encriptados en Secrets Manager
   - Los Security Groups están configurados para limitar el acceso
   - Considera usar bastion hosts para acceso SSH

3. **Escalabilidad**: 
   - El setup actual usa instancias únicas
   - Para producción, considera usar Auto Scaling Groups y Application Load Balancer

4. **Monitoreo**: 
   - Considera agregar CloudWatch Logs
   - Configura alertas para las instancias EC2
   - Monitorea los endpoints del API Gateway

