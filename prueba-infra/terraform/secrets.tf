# Secret para MyCFO1
resource "aws_secretsmanager_secret" "mycfo1_secret" {
  name        = "mycfo1/secrets"
  description = "Secretos para MyCFO1"

  tags = {
    Name = "mycfo1-secret"
  }
}

resource "aws_secretsmanager_secret_version" "mycfo1_secret_version" {
  secret_id = aws_secretsmanager_secret.mycfo1_secret.id
  secret_string = jsonencode({
    "app.test.secret" = var.mycfo1_test_secret
  })
}

# Secret para MyCFO2
resource "aws_secretsmanager_secret" "mycfo2_secret" {
  name        = "mycfo2/secrets"
  description = "Secretos para MyCFO2"

  tags = {
    Name = "mycfo2-secret"
  }
}

resource "aws_secretsmanager_secret_version" "mycfo2_secret_version" {
  secret_id = aws_secretsmanager_secret.mycfo2_secret.id
  secret_string = jsonencode({
    "lambda.forecast.url" = var.lambda_forecast_url
  })
}

