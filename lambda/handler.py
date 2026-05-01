import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

table = dynamodb.Table(os.environ['TABLE_NAME'])
topic_arn = os.environ['SNS_TOPIC']

def lambda_handler(event, context):
    body = json.loads(event['body'])

    amount = body.get('amount', 0)
    risk_score = 0

    if amount > 1000:
        risk_score += 70

    
    if risk_score > 60:
        decision = "Blocked"
    
    elif risk_score > 30:
        decision = "FLAGGED"

    else:
        decision = "APPROVED"

    
    item = {
        "tracnsaction_id": body["transaction_id"],
        "user_id": body["user_id"],
        "amount": amount,
        "decision": decision,
        "risk_score": risk_score
    }

    table.put_item(Item=item)

    if decision != "APPROVED":
        sns.publish(
            TopicArn=topic_arn,
            Message=f"Fraud Alert: {item}"
        )

    return {
        "statusCode": 200,
        "body": json.dumps(item)
    }