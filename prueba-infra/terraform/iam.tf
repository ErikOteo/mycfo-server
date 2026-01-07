# IAM Role para MyCFO1
resource "aws_iam_role" "mycfo1_role" {
  name = "mycfo1-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "mycfo1-role"
  }
}

# IAM Policy para MyCFO1 - Acceso a Secrets Manager
resource "aws_iam_role_policy" "mycfo1_secrets_policy" {
  name = "mycfo1-secrets-policy"
  role = aws_iam_role.mycfo1_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.mycfo1_secret.arn
        ]
      }
    ]
  })
}

# IAM Instance Profile para MyCFO1
resource "aws_iam_instance_profile" "mycfo1_profile" {
  name = "mycfo1-instance-profile"
  role = aws_iam_role.mycfo1_role.name
}

# IAM Role para MyCFO2
resource "aws_iam_role" "mycfo2_role" {
  name = "mycfo2-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "mycfo2-role"
  }
}

# IAM Policy para MyCFO2 - Acceso a Secrets Manager
resource "aws_iam_role_policy" "mycfo2_secrets_policy" {
  name = "mycfo2-secrets-policy"
  role = aws_iam_role.mycfo2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.mycfo2_secret.arn
        ]
      }
    ]
  })
}

# IAM Instance Profile para MyCFO2
resource "aws_iam_instance_profile" "mycfo2_profile" {
  name = "mycfo2-instance-profile"
  role = aws_iam_role.mycfo2_role.name
}

