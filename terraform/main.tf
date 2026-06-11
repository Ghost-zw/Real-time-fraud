provider "aws" {
  region = var.aws_region
}


resource "aws_dynamodb_table" "transactions" {
  name         = "${var.project_name}-${var.environment}-transactions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transaction_id"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  global_secondary_index {
    name            = "user_id-index"
    hash_key        = "user_id"
    projection_type = "ALL"
  }
}


resource "aws_sns_topic" "fraud_alerts" {
  name = "${var.project_name}-${var.environment}-alerts"
}

resource "aws_sns_topic_subscription" "alarm_email" {

  topic_arn = aws_sns_topic.fraud_alerts.arn

  protocol = "email"

  endpoint = "invinciblestechno@gmail.com"
}


# SNS policy
resource "aws_iam_role_policy_attachment" "lambda_sns" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSNSFullAccess"
}

resource "aws_lambda_function" "fraud_handler" {
  function_name = "${var.project_name}-${var.environment}-handler"
  runtime       = var.lambda_runtime
  handler       = var.lambda_handler
  role          = aws_iam_role.lambda_role.arn

  filename         = "../lambda/lambda.zip"
  source_code_hash = filebase64sha256("../lambda/lambda.zip")

  timeout      = var.lambda_timeout
  memory_size  = var.lambda_memory_size

 environment {
  variables = {
    TABLE_NAME = aws_dynamodb_table.transactions.name
    SNS_TOPIC  = aws_sns_topic.fraud_alerts.arn
    API_KEY    = var.api_key
    FRAUD_EVENTS_QUEUE_URL = aws_sqs_queue.fraud_events_queue.url
    EVENT_BUS_NAME = aws_cloudwatch_event_bus.fraud_events_bus.name
  }
}
  }


resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_apigatewayv2_api" "api" {
  name          = "fraud-detection-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [
      "http://localhost:3000",
      "https://real-time-fraud.vercel.app"
    ]

    allow_methods = [
      "GET",
      "POST",
      "OPTIONS"
    ]

    allow_headers = [
      "content-type",
      "x-api-key"
    ]

    expose_headers = ["*"]
    max_age         = 300
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.fraud_handler.invoke_arn
}

resource "aws_apigatewayv2_route" "route" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /transactions"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "get_transactions_route" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /transactions"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "transaction_action" {
  api_id = aws_apigatewayv2_api.api.id

  route_key ="POST /transaction-action"

  target ="integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {

    throttling_rate_limit = 100

    throttling_burst_limit = 200
  }
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fraud_handler.function_name
  principal     = "apigateway.amazonaws.com"
}

#lambda permissions
resource "aws_iam_policy" "dynamodb_policy" {
  name = "${var.project_name}-${var.environment}-dynamodb-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ]
        Resource = [
        aws_dynamodb_table.transactions.arn,
        "${aws_dynamodb_table.transactions.arn}/index/*"
      ]
      }
    ]
  })
}

resource "aws_iam_policy" "cloudwatch_metrics_policy" {
  name = "${var.project_name}-${var.environment}-cloudwatch-metrics-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_cloudwatch_metrics_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.cloudwatch_metrics_policy.arn
}

resource "aws_iam_role_policy_attachment" "attach_dynamodb_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.dynamodb_policy.arn
}

resource "aws_cloudwatch_metric_alarm" "duplicate_transaction_alarm" {

  alarm_name = "FraudGuard-DuplicateTransaction-Spike"

  comparison_operator = "GreaterThanThreshold"

  evaluation_periods = 1

  metric_name = "DuplicateTransaction"

  namespace = "FraudGuard"

  period = 300

  statistic = "Sum"

  threshold = 2

  alarm_description = "Duplicate transaction spike detected"

  alarm_actions = [
    aws_sns_topic.fraud_alerts.arn
  ]
}

resource "aws_cloudwatch_metric_alarm" "declined_alarm" {

  alarm_name = "FraudGuard-Declined-Spike"

  comparison_operator = "GreaterThanThreshold"

  evaluation_periods = 1

  metric_name = "DECLINED"

  namespace = "FraudGuard"

  period = 300

  statistic = "Sum"

  threshold = 20

  alarm_actions = [
    aws_sns_topic.fraud_alerts.arn
  ]
}

resource "aws_cloudwatch_metric_alarm" "freeze_alarm" {

  alarm_name =  "FraudGuard-Freeze-Spike"

  comparison_operator = "GreaterThanThreshold"

  evaluation_periods = 1

  metric_name = "FREEZE"

  namespace = "FraudGuard"

  period = 300

  statistic = "Sum"

  threshold = 5

  alarm_actions = [
    aws_sns_topic.fraud_alerts.arn
  ]
}

resource "aws_cloudwatch_metric_alarm" "no_transactions_alarm" {

  alarm_name = "FraudGuard-NoTransactions"

  comparison_operator = "LessThanThreshold"

  evaluation_periods = 2

  metric_name = "TransactionProcessed"

  namespace = "FraudGuard"

  period = 300

  statistic = "Sum"

  threshold = 1

  treat_missing_data = "breaching"

  alarm_actions = [
    aws_sns_topic.fraud_alerts.arn
  ]
}

resource "aws_cloudwatch_dashboard" "fraudguard_dashboard" {
  dashboard_name = "${var.project_name}-${var.environment}-operations-dashboard"

  dashboard_body = jsonencode({
    widgets = [

      # ==========================
      # FRAUD METRICS
      # ==========================
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          title  = "Fraud Transaction Volume"
          view   = "timeSeries"
          region = var.aws_region
          period = 300
          stat   = "Sum"

          metrics = [
            ["FraudGuard", "TransactionProcessed"],
            ["FraudGuard", "APPROVED"],
            ["FraudGuard", "VERIFICATION_REQUIRED"],
            ["FraudGuard", "UNDER_REVIEW"],
            ["FraudGuard", "DECLINED"]
          ]
        }
      },

      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          title  = "Risk Decision Snapshot"
          view   = "singleValue"
          region = var.aws_region
          period = 300
          stat   = "Sum"

          metrics = [
            ["FraudGuard", "APPROVED"],
            ["FraudGuard", "VERIFICATION_REQUIRED"],
            ["FraudGuard", "UNDER_REVIEW"],
            ["FraudGuard", "DECLINED"]
          ]
        }
      },

      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          title  = "Analyst Actions"
          view   = "timeSeries"
          region = var.aws_region
          period = 300
          stat   = "Sum"

          metrics = [
            ["FraudGuard", "AnalystAction"],
            ["FraudGuard", "APPROVE"],
            ["FraudGuard", "DECLINE"],
            ["FraudGuard", "FREEZE"],
            ["FraudGuard", "UNFREEZE"]
          ]
        }
      },

      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          title  = "Duplicate Transactions"
          view   = "timeSeries"
          region = var.aws_region
          period = 300
          stat   = "Sum"

          metrics = [
            ["FraudGuard", "DuplicateTransaction"]
          ]
        }
      },

      # ==========================
      # LAMBDA HEALTH
      # ==========================
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 8
        height = 6

        properties = {
          title  = "Lambda Invocations"
          view   = "timeSeries"
          region = var.aws_region
          period = 300
          stat   = "Sum"

          metrics = [
            [
              "AWS/Lambda",
              "Invocations",
              "FunctionName",
              aws_lambda_function.fraud_handler.function_name
            ]
          ]
        }
      },

      {
        type   = "metric"
        x      = 8
        y      = 12
        width  = 8
        height = 6

        properties = {
          title  = "Lambda Errors"
          view   = "timeSeries"
          region = var.aws_region
          period = 300
          stat   = "Sum"

          metrics = [
            [
              "AWS/Lambda",
              "Errors",
              "FunctionName",
              aws_lambda_function.fraud_handler.function_name
            ]
          ]
        }
      },

      {
        type   = "metric"
        x      = 16
        y      = 12
        width  = 8
        height = 6

        properties = {
          title  = "Lambda Duration"
          view   = "timeSeries"
          region = var.aws_region
          period = 300
          stat   = "Average"

          metrics = [
            [
              "AWS/Lambda",
              "Duration",
              "FunctionName",
              aws_lambda_function.fraud_handler.function_name
            ]
          ]
        }
      },

      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 8
        height = 6

        properties = {
          title  = "Lambda Throttles"
          view   = "timeSeries"
          region = var.aws_region
          period = 300
          stat   = "Sum"

          metrics = [
            [
              "AWS/Lambda",
              "Throttles",
              "FunctionName",
              aws_lambda_function.fraud_handler.function_name
            ]
          ]
        }
      },

      # ==========================
      # API GATEWAY HEALTH
      # ==========================
      {
        type   = "metric"
        x      = 8
        y      = 18
        width  = 8
        height = 6

        properties = {
          title  = "API Gateway 4XX Errors"
          view   = "timeSeries"
          region = var.aws_region
          period = 300
          stat   = "Sum"

          metrics = [
            [
              "AWS/ApiGateway",
              "4xx",
              "ApiId",
              aws_apigatewayv2_api.api.id
            ]
          ]
        }
      },

      {
        type   = "metric"
        x      = 16
        y      = 18
        width  = 8
        height = 6

        properties = {
          title  = "API Gateway 5XX Errors"
          view   = "timeSeries"
          region = var.aws_region
          period = 300
          stat   = "Sum"

          metrics = [
            [
              "AWS/ApiGateway",
              "5xx",
              "ApiId",
              aws_apigatewayv2_api.api.id
            ]
          ]
        }
      },

      # ==========================
      # ALARM STATUS
      # ==========================
      {
        type   = "alarm"
        x      = 0
        y      = 24
        width  = 24
        height = 6

        properties = {
          title = "FraudGuard Alarm Status"

          alarms = [
            aws_cloudwatch_metric_alarm.duplicate_transaction_alarm.arn
          ]
        }
      }
    ]
  })
}


      # ==========================
      # SQS QUEUE
      # ==========================
resource "aws_sqs_queue" "fraud_events_dlq" {
  name = "${var.project_name}-${var.environment}-fraud-events-dlq"

  message_retention_seconds = 1209600
}

resource "aws_sqs_queue" "fraud_events_queue" {
  name = "${var.project_name}-${var.environment}-fraud-events-queue"

  visibility_timeout_seconds = 60
  message_retention_seconds  = 345600

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.fraud_events_dlq.arn
    maxReceiveCount     = 3
  })
}

      # ==========================
      # SQS POLICY
      # ==========================

resource "aws_iam_policy" "sqs_policy" {
  name = "${var.project_name}-${var.environment}-sqs-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_sqs_queue.fraud_events_queue.arn,
          aws_sqs_queue.fraud_events_dlq.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_sqs_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.sqs_policy.arn
}

      # ==========================
      # Worker Lambda
      # ==========================

resource "aws_lambda_function" "fraud_event_worker" {
  function_name = "${var.project_name}-${var.environment}-event-worker"
  runtime       = var.lambda_runtime
  handler       = "event_worker.lambda_handler"
  role          = aws_iam_role.lambda_role.arn

  filename         = "../lambda/lambda.zip"
  source_code_hash = filebase64sha256("../lambda/lambda.zip")

  timeout     = 30
  memory_size = 128

  environment {
    variables = {
      API_KEY = var.api_key
    }
  }
}

      # ==========================
      # Connect lambda to SQS
      # ==========================
resource "aws_lambda_event_source_mapping" "fraud_events_mapping" {
  event_source_arn = aws_sqs_queue.fraud_events_queue.arn
  function_name    = aws_lambda_function.fraud_event_worker.arn

  batch_size = 10
  enabled    = true
}

      # ======================================
      # Eventbridge for Post - decision making
      # ======================================

resource "aws_cloudwatch_event_bus" "fraud_events_bus" {
  name = "${var.project_name}-${var.environment}-fraud-events-bus"
}

      # ======================================
      # Eventbridge policy
      # ======================================
resource "aws_iam_policy" "eventbridge_policy" {
  name = "${var.project_name}-${var.environment}-eventbridge-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = aws_cloudwatch_event_bus.fraud_events_bus.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_eventbridge_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.eventbridge_policy.arn
}


# ==============================
# EVENTBRIDGE RULE
# Route post-decision fraud events to SQS
# ==============================
resource "aws_cloudwatch_event_rule" "transaction_decided_rule" {
  name           = "${var.project_name}-${var.environment}-transaction-decided-rule"
  event_bus_name = aws_cloudwatch_event_bus.fraud_events_bus.name

  event_pattern = jsonencode({
    source = [
      "fraudguard.transactions"
    ]

    detail-type = [
      "TransactionDecided"
    ]
  })
}

      # ======================================
      # Eventbridge SQS Target
      # ======================================
resource "aws_cloudwatch_event_target" "transaction_decided_sqs_target" {
  rule           = aws_cloudwatch_event_rule.transaction_decided_rule.name
  event_bus_name = aws_cloudwatch_event_bus.fraud_events_bus.name
  target_id      = "SendTransactionDecidedToSQS"
  arn            = aws_sqs_queue.fraud_events_queue.arn
}


      # ================================================
      # Eventbridge permisisions to send messages to SQS
      # ================================================
resource "aws_sqs_queue_policy" "allow_eventbridge_to_sqs" {
  queue_url = aws_sqs_queue.fraud_events_queue.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "events.amazonaws.com"
        }

        Action = "sqs:SendMessage"

        Resource = aws_sqs_queue.fraud_events_queue.arn

        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.transaction_decided_rule.arn
          }
        }
      }
    ]
  })
}