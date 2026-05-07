import json
import os
import boto3
from datetime import datetime, timezone, timedelta
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

table = dynamodb.Table(os.environ['TABLE_NAME'])
topic_arn = os.environ['SNS_TOPIC']

def lambda_handler(event, context):
    try:
        print("RAW EVENT:", json.dumps(event))

        headers = event.get("headers", {})

        incoming_api_key = headers.get("x-api-key")

        expected_api_key = os.environ.get("API_KEY")

        if incoming_api_key != expected_api_key:

            return {
                "statusCode": 401,
                "body": json.dumps({
                    "error": "Unauthorized"
                })
            }

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
        # Current UTC time
        now = datetime.now(timezone.utc)

        # Define sliding window
        window_start = now - timedelta(seconds=60)

        recent_transactions = []

        print("PREVIOUS TRANSACTIONS:", len(previous_transactions))

        for txn in previous_transactions:

            txn_timestamp = txn.get("timestamp")

            if txn_timestamp:
                txn_time = datetime.fromisoformat(
                    txn_timestamp.replace("Z", "+00:00")
                )

                if txn_time >= window_start:
                    recent_transactions.append(txn)

        print("RECENT TRANSACTIONS:", len(recent_transactions))

        # Calculate average historical spend
        historical_amounts = []

        for txn in previous_transactions:

            amount_value = txn.get("amount")

            if amount_value is not None:
                historical_amounts.append(float(amount_value))

        average_spend = 0

        if historical_amounts:
            average_spend = sum(historical_amounts) / len(historical_amounts)

        print("AVERAGE SPEND:", average_spend)

        # Fraud logic
        risk_score = 0
        if amount > 1000:
            risk_score += 70

        # Velocity Scoring
        if len(recent_transactions) >= 5:
            risk_score += 40

        # Behavioral baseline scoring
        if average_spend > 0:

            if amount > average_spend * 5:
                risk_score += 50

        print("BEHAVIORAL ANOMALY DETECTED")

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

        if decision in ["FLAGGED", "BLOCKED"]:
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
    