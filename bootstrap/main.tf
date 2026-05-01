provider "aws" {
  region = "us-east-1"
}

# S3 Bucket for terraform
resource "aws_s3_bucket" "tf_state" {
  bucket = "fraud-detection-tf-state-dev" 
}

resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.tf_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "block" {
  bucket = aws_s3_bucket.tf_state.id

  block_public_acls   = true
  block_public_policy = true
  restrict_public_buckets = true
}

#DynamoDB table for locking
resource "aws_dynamodb_table" "tf_lock" {
  name = "fraud-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}