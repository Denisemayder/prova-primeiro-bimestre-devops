terraform {
  backend "s3" {
    bucket         = "technova-tf-state-c7b52404"
    key            = "technova/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "technova-terraform-locks"
    encrypt        = true
  }
}
