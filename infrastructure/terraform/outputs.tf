output "dynamodb_table_name" {
  description = "Name of the DynamoDB tasks table"
  value       = aws_dynamodb_table.tasks.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB tasks table"
  value       = aws_dynamodb_table.tasks.arn
}

output "s3_bucket_name" {
  description = "Name of the S3 attachments bucket"
  value       = aws_s3_bucket.attachments.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 attachments bucket"
  value       = aws_s3_bucket.attachments.arn
}

output "iam_policy_arn" {
  description = "ARN of the IAM policy for application role"
  value       = aws_iam_policy.task_manager_policy.arn
}
