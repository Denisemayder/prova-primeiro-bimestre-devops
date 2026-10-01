variable "project_name" {
  description = "Nome do projeto"
  type        = string
  default     = "technova"
}

variable "vpc_cidr" {
  description = "CIDR da VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDRs das subnets publicas"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDRs das subnets privadas"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "availability_zones" {
  description = "Zonas de disponibilidade utilizadas"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "ami_id" {
  description = "ID da AMI utilizada pela instancia EC2"
  type        = string
}

variable "key_name" {
  description = "Nome da Key Pair utilizada para acesso SSH"
  type        = string
}

variable "db_name" {
  description = "Nome do banco de dados PostgreSQL"
  type        = string
  default     = "technova"
}

variable "db_user" {
  description = "Usuario do PostgreSQL"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Senha do PostgreSQL"
  type        = string
  sensitive   = true
}