output "bucket_name" {
  description = "Nome do bucket S3 utilizado para o Terraform State"
  value       = aws_s3_bucket.tf_state.bucket
}

output "dynamodb_table_name" {
  description = "Nome da tabela DynamoDB utilizada para o Terraform State Lock"
  value       = aws_dynamodb_table.tf_lock.name
}