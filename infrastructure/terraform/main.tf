terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "random_id" "suffix" {
  byte_length = 4
}

# ==============================================================================
# Amazon DynamoDB Table: CloudTasks
# ==============================================================================
resource "aws_dynamodb_table" "tasks" {
  name         = "${var.dynamodb_table_name}-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Project     = "CloudTaskManager"
    Environment = var.environment
  }
}

# ==============================================================================
# Amazon S3 Bucket: Attachment Storage with CORS
# ==============================================================================
resource "aws_s3_bucket" "attachments" {
  bucket        = "${var.s3_bucket_prefix}-${random_id.suffix.hex}"
  force_destroy = false

  tags = {
    Project     = "CloudTaskManager"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "attachments_encryption" {
  bucket = aws_s3_bucket.attachments.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "attachments_access" {
  bucket = aws_s3_bucket.attachments.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "attachments_cors" {
  bucket = aws_s3_bucket.attachments.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# ==============================================================================
# IAM Policy: Least-Privilege Execution Policy
# ==============================================================================
resource "aws_iam_policy" "task_manager_policy" {
  name        = "CloudTaskManagerPolicy-${var.environment}"
  description = "IAM policy for Cloud Task Manager App Runner or ECS execution"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:DescribeTable"
        ]
        Resource = aws_dynamodb_table.tasks.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:AbortMultipartUpload"
        ]
        Resource = "${aws_s3_bucket.attachments.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.attachments.arn
      }
    ]
  })
}
