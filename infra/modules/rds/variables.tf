variable "project_name" {
  description = "Nome do projeto"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs das subnets privadas onde o RDS sera criado"
  type        = list(string)
}

variable "sg_rds_id" {
  description = "ID do Security Group do RDS"
  type        = string
}

variable "db_name" {
  description = "Nome do banco de dados"
  type        = string
}

variable "db_user" {
  description = "Usuario do banco de dados"
  type        = string
}

variable "db_password" {
  description = "Senha do banco de dados"
  type        = string
  sensitive   = true
}