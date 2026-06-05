import json
import os
import boto3


sqs = boto3.client("sqs")

QUEUE_URL = os.environ.get(
    "FRAUD_EVENTS_QUEUE_URL"
)


def send_post_decision_event(event):

    if not QUEUE_URL:
        return

    sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=json.dumps(event)
    )