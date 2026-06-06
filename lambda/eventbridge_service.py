import json
import os
import boto3


eventbridge = boto3.client(
    "events"
)

EVENT_BUS_NAME = os.environ.get(
    "EVENT_BUS_NAME"
)


def publish_post_decision_event(
    event
):

    if not EVENT_BUS_NAME:
        return

    eventbridge.put_events(
        Entries=[
            {
                "Source":
                "fraudguard.transactions",

                "DetailType":
                "TransactionDecided",

                "EventBusName":
                EVENT_BUS_NAME,

                "Detail":
                json.dumps(
                    event
                )
            }
        ]
    )