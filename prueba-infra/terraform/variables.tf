variable "aws_region" {
  description = "Región de AWS"
  type        = string
  default     = "sa-east-1"
}

variable "instance_type" {
  description = "Tipo de instancia EC2"
  type        = string
  default     = "t3.micro"
}

variable "mycfo1_test_secret" {
  description = "Valor del secreto de prueba para MyCFO1"
  type        = string
  default     = "MiSecretoDePrueba123"
  sensitive   = true
}

variable "app_test_env_var" {
  description = "Valor de la variable de entorno de prueba para MyCFO1"
  type        = string
  default     = "MiVariableDeEntorno456"
}

variable "lambda_forecast_url" {
  description = "URL de la Lambda de forecast"
  type        = string
  default     = "https://bhhjxxuar5.execute-api.sa-east-1.amazonaws.com/PROD/forecast"
}

variable "vpc_id" {
  description = "ID de la VPC existente a utilizar"
  type        = string
  default     = "vpc-08d98de61342ca027"
}

variable "subnet_ids" {
  description = "IDs de las subnets públicas de la VPC (mínimo 2 subnets en diferentes AZs). REQUERIDO para garantizar que las instancias estén en subnets públicas."
  type        = list(string)
  default     = []
  
  validation {
    condition     = length(var.subnet_ids) == 0 || length(var.subnet_ids) >= 2
    error_message = "Si se especifican subnet_ids, debe haber al menos 2 subnets (en diferentes zonas de disponibilidad)."
  }
}

variable "key_name" {
  description = "Nombre del Key Pair de AWS para acceder a las instancias EC2"
  type        = string
  default     = "mycfo-key"
}

