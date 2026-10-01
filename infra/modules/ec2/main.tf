resource "aws_instance" "main" {
  ami                    = var.ami_id
  instance_type          = "t2.micro"
  subnet_id              = var.public_subnet_id
  vpc_security_group_ids = [var.sg_ec2_id]
  key_name               = var.key_name

  iam_instance_profile = "LabInstanceProfile"

  associate_public_ip_address = true

  tags = {
    Name    = "${var.project_name}-ec2"
    Project = var.project_name
  }
}