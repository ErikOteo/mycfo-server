# Terraform para Infraestructura MyCFO

Este directorio contiene la configuración de Terraform para desplegar la infraestructura completa de MyCFO en AWS.

## Estructura

- `main.tf` - Recursos principales (VPC, Subnets, IGW)
- `security_groups.tf` - Security Groups para EC2
- `iam.tf` - Roles y políticas IAM
- `secrets.tf` - AWS Secrets Manager
- `ec2.tf` - Instancias EC2
- `api_gateway.tf` - API Gateway y Network Load Balancer
- `variables.tf` - Variables de entrada
- `outputs.tf` - Outputs de Terraform
- `scripts/` - Scripts de inicialización para EC2

## Prerequisitos

1. Terraform >= 1.0 instalado
2. AWS CLI configurado con credenciales apropiadas
3. Permisos para crear recursos en AWS (VPC, EC2, IAM, Secrets Manager, API Gateway, etc.)

## Uso

1. Copia `terraform.tfvars.example` a `terraform.tfvars` y edita los valores:

```bash
cp terraform.tfvars.example terraform.tfvars
```

2. Inicializa Terraform:

```bash
terraform init
```

3. Revisa el plan de ejecución:

```bash
terraform plan
```

4. Aplica los cambios:

```bash
terraform apply
```

## Variables

- `aws_region`: Región de AWS (default: sa-east-1)
- `instance_type`: Tipo de instancia EC2 (default: t3.micro)
- `mycfo1_test_secret`: Valor del secreto de prueba para MyCFO1
- `app_test_env_var`: Valor de la variable de entorno de prueba
- `lambda_forecast_url`: URL de la Lambda de forecast

## Outputs

Después de aplicar Terraform, obtendrás:

- `mycfo1_instance_ip`: IP pública de MyCFO1
- `mycfo2_instance_ip`: IP pública de MyCFO2
- `api_gateway_url`: URL del API Gateway
- `mycfo1_secret_arn`: ARN del secreto de MyCFO1
- `mycfo2_secret_arn`: ARN del secreto de MyCFO2

## Despliegue de Aplicaciones

Las instancias EC2 se configuran automáticamente con Docker. Necesitas:

1. Subir el código de las aplicaciones a las instancias
2. Construir las imágenes Docker
3. Ejecutar los contenedores

Puedes usar los scripts de inicialización como base y modificarlos según tus necesidades.

