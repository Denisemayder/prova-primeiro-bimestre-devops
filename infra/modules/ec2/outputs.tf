output "ec2_public_ip" {
  description = "IP publico da instancia EC2"
  value       = aws_instance.main.public_ip
}

output "ec2_instance_id" {
  description = "ID da instancia EC2"
  value       = aws_instance.main.id
}