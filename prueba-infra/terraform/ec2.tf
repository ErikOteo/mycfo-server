# Key Pair (puedes crear uno manualmente o usar uno existente)
# resource "aws_key_pair" "mycfo_key" {
#   key_name   = "mycfo-key"
#   public_key = file("~/.ssh/id_rsa.pub")
# }

# EC2 Instance para MyCFO1 - debe crearse después de MyCFO2
resource "aws_instance" "mycfo1" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  subnet_id              = local.subnet_1_id
  vpc_security_group_ids = [aws_security_group.mycfo1_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.mycfo1_profile.name
  associate_public_ip_address = true

  user_data = templatefile("${path.module}/scripts/mycfo1-init.sh", {
    mycfo2_url       = aws_instance.mycfo2.private_ip
    app_test_env_var = var.app_test_env_var
    aws_region       = var.aws_region
    secret_name      = aws_secretsmanager_secret.mycfo1_secret.name
  })

  depends_on = [aws_instance.mycfo2]

  tags = {
    Name = "mycfo1-instance"
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 30
    encrypted   = true
  }
}

# EC2 Instance para MyCFO2 - debe crearse antes de MyCFO1
resource "aws_instance" "mycfo2" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  subnet_id              = local.subnet_2_id
  vpc_security_group_ids = [aws_security_group.mycfo2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.mycfo2_profile.name
  associate_public_ip_address = true

  user_data = templatefile("${path.module}/scripts/mycfo2-init.sh", {
    aws_region  = var.aws_region
    secret_name = aws_secretsmanager_secret.mycfo2_secret.name
  })

  tags = {
    Name = "mycfo2-instance"
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 30
    encrypted   = true
  }
}

