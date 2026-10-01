output "rds_endpoint" {
  description = "Endpoint do RDS PostgreSQL"
  value       = aws_db_instance.main.endpoint
}

output "rds_address" {
  description = "Endereco do RDS PostgreSQL"
  value       = aws_db_instance.main.address
}