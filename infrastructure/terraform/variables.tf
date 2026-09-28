variable "aws_region" {
  description = "AWS region for provisioning resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name (dev, staging, prod)"
  type        = string
  default     = "production"
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table for CloudTask tasks"
  type        = string
  default     = "CloudTasks"
}

variable "s3_bucket_prefix" {
  description = "Prefix for S3 bucket holding attachments"
  type        = string
  default     = "cloud-task-manager-attachments"
}
