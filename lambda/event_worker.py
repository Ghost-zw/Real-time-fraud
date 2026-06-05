import json

from audit_service import (
    log_event
)

from metrics_service import (
    publish_metric
)


def lambda_handler(
    event,
    context
):

    for record in event.get(
        "Records",
        []
    ):

        message = json.loads(
            record[
                "body"
            ]
        )

        log_event(
            "sqs_event_received",
            {
                "message":
                message
            }
        )

        publish_metric(
            "SqsEventProcessed"
        )

    return {
        "statusCode":
        200,

        "body":
        json.dumps({
            "status":
            "success",

            "message":
            "SQS events processed"
        })
    }