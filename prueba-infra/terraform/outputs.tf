output "mycfo1_instance_ip" {
  description = "IP pública de la instancia MyCFO1"
  value       = aws_instance.mycfo1.public_ip
}

output "mycfo2_instance_ip" {
  description = "IP pública de la instancia MyCFO2"
  value       = aws_instance.mycfo2.public_ip
}

output "api_gateway_url" {
  description = "URL del API Gateway"
  value       = "${aws_api_gateway_stage.mycfo_api_stage.invoke_url}"
}

output "mycfo1_secret_arn" {
  description = "ARN del secreto de MyCFO1"
  value       = aws_secretsmanager_secret.mycfo1_secret.arn
}

output "mycfo2_secret_arn" {
  description = "ARN del secreto de MyCFO2"
  value       = aws_secretsmanager_secret.mycfo2_secret.arn
}

