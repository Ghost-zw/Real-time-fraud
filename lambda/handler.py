import json
import os
import boto3
from datetime import datetime, timezone
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

table = dynamodb.Table(os.environ['TABLE_NAME'])
topic_arn = os.environ['SNS_TOPIC']

def lambda_handler(event, context):
    try:
        print("RAW EVENT:", json.dumps(event))

        # ✅ Safe body extraction
        body = event.get("body", {})

        if isinstance(body, str):
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                raise Exception("Invalid JSON in request body")

        print("PARSED BODY:", body)

        # ✅ Strong validation
        transaction_id = body.get("transaction_id")
        if not transaction_id:
            raise Exception("transaction_id is required")

        amount = body.get("amount", 0)

        user_id = body.get("user_id", "unknown")

        # Query user transaction history
        response = table.query(
            IndexName="user_id-index",
            KeyConditionExpression=Key("user_id").eq(user_id)
        )

        previous_transactions = response.get("Items", [])

        print("PREVIOUS TRANSACTIONS:", len(previous_transactions))

        # Fraud logic
        risk_score = 0
        if amount > 1000:
            risk_score += 70

        if len(previous_transactions) >= 5:
            risk_score += 40

        if risk_score > 60:
            decision = "BLOCKED"
        elif risk_score > 30:
            decision = "FLAGGED"
        else:
            decision = "APPROVED"

        item = {
            "transaction_id": transaction_id,
            "user_id": body.get("user_id", "unknown"),
            "amount": amount,
            "decision": decision,
            "risk_score": risk_score,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        print("ITEM TO SAVE:", item)

        table.put_item(Item=item)

#  Send alert for suspicious/fraud transactions

        if decision != "Approved":
            sns.publish(
                TopicArn=topic_arn,
                Subject="Fraud Alert",
                Message=json.dumps({
                    "transaction_id": transaction_id,
                    "user_id": body.get("user_id"),
                    "amount": amount,
                    "decision": decision,
                    "risk_score": risk_score
                })
            )


        return {
            "statusCode": 200,
            "body": json.dumps(item)
        }

    except Exception as e:
        print("ERROR:", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
    