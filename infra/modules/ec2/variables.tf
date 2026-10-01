variable "project_name" {
  description = "Nome do projeto"
  type        = string
}

variable "ami_id" {
  description = "ID da AMI utilizada pela instancia EC2"
  type        = string
}

variable "public_subnet_id" {
  description = "ID da subnet publica onde a EC2 sera criada"
  type        = string
}

variable "sg_ec2_id" {
  description = "ID do Security Group da EC2"
  type        = string
}

variable "key_name" {
  description = "Nome da Key Pair utilizada para acesso SSH"
  type        = string
}