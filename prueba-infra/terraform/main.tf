terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data source para obtener la AMI más reciente de Amazon Linux 2023
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Data source para obtener la VPC existente
data "aws_vpc" "main" {
  id = var.vpc_id
}

# Data source para obtener todas las subnets de la VPC
data "aws_subnets" "vpc_subnets" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
}

# Data source para obtener información de cada subnet y determinar si es pública
data "aws_subnet" "subnet_details" {
  for_each = toset(length(var.subnet_ids) > 0 ? var.subnet_ids : tolist(data.aws_subnets.vpc_subnets.ids))
  id       = each.value
}

# Filtrar subnets públicas
locals {
  # Si se especifican subnet_ids explícitamente, usarlas directamente (RECOMENDADO)
  # Si no, intentar buscar subnets con map_public_ip_on_launch = true
  available_subnets = length(var.subnet_ids) > 0 ? var.subnet_ids : [
    for subnet_id, subnet_data in data.aws_subnet.subnet_details : subnet_id
    if subnet_data.map_public_ip_on_launch == true
  ]
  
  # Usar las subnets especificadas o las detectadas
  # IMPORTANTE: Si no se especifican subnet_ids, asegúrate de que las subnets detectadas sean públicas
  subnet_1_id = length(local.available_subnets) > 0 ? local.available_subnets[0] : (
    length(tolist(data.aws_subnets.vpc_subnets.ids)) > 0 ? tolist(data.aws_subnets.vpc_subnets.ids)[0] : ""
  )
  
  subnet_2_id = length(local.available_subnets) > 1 ? local.available_subnets[1] : (
    length(tolist(data.aws_subnets.vpc_subnets.ids)) > 1 ? tolist(data.aws_subnets.vpc_subnets.ids)[1] : local.subnet_1_id
  )
  
  # Obtener el CIDR block de la VPC para los security groups
  vpc_cidr_block = data.aws_vpc.main.cidr_block
}

