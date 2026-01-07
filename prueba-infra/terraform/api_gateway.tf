# API Gateway REST API
resource "aws_api_gateway_rest_api" "mycfo_api" {
  name        = "mycfo-api"
  description = "API Gateway para MyCFO1 y MyCFO2"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# API Gateway Resource - MyCFO1 Forecast
resource "aws_api_gateway_resource" "mycfo1_forecast" {
  rest_api_id = aws_api_gateway_rest_api.mycfo_api.id
  parent_id   = aws_api_gateway_rest_api.mycfo_api.root_resource_id
  path_part   = "forecast"
}

resource "aws_api_gateway_method" "mycfo1_forecast_get" {
  rest_api_id   = aws_api_gateway_rest_api.mycfo_api.id
  resource_id   = aws_api_gateway_resource.mycfo1_forecast.id
  http_method   = "GET"
  authorization = "NONE"
}

# API Gateway Resource - MyCFO1 Secret
resource "aws_api_gateway_resource" "mycfo1_secret" {
  rest_api_id = aws_api_gateway_rest_api.mycfo_api.id
  parent_id   = aws_api_gateway_rest_api.mycfo_api.root_resource_id
  path_part   = "secret"
}

resource "aws_api_gateway_resource" "mycfo1_secret_test" {
  rest_api_id = aws_api_gateway_rest_api.mycfo_api.id
  parent_id   = aws_api_gateway_resource.mycfo1_secret.id
  path_part   = "test"
}

resource "aws_api_gateway_method" "mycfo1_secret_get" {
  rest_api_id   = aws_api_gateway_rest_api.mycfo_api.id
  resource_id   = aws_api_gateway_resource.mycfo1_secret_test.id
  http_method   = "GET"
  authorization = "NONE"
}

# API Gateway Resource - MyCFO1 Environment
resource "aws_api_gateway_resource" "mycfo1_env" {
  rest_api_id = aws_api_gateway_rest_api.mycfo_api.id
  parent_id   = aws_api_gateway_rest_api.mycfo_api.root_resource_id
  path_part   = "environment"
}

resource "aws_api_gateway_resource" "mycfo1_env_test" {
  rest_api_id = aws_api_gateway_rest_api.mycfo_api.id
  parent_id   = aws_api_gateway_resource.mycfo1_env.id
  path_part   = "test"
}

resource "aws_api_gateway_method" "mycfo1_env_get" {
  rest_api_id   = aws_api_gateway_rest_api.mycfo_api.id
  resource_id   = aws_api_gateway_resource.mycfo1_env_test.id
  http_method   = "GET"
  authorization = "NONE"
}

# Network Load Balancer
resource "aws_lb" "mycfo_nlb" {
  name               = "mycfo-nlb"
  internal           = false
  load_balancer_type = "network"
  subnets            = [local.subnet_1_id, local.subnet_2_id]

  enable_deletion_protection = false

  tags = {
    Name = "mycfo-nlb"
  }
}

# Target Group para MyCFO1
resource "aws_lb_target_group" "mycfo1_tg" {
  name     = "mycfo1-tg"
  port     = 8080
  protocol = "TCP"
  vpc_id   = data.aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 10
    interval            = 30
    protocol            = "TCP"
  }

  deregistration_delay = 30
}

# Target Group para MyCFO2
resource "aws_lb_target_group" "mycfo2_tg" {
  name     = "mycfo2-tg"
  port     = 8081
  protocol = "TCP"
  vpc_id   = data.aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 10
    interval            = 30
    protocol            = "TCP"
  }

  deregistration_delay = 30
}

# Target Group Attachment para MyCFO1
resource "aws_lb_target_group_attachment" "mycfo1_tg_attachment" {
  target_group_arn = aws_lb_target_group.mycfo1_tg.arn
  target_id        = aws_instance.mycfo1.id
  port             = 8080
}

# Target Group Attachment para MyCFO2
resource "aws_lb_target_group_attachment" "mycfo2_tg_attachment" {
  target_group_arn = aws_lb_target_group.mycfo2_tg.arn
  target_id        = aws_instance.mycfo2.id
  port             = 8081
}

# NLB Listener - Forecast (MyCFO1)
resource "aws_lb_listener" "mycfo1_listener" {
  load_balancer_arn = aws_lb.mycfo_nlb.arn
  port              = "8080"
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.mycfo1_tg.arn
  }
}

# NLB Listener - MyCFO2
resource "aws_lb_listener" "mycfo2_listener" {
  load_balancer_arn = aws_lb.mycfo_nlb.arn
  port              = "8081"
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.mycfo2_tg.arn
  }
}

# VPC Link para conectar API Gateway con EC2 privado
# Debe crearse después del NLB y los listeners
resource "aws_api_gateway_vpc_link" "mycfo_vpc_link" {
  name        = "mycfo-vpc-link"
  description = "VPC Link para MyCFO"
  target_arns = [aws_lb.mycfo_nlb.arn]
}

# Integration para Forecast
resource "aws_api_gateway_integration" "mycfo1_forecast_integration" {
  rest_api_id = aws_api_gateway_rest_api.mycfo_api.id
  resource_id = aws_api_gateway_resource.mycfo1_forecast.id
  http_method = aws_api_gateway_method.mycfo1_forecast_get.http_method

  type                    = "HTTP_PROXY"
  integration_http_method = "GET"
  uri                     = "http://${aws_lb.mycfo_nlb.dns_name}:8080/api/v1/forecast"
  connection_type         = "VPC_LINK"
  connection_id           = aws_api_gateway_vpc_link.mycfo_vpc_link.id
}

resource "aws_api_gateway_method_response" "mycfo1_forecast_response" {
  rest_api_id = aws_api_gateway_rest_api.mycfo_api.id
  resource_id = aws_api_gateway_resource.mycfo1_forecast.id
  http_method = aws_api_gateway_method.mycfo1_forecast_get.http_method
  status_code = "200"
}

# Integration para Secret
resource "aws_api_gateway_integration" "mycfo1_secret_integration" {
  rest_api_id = aws_api_gateway_rest_api.mycfo_api.id
  resource_id = aws_api_gateway_resource.mycfo1_secret_test.id
  http_method = aws_api_gateway_method.mycfo1_secret_get.http_method

  type                    = "HTTP_PROXY"
  integration_http_method = "GET"
  uri                     = "http://${aws_lb.mycfo_nlb.dns_name}:8080/api/v1/secret/test"
  connection_type         = "VPC_LINK"
  connection_id           = aws_api_gateway_vpc_link.mycfo_vpc_link.id
}

resource "aws_api_gateway_method_response" "mycfo1_secret_response" {
  rest_api_id = aws_api_gateway_rest_api.mycfo_api.id
  resource_id = aws_api_gateway_resource.mycfo1_secret_test.id
  http_method = aws_api_gateway_method.mycfo1_secret_get.http_method
  status_code = "200"
}

# Integration para Environment
resource "aws_api_gateway_integration" "mycfo1_env_integration" {
  rest_api_id = aws_api_gateway_rest_api.mycfo_api.id
  resource_id = aws_api_gateway_resource.mycfo1_env_test.id
  http_method = aws_api_gateway_method.mycfo1_env_get.http_method

  type                    = "HTTP_PROXY"
  integration_http_method = "GET"
  uri                     = "http://${aws_lb.mycfo_nlb.dns_name}:8080/api/v1/environment/test"
  connection_type         = "VPC_LINK"
  connection_id           = aws_api_gateway_vpc_link.mycfo_vpc_link.id
}

resource "aws_api_gateway_method_response" "mycfo1_env_response" {
  rest_api_id = aws_api_gateway_rest_api.mycfo_api.id
  resource_id = aws_api_gateway_resource.mycfo1_env_test.id
  http_method = aws_api_gateway_method.mycfo1_env_get.http_method
  status_code = "200"
}

# Deployment
resource "aws_api_gateway_deployment" "mycfo_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.mycfo_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.mycfo1_forecast.id,
      aws_api_gateway_resource.mycfo1_secret_test.id,
      aws_api_gateway_resource.mycfo1_env_test.id,
      aws_api_gateway_method.mycfo1_forecast_get.id,
      aws_api_gateway_method.mycfo1_secret_get.id,
      aws_api_gateway_method.mycfo1_env_get.id,
      aws_api_gateway_integration.mycfo1_forecast_integration.id,
      aws_api_gateway_integration.mycfo1_secret_integration.id,
      aws_api_gateway_integration.mycfo1_env_integration.id,
    ]))
  }

  depends_on = [
    aws_api_gateway_integration.mycfo1_forecast_integration,
    aws_api_gateway_integration.mycfo1_secret_integration,
    aws_api_gateway_integration.mycfo1_env_integration,
    aws_api_gateway_method_response.mycfo1_forecast_response,
    aws_api_gateway_method_response.mycfo1_secret_response,
    aws_api_gateway_method_response.mycfo1_env_response,
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# Stage
resource "aws_api_gateway_stage" "mycfo_api_stage" {
  deployment_id = aws_api_gateway_deployment.mycfo_api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.mycfo_api.id
  stage_name    = "prod"
}

