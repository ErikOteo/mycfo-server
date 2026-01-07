# Guía Completa de Despliegue - MyCFO1 y MyCFO2

Esta guía te lleva paso a paso para desplegar los módulos **MyCFO1** y **MyCFO2** en AWS usando Terraform.

---

## 📋 Tabla de Contenidos

1. [Prerequisitos](#prerequisitos)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Paso 1: Preparación del Entorno](#paso-1-preparación-del-entorno)
4. [Paso 2: Compilación de los Módulos](#paso-2-compilación-de-los-módulos)
5. [Paso 3: Configuración de Terraform](#paso-3-configuración-de-terraform)
6. [Paso 4: Despliegue de la Infraestructura](#paso-4-despliegue-de-la-infraestructura)
7. [Paso 5: Despliegue de las Aplicaciones](#paso-5-despliegue-de-las-aplicaciones)
8. [Paso 6: Verificación y Pruebas](#paso-6-verificación-y-pruebas)
9. [Troubleshooting](#troubleshooting)
10. [Mantenimiento](#mantenimiento)
11. [Destrucción de Recursos](#destrucción-de-recursos)

---

## Prerequisitos

### Software Requerido

1. **AWS CLI** (versión 2.x o superior)
   ```bash
   aws --version
   ```
   Si no lo tienes instalado:
   - Windows: Descargar desde [AWS CLI](https://aws.amazon.com/cli/)
   - Linux/Mac: `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install`

2. **Terraform** (versión >= 1.0)
   ```bash
   terraform version
   ```
   Si no lo tienes instalado:
   - Descargar desde [Terraform Downloads](https://www.terraform.io/downloads)
   - O usar un gestor de paquetes: `choco install terraform` (Windows) o `brew install terraform` (Mac)

3. **Java 17** (JDK)
   ```bash
   java -version
   ```
   Debe mostrar versión 17 o superior.

4. **Maven** (versión 3.6+)
   ```bash
   mvn -version
   ```

5. **SSH Client** (incluido en Linux/Mac, usar PuTTY o WSL en Windows)

### Configuración de AWS

1. **Configurar credenciales de AWS:**
   ```bash
   aws configure
   ```
   Ingresa:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region: `sa-east-1` (o la región que prefieras)
   - Default output format: `json`

2. **Verificar credenciales:**
   ```bash
   aws sts get-caller-identity
   ```

3. **Permisos IAM requeridos:**
   Tu usuario/rol de AWS debe tener permisos para crear:
   - EC2 (instancias, security groups, key pairs)
   - VPC (leer información de VPC y subnets existentes)
   - IAM (roles, policies, instance profiles)
   - Secrets Manager (secrets)
   - API Gateway (APIs, deployments, stages, VPC links)
   - Elastic Load Balancing (load balancers, target groups, listeners)
   - CloudWatch Logs (opcional, para logs)

   **Política mínima recomendada:** `PowerUserAccess` o un rol personalizado con estos permisos.
   
   **Nota:** La configuración de Terraform utiliza una VPC existente, por lo que no se crearán recursos de VPC nuevos.

### Key Pair SSH

Necesitas un **Key Pair** en AWS para acceder a las instancias EC2.

**Opción 1: Crear desde la consola de AWS**
1. Ve a EC2 → Key Pairs → Create key pair
2. Nombre: `mycfo-key`
3. Tipo: RSA
4. Formato: `.pem` (para OpenSSH)
5. Descarga el archivo `.pem`

**Opción 2: Importar una clave existente**
```bash
# Generar clave SSH localmente (si no tienes una)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/mycfo-key

# Importar a AWS
aws ec2 import-key-pair \
  --key-name mycfo-key \
  --public-key-material fileb://~/.ssh/mycfo-key.pub \
  --region sa-east-1
```

**⚠️ IMPORTANTE:** Guarda el archivo `.pem` en un lugar seguro. Lo necesitarás para conectarte a las instancias.

---

## Arquitectura del Sistema

La infraestructura desplegada incluye:

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                           │
│  https://xxxxx.execute-api.sa-east-1.amazonaws.com/prod │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ VPC Link
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Network Load Balancer (NLB)                 │
│  - Listener 8080 → MyCFO1                                │
│  - Listener 8081 → MyCFO2                                │
└──────────────┬──────────────────────┬────────────────────┘
               │                      │
               ▼                      ▼
    ┌──────────────────┐    ┌──────────────────┐
    │   EC2 MyCFO1     │    │   EC2 MyCFO2     │
    │   Port: 8080     │    │   Port: 8081     │
    │   Subnet 1       │    │   Subnet 2       │
    └──────────────────┘    └──────────────────┘
               │                      │
               └──────────┬───────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │   Secrets Manager    │
              │  - mycfo1/secrets    │
              │  - mycfo2/secrets    │
              └──────────────────────┘
```

**Componentes principales:**
- **VPC**: Utiliza una VPC existente (configurada por ID)
- **Subnets**: Utiliza subnets públicas existentes de la VPC (se detectan automáticamente o se pueden especificar)
- **2 Instancias EC2**: Una para cada módulo
- **Network Load Balancer**: Balanceador de carga
- **API Gateway**: Punto de entrada público
- **Secrets Manager**: Almacenamiento de secretos
- **IAM Roles**: Permisos para acceder a Secrets Manager

---

## Paso 1: Preparación del Entorno

### 1.1. Clonar/Navegar al Proyecto

```bash
# Si es un repositorio Git
git clone <url-del-repositorio>
cd prueba-infra

# O si ya tienes el proyecto local
cd D:\Proyectos\mycfo\prueba-infra
```

### 1.2. Verificar Estructura del Proyecto

Asegúrate de tener esta estructura:
```
prueba-infra/
├── mycfo1/              # Módulo 1
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── mycfo2/              # Módulo 2
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
└── terraform/           # Infraestructura
    ├── main.tf
    ├── variables.tf
    ├── ec2.tf
    ├── api_gateway.tf
    ├── security_groups.tf
    ├── iam.tf
    ├── secrets.tf
    ├── outputs.tf
    └── scripts/
        ├── mycfo1-init.sh
        └── mycfo2-init.sh
```

---

## Paso 2: Compilación de los Módulos

### 2.1. Compilar MyCFO1

```bash
cd mycfo1
mvn clean package -DskipTests
```

**Resultado esperado:**
```
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

El JAR se generará en: `mycfo1/target/mycfo1-0.0.1-SNAPSHOT.jar`

**Verificar:**
```bash
ls -lh target/*.jar
# Debe mostrar: mycfo1-0.0.1-SNAPSHOT.jar
```

### 2.2. Compilar MyCFO2

```bash
cd ../mycfo2
mvn clean package -DskipTests
```

**Resultado esperado:**
```
[INFO] BUILD SUCCESS
```

El JAR se generará en: `mycfo2/target/mycfo2-0.0.1-SNAPSHOT.jar`

**Verificar:**
```bash
ls -lh target/*.jar
# Debe mostrar: mycfo2-0.0.1-SNAPSHOT.jar
```

### 2.3. Volver al Directorio Raíz

```bash
cd ..
```

---

## Paso 3: Configuración de Terraform

### 3.1. Navegar al Directorio de Terraform

```bash
cd terraform
```

### 3.2. Crear Archivo de Variables

Copia el archivo de ejemplo y personalízalo:

```bash
# Windows (PowerShell)
Copy-Item terraform.tfvars.example terraform.tfvars

# Linux/Mac
cp terraform.tfvars.example terraform.tfvars
```

### 3.3. Editar `terraform.tfvars`

Abre `terraform.tfvars` y configura los valores:

```hcl
aws_region           = "sa-east-1"  # Cambia si necesitas otra región
instance_type        = "t3.micro"   # Tipo de instancia EC2
mycfo1_test_secret   = "MiSecretoDePrueba123"  # Cambia por tu secreto
app_test_env_var     = "MiVariableDeEntorno456"  # Cambia por tu variable
lambda_forecast_url  = "https://bhhjxxuar5.execute-api.sa-east-1.amazonaws.com/PROD/forecast"  # URL de tu Lambda

# VPC existente a utilizar
vpc_id               = "vpc-08d98de61342ca027"  # ID de tu VPC existente

# IDs de las subnets públicas (opcional)
# Si no se especifican, Terraform intentará encontrarlas automáticamente
# subnet_ids          = ["subnet-xxxxxxxxx", "subnet-yyyyyyyyy"]
```

**⚠️ IMPORTANTE:**
- `vpc_id`: ID de la VPC existente que deseas utilizar
- `subnet_ids`: (Opcional) IDs de las subnets públicas. Si no se especifican, Terraform intentará encontrar subnets públicas automáticamente basándose en el atributo `map_public_ip_on_launch = true`
- `mycfo1_test_secret`: Secreto que usará MyCFO1 (almacenado en Secrets Manager)
- `app_test_env_var`: Variable de entorno para MyCFO1
- `lambda_forecast_url`: URL de la función Lambda externa (si aplica)

**Nota sobre Subnets:**
- Se requieren al menos 2 subnets públicas en diferentes zonas de disponibilidad para el Load Balancer
- Si tus subnets no tienen `map_public_ip_on_launch = true`, deberás especificar los IDs manualmente en `subnet_ids`

### 3.4. Verificar Archivos de Terraform

Asegúrate de que todos los archivos estén presentes:

```bash
# Windows (PowerShell)
Get-ChildItem *.tf

# Linux/Mac
ls *.tf
```

Debes ver:
- `main.tf`
- `variables.tf`
- `ec2.tf`
- `api_gateway.tf`
- `security_groups.tf`
- `iam.tf`
- `secrets.tf`
- `outputs.tf`

---

## Paso 4: Despliegue de la Infraestructura

### 4.1. Inicializar Terraform

```bash
terraform init
```

**Resultado esperado:**
```
Initializing the backend...
Initializing provider plugins...
- Finding hashicorp/aws versions matching ~> 5.0...
- Installing hashicorp/aws v5.x.x...
Terraform has been successfully initialized!
```

Esto descarga el proveedor de AWS y configura el backend.

### 4.2. Validar Configuración

```bash
terraform validate
```

**Resultado esperado:**
```
Success! The configuration is valid.
```

### 4.3. Revisar el Plan de Ejecución

```bash
terraform plan
```

Este comando muestra **qué recursos se van a crear** sin aplicarlos.

**Revisa cuidadosamente:**
- ⚠️ **NO** se creará una VPC (se utiliza la existente: `vpc-08d98de61342ca027`)
- ⚠️ **NO** se crearán subnets (se utilizan las existentes de la VPC)
- ⚠️ **NO** se crearán Internet Gateways ni Route Tables (ya existen en la VPC)
- ✅ 2 Security Groups
- ✅ 2 Instancias EC2 (t3.micro)
- ✅ 2 IAM Roles
- ✅ 2 IAM Instance Profiles
- ✅ 2 Secrets en Secrets Manager
- ✅ 1 Network Load Balancer
- ✅ 2 Target Groups
- ✅ 1 API Gateway REST API
- ✅ 1 VPC Link
- ✅ 1 API Gateway Deployment y Stage

**⚠️ ATENCIÓN:** 
- Verifica los costos estimados. Las instancias t3.micro están en el tier gratuito (si es tu primer año), pero otros recursos pueden tener costos.
- Asegúrate de que la VPC existente tenga subnets públicas con acceso a Internet Gateway

### 4.4. Aplicar la Infraestructura

```bash
terraform apply
```

Terraform te mostrará el plan y pedirá confirmación:
```
Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value:
```

Escribe `yes` y presiona Enter.

**⏱️ Tiempo estimado:** 5-10 minutos

**Proceso:**
1. Obtención de información de VPC y subnets existentes (10-20 seg)
2. Creación de Security Groups (30 seg)
3. Creación de IAM Roles (30 seg)
4. Creación de Secrets Manager (30 seg)
5. Creación de instancias EC2 (2-3 min)
6. Creación de Load Balancer (2-3 min)
7. Creación de API Gateway (1-2 min)

### 4.5. Guardar los Outputs

Al finalizar, Terraform mostrará los outputs:

```
Apply complete! Resources: XX added, 0 changed, 0 destroyed.

Outputs:

mycfo1_instance_ip = "3.22.xxx.xxx"
mycfo2_instance_ip = "18.228.xxx.xxx"
api_gateway_url = "https://xxxxx.execute-api.sa-east-1.amazonaws.com/prod"
mycfo1_secret_arn = "arn:aws:secretsmanager:sa-east-1:xxx:secret:mycfo1/secrets-xxxxx"
mycfo2_secret_arn = "arn:aws:secretsmanager:sa-east-1:xxx:secret:mycfo2/secrets-xxxxx"
```

**📝 GUARDA ESTOS VALORES:**
- `mycfo1_instance_ip`: IP pública de MyCFO1
- `mycfo2_instance_ip`: IP pública de MyCFO2
- `api_gateway_url`: URL del API Gateway

**Obtener outputs después:**
```bash
terraform output
```

### 4.6. Esperar Inicialización de Instancias

Las instancias EC2 ejecutan scripts de inicialización que:
- Instalan Java 17
- Instalan AWS CLI
- Crean directorios `/opt/mycfo1` y `/opt/mycfo2`
- Crean scripts `start.sh` y `stop.sh`
- Configuran servicios systemd

**⏱️ Espera 2-3 minutos** antes de continuar.

**Verificar que las instancias estén listas:**
```bash
# Obtener IPs
terraform output mycfo1_instance_ip
terraform output mycfo2_instance_ip

# Intentar conexión SSH (puede fallar las primeras veces)
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP>
# O en Windows con WSL/PuTTY
```

---

## Paso 5: Despliegue de las Aplicaciones

### 5.1. Subir JAR de MyCFO2 (Primero)

MyCFO2 debe iniciarse primero porque MyCFO1 depende de él.

```bash
# Desde el directorio raíz del proyecto
scp -i ~/.ssh/mycfo-key.pem \
  mycfo2/target/mycfo2-0.0.1-SNAPSHOT.jar \
  ec2-user@<MYCFO2_IP>:/opt/mycfo2/

# En Windows (PowerShell con WSL o usando WinSCP/PuTTY)
# O usar: scp desde Git Bash
```

**Reemplaza `<MYCFO2_IP>`** con la IP del output de Terraform.

**Verificar que se subió:**
```bash
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO2_IP>
ls -lh /opt/mycfo2/*.jar
exit
```

### 5.2. Iniciar MyCFO2

```bash
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO2_IP>
```

**Dentro de la instancia:**
```bash
cd /opt/mycfo2
./start.sh
```

**Resultado esperado:**
```
Iniciando MyCFO2...
MyCFO2 iniciado (PID: 12345)
Logs en: /opt/mycfo2/app.log
```

**Verificar que esté corriendo:**
```bash
# Ver logs
tail -f app.log
# Presiona Ctrl+C para salir

# O verificar proceso
ps aux | grep java

# Verificar puerto
netstat -tlnp | grep 8081
# Debe mostrar: tcp 0 0 0.0.0.0:8081 LISTEN
```

**Probar health check:**
```bash
curl http://localhost:8081/actuator/health
# Debe responder: {"status":"UP"}
```

**Salir de la instancia:**
```bash
exit
```

### 5.3. Subir JAR de MyCFO1

```bash
# Desde tu máquina local
scp -i ~/.ssh/mycfo-key.pem \
  mycfo1/target/mycfo1-0.0.1-SNAPSHOT.jar \
  ec2-user@<MYCFO1_IP>:/opt/mycfo1/
```

**Verificar:**
```bash
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP>
ls -lh /opt/mycfo1/*.jar
exit
```

### 5.4. Iniciar MyCFO1

```bash
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP>
```

**Dentro de la instancia:**
```bash
cd /opt/mycfo1
./start.sh
```

**Resultado esperado:**
```
Iniciando MyCFO1...
MyCFO1 iniciado (PID: 12346)
Logs en: /opt/mycfo1/app.log
```

**Verificar:**
```bash
tail -f app.log
# Busca: "Started Mycfo1Application" o similar

# Verificar proceso
ps aux | grep java

# Verificar puerto
netstat -tlnp | grep 8080

# Health check
curl http://localhost:8080/actuator/health
```

**Salir:**
```bash
exit
```

### 5.5. (Opcional) Configurar Auto-inicio con systemd

Para que las aplicaciones se inicien automáticamente al reiniciar:

**En MyCFO2:**
```bash
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO2_IP>
sudo systemctl enable mycfo2
sudo systemctl start mycfo2
sudo systemctl status mycfo2
exit
```

**En MyCFO1:**
```bash
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP>
sudo systemctl enable mycfo1
sudo systemctl start mycfo1
sudo systemctl status mycfo1
exit
```

---

## Paso 6: Verificación y Pruebas

### 6.1. Verificar Health Checks Directos

**MyCFO1:**
```bash
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP>
curl http://localhost:8080/actuator/health
exit
```

**MyCFO2:**
```bash
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO2_IP>
curl http://localhost:8081/actuator/health
exit
```

### 6.2. Verificar Endpoints a través de API Gateway

Obtén la URL del API Gateway:
```bash
terraform output api_gateway_url
```

**Ejemplo de URL:**
```
https://abc123xyz.execute-api.sa-east-1.amazonaws.com/prod
```

**Probar endpoints:**

**1. Forecast (MyCFO1):**
```bash
curl https://xxxxx.execute-api.sa-east-1.amazonaws.com/prod/forecast
```

**2. Secret Test (MyCFO1):**
```bash
curl https://xxxxx.execute-api.sa-east-1.amazonaws.com/prod/secret/test
```

**3. Environment Test (MyCFO1):**
```bash
curl https://xxxxx.execute-api.sa-east-1.amazonaws.com/prod/environment/test
```

**Resultados esperados:**
- Forecast: Debe retornar datos de forecast
- Secret: Debe retornar el secreto desde Secrets Manager
- Environment: Debe retornar la variable de entorno configurada

### 6.3. Verificar Conectividad entre Módulos

MyCFO1 debe poder comunicarse con MyCFO2:

```bash
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP>
# Obtener IP privada de MyCFO2 desde Terraform
terraform output -json | grep -i mycfo2
# O desde la instancia, probar conectividad
curl http://<MYCFO2_PRIVATE_IP>:8081/actuator/health
```

### 6.4. Verificar en la Consola de AWS

1. **EC2 Console:**
   - Debe haber 2 instancias corriendo
   - Estado: `running`
   - Health checks: `2/2 checks passed`

2. **Load Balancer:**
   - Target Groups deben tener targets `healthy`

3. **API Gateway:**
   - Debe haber un API desplegado
   - Stage: `prod`

4. **Secrets Manager:**
   - Debe haber 2 secrets: `mycfo1/secrets` y `mycfo2/secrets`

---

## Troubleshooting

### Problema: Las aplicaciones no inician

**Solución:**
```bash
# SSH a la instancia
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<IP>

# Ver logs
tail -50 /opt/mycfo1/app.log  # o mycfo2
# Buscar errores

# Verificar que el JAR existe
ls -lh /opt/mycfo1/*.jar

# Verificar Java
java -version
# Debe mostrar: openjdk version "17"

# Verificar permisos
ls -la /opt/mycfo1/start.sh
# Debe tener permisos de ejecución: -rwxr-xr-x
```

### Problema: MyCFO1 no puede conectarse a MyCFO2

**Solución:**
```bash
# En MyCFO1, verificar configuración
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP>
cat /opt/mycfo1/application.properties
# Verificar MYCFO2_URL

# Obtener IP privada de MyCFO2
# Desde tu máquina local:
terraform output -json | jq '.mycfo2_instance_ip.value'

# Probar conectividad desde MyCFO1
curl http://<MYCFO2_PRIVATE_IP>:8081/actuator/health

# Verificar Security Group de MyCFO2
# Debe permitir tráfico desde 10.0.0.0/16 en puerto 8081
```

### Problema: API Gateway retorna 502/503

**Solución:**
1. Verificar que las aplicaciones estén corriendo:
   ```bash
   ssh -i ~/.ssh/mycfo-key.pem ec2-user@<IP>
   ps aux | grep java
   ```

2. Verificar que el Load Balancer tenga targets healthy:
   - Consola AWS → EC2 → Target Groups
   - Verificar health status

3. Verificar VPC Link:
   - Consola AWS → API Gateway → VPC Links
   - Debe estar en estado `Available`

4. Verificar Security Groups:
   - MyCFO1 debe permitir tráfico en puerto 8080 desde el Load Balancer

### Problema: No puedo conectarme por SSH

**Solución:**
1. Verificar que la instancia esté `running`
2. Verificar Security Group:
   - Debe permitir SSH (puerto 22) desde tu IP
3. Verificar Key Pair:
   ```bash
   # Verificar que el archivo .pem existe
   ls -lh ~/.ssh/mycfo-key.pem
   
   # Verificar permisos (Linux/Mac)
   chmod 400 ~/.ssh/mycfo-key.pem
   ```

### Problema: Error al obtener secretos de Secrets Manager

**Solución:**
```bash
# Verificar IAM Role
aws iam get-instance-profile --instance-profile-name mycfo1-instance-profile

# Verificar política
aws iam get-role-policy --role-name mycfo1-ec2-role --policy-name mycfo1-secrets-policy

# Verificar que el secreto existe
aws secretsmanager describe-secret --secret-id mycfo1/secrets --region sa-east-1

# Probar desde la instancia
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP>
aws secretsmanager get-secret-value --secret-id mycfo1/secrets --region sa-east-1
```

### Ver Logs de las Aplicaciones

```bash
# SSH a la instancia
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<IP>

# Ver logs en tiempo real
tail -f /opt/mycfo1/app.log

# Ver últimas 100 líneas
tail -100 /opt/mycfo1/app.log

# Buscar errores
grep -i error /opt/mycfo1/app.log
```

### Reiniciar una Aplicación

```bash
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<IP>
cd /opt/mycfo1  # o mycfo2
./stop.sh
./start.sh
```

---

## Mantenimiento

### Actualizar una Aplicación

1. **Compilar nueva versión:**
   ```bash
   cd mycfo1  # o mycfo2
   mvn clean package -DskipTests
   ```

2. **Subir nuevo JAR:**
   ```bash
   scp -i ~/.ssh/mycfo-key.pem \
     mycfo1/target/mycfo1-0.0.1-SNAPSHOT.jar \
     ec2-user@<MYCFO1_IP>:/opt/mycfo1/
   ```

3. **Reiniciar aplicación:**
   ```bash
   ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP>
   cd /opt/mycfo1
   ./stop.sh
   ./start.sh
   exit
   ```

### Actualizar un Secreto

```bash
aws secretsmanager put-secret-value \
  --secret-id mycfo1/secrets \
  --secret-string '{"app.test.secret":"NuevoValor"}' \
  --region sa-east-1

# Reiniciar aplicación para que cargue el nuevo secreto
```

### Ver Estado de los Recursos

```bash
# Ver instancias EC2
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=mycfo*" \
  --region sa-east-1 \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]' \
  --output table

# Ver Load Balancer
aws elbv2 describe-load-balancers \
  --region sa-east-1 \
  --query 'LoadBalancers[?contains(LoadBalancerName, `mycfo`)]'

# Ver API Gateway
aws apigateway get-rest-apis \
  --region sa-east-1 \
  --query 'items[?contains(name, `mycfo`)]'
```

### Monitoreo

**CloudWatch Logs (si está configurado):**
```bash
aws logs tail /aws/ec2/mycfo1 --follow --region sa-east-1
```

**Métricas de EC2:**
- CPU Utilization
- Network In/Out
- Status Checks

**Métricas de Load Balancer:**
- Healthy/Unhealthy Host Count
- Request Count
- Target Response Time

---

## Destrucción de Recursos

**⚠️ ADVERTENCIA:** Esto eliminará TODOS los recursos creados por Terraform.

### Destruir Infraestructura

```bash
cd terraform
terraform destroy
```

Terraform mostrará qué recursos se van a destruir y pedirá confirmación:
```
Do you want to destroy all resources?
  Terraform will destroy all your managed infrastructure.
  This action cannot be undone.

  Enter a value:
```

Escribe `yes` y presiona Enter.

**⏱️ Tiempo estimado:** 3-5 minutos

**Nota:** Algunos recursos pueden tardar en eliminarse (especialmente Load Balancers y API Gateway).

### Verificar que se Eliminaron

```bash
# Verificar instancias EC2
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=mycfo*" \
  --region sa-east-1

# Debe retornar vacío o instancias en estado "terminated"
```

### Limpieza Manual (si es necesario)

Si `terraform destroy` falla, puedes eliminar recursos manualmente:

1. **Desde la consola de AWS:**
   - EC2 → Instances → Terminate
   - ⚠️ **NO elimines la VPC** (se está utilizando una existente)
   - API Gateway → Delete API
   - Secrets Manager → Delete secret

2. **O usando AWS CLI:**
   ```bash
   # Eliminar instancias
   aws ec2 terminate-instances --instance-ids <INSTANCE_ID> --region sa-east-1
   ```

---

## Resumen Rápido

```bash
# 1. Compilar módulos
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

# 4. Guardar outputs
terraform output > outputs.txt

# 5. Subir JARs (usar IPs del output)
scp -i ~/.ssh/mycfo-key.pem mycfo2/target/*.jar ec2-user@<MYCFO2_IP>:/opt/mycfo2/
scp -i ~/.ssh/mycfo-key.pem mycfo1/target/*.jar ec2-user@<MYCFO1_IP>:/opt/mycfo1/

# 6. Iniciar aplicaciones
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO2_IP> "cd /opt/mycfo2 && ./start.sh"
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP> "cd /opt/mycfo1 && ./start.sh"

# 7. Probar
curl $(terraform output -raw api_gateway_url)/forecast
```

---

## Recursos Adicionales

- [Documentación de Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/)
- [Secrets Manager User Guide](https://docs.aws.amazon.com/secretsmanager/)

---

## Soporte

Si encuentras problemas:
1. Revisa la sección [Troubleshooting](#troubleshooting)
2. Verifica los logs de las aplicaciones
3. Revisa los logs de CloudWatch (si están configurados)
4. Consulta la documentación de AWS

---

**¡Despliegue completado! 🚀**

