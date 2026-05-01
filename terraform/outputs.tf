output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.fraud_handler.function_name
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.transactions.name
}

output "sns_topic_arn" {
  description = "SNS topic ARN"
  value       = aws_sns_topic.fraud_alerts.arn
}