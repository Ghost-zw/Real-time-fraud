terraform {
  backend "s3" {
    bucket         = "fraud-detection-tf-state-dev"
    key            = "mvp/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "fraud-terraform-locks"
    encrypt        = true
  }
}

