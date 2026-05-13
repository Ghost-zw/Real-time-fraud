import json
import os
import boto3
from datetime import datetime, timezone, timedelta
from boto3.dynamodb.conditions import Key

def log_event(event_type, details):
    log = {
        "event_type": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **details
    }

    print(json.dumps(log))

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

table = dynamodb.Table(os.environ['TABLE_NAME'])
topic_arn = os.environ['SNS_TOPIC']

def lambda_handler(event, context):
    try:
        log_event("api_request_received", {
            "raw_event": event
            })
        headers = event.get("headers") or {}

        log_event("headers_received", {
                    "headers": headers
                })

        incoming_api_key = (
            headers.get("x-api-key")
            or headers.get("X-API-Key")
        )

        expected_api_key = os.environ.get("API_KEY")

        if incoming_api_key != expected_api_key:
            log_event("authentication_failed", {
                    "provided_api_key": incoming_api_key
                })

            return {
                "statusCode": 401,
                "body": json.dumps({
                    "status": "error",
                    "message": "Unauthorized"
                })
            }
        
        # Get HTTP method
                
        http_method = (
            event.get("requestContext", {})
            .get("http", {})
            .get("method")
        )

        # -------------------------
        # GET /transactions
        # -------------------------
        if http_method == "GET":

            log_event("transactions_fetch_requested", {})

            response = table.scan()

            items = response.get("Items", [])

            # newest first
            items.sort(
                key=lambda x: x.get("timestamp", ""),
                reverse=True
            )

            log_event("transactions_returned", {
                "count": len(items)
            })

            return {
                "statusCode": 200,
                "body": json.dumps({
                    "status": "success",
                    "count": len(items),
                    "transactions": items
                })
            }

        # ✅ Safe body extraction
        body = event.get("body", {})

        if isinstance(body, str):
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                raise Exception("Invalid JSON in request body")

        log_event("transaction_received", {
            "transaction_id": body.get("transaction_id"),
            "user_id": body.get("user_id"),
            "amount": body.get("amount")
        })

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

        log_event("historical_transactions_loaded", {
            "user_id": user_id,
            "count": len(previous_transactions)
        })

        for txn in previous_transactions:

            txn_timestamp = txn.get("timestamp")

            if txn_timestamp:
                txn_time = datetime.fromisoformat(
                    txn_timestamp.replace("Z", "+00:00")
                )

                if txn_time >= window_start:
                    recent_transactions.append(txn)

        log_event("velocity_check", {
            "user_id": user_id,
            "recent_transaction_count": len(recent_transactions)
        })

        # Calculate average historical spend
        historical_amounts = []

        for txn in previous_transactions:

            amount_value = txn.get("amount")

            if amount_value is not None:
                historical_amounts.append(float(amount_value))

        average_spend = 0

        if historical_amounts:
            average_spend = sum(historical_amounts) / len(historical_amounts)

        log_event("behavioral_baseline", {
            "user_id": user_id,
            "average_spend": average_spend
        })

        # Fraud logic
        
        risk_score = 0
        reasons = []

        if amount > 1000:
            risk_score += 70
            reasons.append("High transaction amount")

        # Velocity Scoring
        if len(recent_transactions) >= 5:
            risk_score += 40
            reasons.append("Velocity threshold exceeded")

        # Behavioral baseline scoring
        if average_spend > 0:

            if amount > average_spend * 5:
                risk_score += 50
                reasons.append("Behavioral spending anomaly detected")
                print("BEHAVIORAL ANOMALY DETECTED")

        

        if risk_score > 60:
            decision = "BLOCKED"
        elif risk_score > 30:
            decision = "FLAGGED"
        else:
            decision = "APPROVED"
        
        log_event("fraud_evaluated", {
                "transaction_id": transaction_id,
                "user_id": user_id,
                "decision": decision,
                "risk_score": risk_score,
                "reasons": reasons
            })

        item = {
            "transaction_id": transaction_id,
            "user_id": body.get("user_id", "unknown"),
            "amount": amount,
            "decision": decision,
            "risk_score": risk_score,
            "reasons": reasons,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        log_event("transaction_saved", {
            "transaction_id": transaction_id,
            "decision": decision
        })

        table.put_item(Item=item)

#  Send alert for suspicious/fraud transactions

        if decision in ["FLAGGED", "BLOCKED"]:

            log_event("fraud_alert_sent", {
                "transaction_id": transaction_id,
                "decision": decision
            })
                        
            sns.publish(
                TopicArn=topic_arn,
                Subject="Fraud Alert",
                Message=json.dumps({
                    "transaction_id": transaction_id,
                    "user_id": body.get("user_id"),
                    "amount": amount,
                    "decision": decision,
                    "risk_score": risk_score,
                    "reasons": reasons
                })
            )


        return {
            "statusCode": 200,
            "body": json.dumps({
                "status": "success",
                "message": "Transaction processed successfully",
                "data": item
    })
}

    except Exception as e:
        log_event("error_occurred", {
                "error": str(e)
            })
        return {
            "statusCode": 500,
            "body": json.dumps({
                "status": "error",
                "message": str(e)
            })
        }
    