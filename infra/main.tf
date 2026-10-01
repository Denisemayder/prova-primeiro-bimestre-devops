module "vpc" {
  source = "./modules/vpc"

  project_name = var.project_name
  vpc_cidr     = var.vpc_cidr

  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
}

module "security_group" {
  source = "./modules/security-group"

  project_name = var.project_name
  vpc_id       = module.vpc.vpc_id
}

module "rds" {
  source = "./modules/rds"

  project_name       = var.project_name
  private_subnet_ids = module.vpc.private_subnet_ids
  sg_rds_id          = module.security_group.sg_rds_id

  db_name     = var.db_name
  db_user     = var.db_user
  db_password = var.db_password
}

module "ec2" {
  source = "./modules/ec2"

  project_name     = var.project_name
  ami_id           = var.ami_id
  public_subnet_id = module.vpc.public_subnet_ids[0]
  sg_ec2_id        = module.security_group.sg_ec2_id
  key_name         = var.key_name
}