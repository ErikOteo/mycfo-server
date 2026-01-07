# Checklist de Despliegue - MyCFO1 y MyCFO2

Usa este checklist para asegurarte de completar todos los pasos del despliegue.

## ✅ Prerequisitos

- [ ] AWS CLI instalado y configurado (`aws --version`)
- [ ] Terraform instalado (`terraform version`)
- [ ] Java 17 instalado (`java -version`)
- [ ] Maven instalado (`mvn -version`)
- [ ] Credenciales de AWS configuradas (`aws configure`)
- [ ] Key Pair SSH creado/importado en AWS (`mycfo-key`)
- [ ] Permisos IAM suficientes verificados

## ✅ Compilación

- [ ] MyCFO1 compilado exitosamente (`mvn clean package -DskipTests`)
- [ ] JAR de MyCFO1 generado en `mycfo1/target/`
- [ ] MyCFO2 compilado exitosamente (`mvn clean package -DskipTests`)
- [ ] JAR de MyCFO2 generado en `mycfo2/target/`

## ✅ Configuración de Terraform

- [ ] Archivo `terraform.tfvars` creado desde `terraform.tfvars.example`
- [ ] Variables configuradas en `terraform.tfvars`:
  - [ ] `aws_region`
  - [ ] `instance_type`
  - [ ] `mycfo1_test_secret`
  - [ ] `app_test_env_var`
  - [ ] `lambda_forecast_url`
  - [ ] `vpc_id` (VPC existente: `vpc-08d98de61342ca027`)
  - [ ] `subnet_ids` (opcional, si no se especifica se detectarán automáticamente)
- [ ] Todos los archivos `.tf` presentes en `terraform/`

## ✅ Despliegue de Infraestructura

- [ ] Terraform inicializado (`terraform init`)
- [ ] Configuración validada (`terraform validate`)
- [ ] Plan revisado (`terraform plan`)
  - [ ] Verificado que NO se creará VPC (usa existente)
  - [ ] Verificado que NO se crearán subnets (usa existentes)
- [ ] Infraestructura aplicada (`terraform apply`)
- [ ] Outputs guardados:
  - [ ] `mycfo1_instance_ip`
  - [ ] `mycfo2_instance_ip`
  - [ ] `api_gateway_url`
  - [ ] `mycfo1_secret_arn`
  - [ ] `mycfo2_secret_arn`
- [ ] Esperado 2-3 minutos para inicialización de instancias

## ✅ Despliegue de Aplicaciones

### MyCFO2 (Primero)
- [ ] JAR subido a `/opt/mycfo2/` en la instancia
- [ ] Aplicación iniciada (`./start.sh`)
- [ ] Proceso Java corriendo (`ps aux | grep java`)
- [ ] Puerto 8081 escuchando (`netstat -tlnp | grep 8081`)
- [ ] Health check exitoso (`curl http://localhost:8081/actuator/health`)

### MyCFO1 (Segundo)
- [ ] JAR subido a `/opt/mycfo1/` en la instancia
- [ ] Aplicación iniciada (`./start.sh`)
- [ ] Proceso Java corriendo (`ps aux | grep java`)
- [ ] Puerto 8080 escuchando (`netstat -tlnp | grep 8080`)
- [ ] Health check exitoso (`curl http://localhost:8080/actuator/health`)

## ✅ Verificación

- [ ] MyCFO1 health check directo funciona
- [ ] MyCFO2 health check directo funciona
- [ ] API Gateway endpoint `/forecast` funciona
- [ ] API Gateway endpoint `/secret/test` funciona
- [ ] API Gateway endpoint `/environment/test` funciona
- [ ] MyCFO1 puede comunicarse con MyCFO2
- [ ] Secrets Manager contiene los secretos correctos

## ✅ (Opcional) Configuración Avanzada

- [ ] Servicios systemd habilitados para auto-inicio
- [ ] Logs de CloudWatch configurados (si aplica)
- [ ] Alertas configuradas (si aplica)
- [ ] Backup de configuración realizado

## ✅ Post-Despliegue

- [ ] Documentación actualizada
- [ ] URLs y credenciales guardadas de forma segura
- [ ] Acceso SSH verificado
- [ ] Monitoreo básico configurado

---

## Comandos Rápidos de Verificación

```bash
# Verificar instancias
terraform output

# Verificar aplicaciones
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP> "ps aux | grep java"
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO2_IP> "ps aux | grep java"

# Verificar API Gateway
curl $(terraform output -raw api_gateway_url)/forecast

# Verificar logs
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO1_IP> "tail -20 /opt/mycfo1/app.log"
ssh -i ~/.ssh/mycfo-key.pem ec2-user@<MYCFO2_IP> "tail -20 /opt/mycfo2/app.log"
```

---

**Fecha de despliegue:** _______________

**Responsable:** _______________

**Notas:** _______________

