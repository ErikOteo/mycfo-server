# Guía de Despliegue en AWS

Esta guía te lleva paso a paso para desplegar MyCFO1 y MyCFO2 en AWS.

## Prerequisitos

1. **AWS CLI** instalado y configurado:
   ```bash
   aws configure
   ```

2. **Terraform** >= 1.0 instalado:
   ```bash
   terraform version
   ```

3. **Java 17** y **Maven** instalados (para compilar)

4. **SSH Key Pair** en AWS (o crear uno nuevo)

5. **Credenciales de AWS** con permisos para crear:
   - EC2, VPC, Security Groups
   - IAM Roles y Policies
   - Secrets Manager
   - API Gateway
   - Network Load Balancer

---

## Paso 1: Compilar las Aplicaciones

### Compilar MyCFO1:
```bash
cd mycfo1
mvn clean package -DskipTests
```

Esto generará: `mycfo1/target/mycfo1-0.0.1-SNAPSHOT.jar`

### Compilar MyCFO2:
```bash
cd ../mycfo2
mvn clean package -DskipTests
```

Esto generará: `mycfo2/target/mycfo2-0.0.1-SNAPSHOT.jar`

---

## Paso 2: Configurar Terraform

### 2.1. Ir al directorio de Terraform:
```bash
cd ../terraform
```

### 2.2. Crear archivo de configuración:
```bash
cp terraform.tfvars.example terraform.tfvars
```

### 2.3. Editar `terraform.tfvars` con tus valores:
```hcl
aws_region           = "sa-east-1"
instance_type        = "t3.micro"
mycfo1_test_secret   = "MiSecretoDePrueba123"
app_test_env_var     = "MiVariableDeEntorno456"
lambda_forecast_url  = "https://bhhjxxuar5.execute-api.sa-east-1.amazonaws.com/PROD/forecast"
```

**Nota**: Ajusta `aws_region` si necesitas otra región.

### 2.4. (Opcional) Crear Key Pair en AWS:
Si no tienes un key pair, créalo:
```bash
# Generar clave SSH localmente
ssh-keygen -t rsa -b 4096 -f ~/.ssh/mycfo-key

# Subir clave pública a AWS
aws ec2 import-key-pair \
  --key-name mycfo-key \
  --public-key-material fileb://~/.ssh/mycfo-key.pub \
  --region sa-east-1
```

O crea uno desde la consola de AWS.

---

## Paso 3: Inicializar Terraform

```bash
cd terraform
terraform init
```

Esto descargará los proveedores necesarios (AWS).

---

## Paso 4: Revisar el Plan de Ejecución

```bash
terraform plan
```

**Revisa cuidadosamente** qué recursos se van a crear. Deberías ver:
- 1 VPC
- 2 Subnets
- 2 Security Groups
- 2 Instancias EC2
- 2 IAM Roles
- 2 Secrets en Secrets Manager
- 1 Network Load Balancer
- 1 API Gateway
- Y otros recursos relacionados

---

## Paso 5: Aplicar la Infraestructura

```bash
terraform apply
```

Terraform te pedirá confirmación. Escribe `yes` y presiona Enter.

**Esto tomará varios minutos** (5-10 minutos aproximadamente).

Al finalizar, verás los outputs con las IPs y URLs:
```
Outputs:

mycfo1_instance_ip = "3.22.xxx.xxx"
mycfo2_instance_ip = "18.228.xxx.xxx"
api_gateway_url = "https://xxxxx.execute-api.sa-east-1.amazonaws.com/prod"
mycfo1_secret_arn = "arn:aws:secretsmanager:sa-east-1:xxx:secret:mycfo1/secrets-xxxxx"
mycfo2_secret_arn = "arn:aws:secretsmanager:sa-east-1:xxx:secret:mycfo2/secrets-xxxxx"
```

**Guarda estos valores**, los necesitarás después.

---

## Paso 6: Esperar la Inicialización de las Instancias

Espera 2-3 minutos para que los scripts de inicialización terminen. Puedes verificar conectándote por SSH:

```bash
# Verificar MyCFO1
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP>

# Dentro de la instancia, verificar que Java esté instalado:
java -version

# Verificar que los directorios estén creados:
ls -la /opt/mycfo1

# Salir
exit
```

---

## Paso 7: Subir los JARs a las Instancias EC2

### 7.1. Subir MyCFO1:
```bash
# Desde tu máquina local
scp -i ~/.ssh/mycfo-key.pem \
  mycfo1/target/mycfo1-0.0.1-SNAPSHOT.jar \
  ec2-user@<MYCFO1_IP>:/opt/mycfo1/
```

### 7.2. Subir MyCFO2:
```bash
scp -i ~/.ssh/mycfo-key.pem \
  mycfo2/target/mycfo2-0.0.1-SNAPSHOT.jar \
  ec2-user@<MYCFO2_IP>:/opt/mycfo2/
```

**Nota**: Reemplaza `<MYCFO1_IP>` y `<MYCFO2_IP>` con las IPs que obtuviste del output de Terraform.

---

## Paso 8: Iniciar las Aplicaciones

### 8.1. Iniciar MyCFO2 (primero, porque MyCFO1 depende de él):
```bash
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO2_IP>

# Dentro de la instancia:
cd /opt/mycfo2
./start.sh

# Verificar que esté corriendo:
tail -f app.log

# O verificar el proceso:
ps aux | grep java

# Salir (Ctrl+C para salir del tail, luego exit)
exit
```

### 8.2. Iniciar MyCFO1:
```bash
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP>

# Dentro de la instancia:
cd /opt/mycfo1
./start.sh

# Verificar que esté corriendo:
tail -f app.log

# Salir
exit
```

---

## Paso 9: Verificar que Todo Funciona

### 9.1. Verificar Health Checks directamente en las instancias:

**MyCFO1**:
```bash
curl http://localhost:8080/actuator/health
```

**MyCFO2**:
```bash
curl http://localhost:8081/actuator/health
```

### 9.2. Verificar Endpoints a través de API Gateway:

Obtén la URL del API Gateway del output de Terraform:
```
api_gateway_url = "https://xxxxx.execute-api.sa-east-1.amazonaws.com/prod"
```

**Test Forecast**:
```bash
curl https://xxxxx.execute-api.sa-east-1.amazonaws.com/prod/forecast
```

**Test Secret**:
```bash
curl https://xxxxx.execute-api.sa-east-1.amazonaws.com/prod/secret/test
```

**Test Environment**:
```bash
curl https://xxxxx.execute-api.sa-east-1.amazonaws.com/prod/environment/test
```

---

## Paso 10: (Opcional) Configurar como Servicio systemd

Para que las aplicaciones se inicien automáticamente al reiniciar:

### En MyCFO1:
```bash
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP>
sudo systemctl start mycfo1
sudo systemctl enable mycfo1
sudo systemctl status mycfo1
```

### En MyCFO2:
```bash
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO2_IP>
sudo systemctl start mycfo2
sudo systemctl enable mycfo2
sudo systemctl status mycfo2
```

---

## Troubleshooting

### Las aplicaciones no inician:
```bash
# Verificar logs
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<IP>
tail -f /opt/mycfo1/app.log  # o /opt/mycfo2/app.log

# Verificar que el JAR existe
ls -la /opt/mycfo1/
ls -la /opt/mycfo2/

# Verificar Java
java -version
```

### MyCFO1 no puede conectarse a MyCFO2:
```bash
# En MyCFO1, verificar la URL configurada:
cat /opt/mycfo1/application.properties

# Verificar conectividad:
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP>
curl http://<MYCFO2_PRIVATE_IP>:8081/actuator/health
```

### Ver recursos creados en AWS:
```bash
# Ver instancias EC2
aws ec2 describe-instances --region sa-east-1

# Ver Secrets Manager
aws secretsmanager list-secrets --region sa-east-1

# Ver API Gateway
aws apigateway get-rest-apis --region sa-east-1
```

### Ver logs de las aplicaciones:
```bash
# SSH a la instancia y ver logs en tiempo real:
tail -f /opt/mycfo1/app.log
tail -f /opt/mycfo2/app.log
```

---

## Comandos Útiles

### Reiniciar una aplicación:
```bash
# SSH a la instancia
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<IP>
cd /opt/mycfo1  # o mycfo2
./stop.sh
./start.sh
```

### Ver estado de las aplicaciones:
```bash
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<IP>
ps aux | grep java
netstat -tlnp | grep 8080  # o 8081
```

### Actualizar un secreto:
```bash
aws secretsmanager put-secret-value \
  --secret-id mycfo1/secrets \
  --secret-string '{"app.test.secret":"NuevoValor"}' \
  --region sa-east-1
```

---

## Destruir la Infraestructura

**⚠️ CUIDADO**: Esto eliminará TODOS los recursos creados.

```bash
cd terraform
terraform destroy
```

Confirma con `yes`. Esto puede tomar varios minutos.

---

## Resumen Rápido

```bash
# 1. Compilar
cd mycfo1 && mvn clean package -DskipTests && cd ..
cd mycfo2 && mvn clean package -DskipTests && cd ..

# 2. Configurar Terraform
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Editar terraform.tfvars

# 3. Desplegar infraestructura
terraform init
terraform plan
terraform apply

# 4. Subir JARs (usar IPs del output)
scp -i ~/.ssh/mycfo-key.pem mycfo1/target/*.jar ec2-user@<MYCFO1_IP>:/opt/mycfo1/
scp -i ~/.ssh/mycfo-key.pem mycfo2/target/*.jar ec2-user@<MYCFO2_IP>:/opt/mycfo2/

# 5. Iniciar aplicaciones (SSH a cada instancia)
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO2_IP>
cd /opt/mycfo2 && ./start.sh && exit

ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP>
cd /opt/mycfo1 && ./start.sh && exit

# 6. Probar (usar URL del API Gateway del output)
curl https://xxxxx.execute-api.sa-east-1.amazonaws.com/prod/forecast
```

¡Listo! 🚀

