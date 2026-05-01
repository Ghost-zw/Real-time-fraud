import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

table = dynamodb.Table(os.environ['TABLE_NAME'])
topic_arn = os.environ['SNS_TOPIC']

def lambda_handler(event, context):
    try:
        print("RAW EVENT:", json.dumps(event))

        # 🔥 Proper body extraction
        body = event.get("body")

        if isinstance(body, str):
            body = json.loads(body)

        if body is None:
            body = {}

        print("PARSED BODY:", body)

        # Validate required field
        if "transaction_id" not in body:
            raise Exception("transaction_id is required")

        amount = body.get("amount", 0)

        risk_score = 0
        if amount > 1000:
            risk_score += 70

        if risk_score > 60:
            decision = "BLOCKED"
        elif risk_score > 30:
            decision = "FLAGGED"
        else:
            decision = "APPROVED"

        item = {
            "transaction_id": body["transaction_id"],  # no fallback now
            "user_id": body.get("user_id", "unknown"),
            "amount": amount,
            "decision": decision,
            "risk_score": risk_score
        }

        table.put_item(Item=item)

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
    
    # testing