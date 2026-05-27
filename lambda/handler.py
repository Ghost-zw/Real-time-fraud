from decimal import Decimal
import json
import os
import boto3

from datetime import (
    datetime,
    timezone,
    timedelta
)

from boto3.dynamodb.conditions import Key


# ==================================
# LOGGING
# ==================================
def log_event(
    event_type,
    details
):
    log = {
        "event_type":
        event_type,

        "timestamp":
        datetime.now(
            timezone.utc
        ).isoformat(),

        **details
    }

    print(
        json.dumps(log)
    )


# ==================================
# DECIMAL SERIALIZER
# ==================================
def decimal_default(obj):
    if isinstance(
        obj,
        Decimal
    ):
        return float(obj)

    raise TypeError(
        f"Object of type {type(obj)} "
        "is not JSON serializable"
    )


# ==================================
# AWS CLIENTS
# ==================================
dynamodb = boto3.resource(
    "dynamodb"
)

sns = boto3.client(
    "sns"
)

table = dynamodb.Table(
    os.environ[
        "TABLE_NAME"
    ]
)

topic_arn = os.environ[
    "SNS_TOPIC"
]


# ==================================
# MAIN HANDLER
# ==================================
def lambda_handler(
    event,
    context
):

    try:

        log_event(
            "api_request_received",
            {
                "raw_event":
                event
            }
        )

        # ==========================
        # AUTH
        # ==========================
        headers = (
            event.get(
                "headers"
            )
            or {}
        )

        incoming_api_key = (
            headers.get(
                "x-api-key"
            )
            or headers.get(
                "X-API-Key"
            )
        )

        expected_api_key = (
            os.environ.get(
                "API_KEY"
            )
        )

        if (
            incoming_api_key
            != expected_api_key
        ):

            log_event(
                "authentication_failed",
                {
                    "provided_api_key":
                    incoming_api_key
                }
            )

            return {
                "statusCode":
                401,

                "body":
                json.dumps({
                    "status":
                    "error",

                    "message":
                    "Unauthorized"
                })
            }

        # ==========================
        # METHOD + PATH
        # ==========================
        http_method = (
            event.get(
                "requestContext",
                {}
            )
            .get(
                "http",
                {}
            )
            .get(
                "method"
            )
            or event.get(
                "httpMethod"
            )
        )

        path = (
            event.get(
                "requestContext",
                {}
            )
            .get(
                "http",
                {}
            )
            .get(
                "path"
            )
            or event.get(
                "rawPath"
            )
            or event.get(
                "path"
            )
        )

        log_event(
            "route_detected",
            {
                "method":
                http_method,

                "path":
                path
            }
        )

        # ==================================
        # GET /transactions
        # ==================================
        if (
            http_method
            == "GET"
        ):

            response = (
                table.scan()
            )

            items = (
                response.get(
                    "Items",
                    []
                )
            )

            items.sort(
                key=lambda x:
                x.get(
                    "timestamp",
                    ""
                ),
                reverse=True
            )

            return {
                "statusCode":
                200,

                "body":
                json.dumps(
                    {
                        "status":
                        "success",

                        "count":
                        len(items),

                        "transactions":
                        items
                    },

                    default=
                    decimal_default
                )
            }

        # ==================================
        # POST /transaction-action
        # ==================================
        if (
            http_method
            == "POST"
            and "transaction-action"
            in str(path)
        ):

            body = (
                event.get(
                    "body"
                )
                or {}
            )

            if isinstance(
                body,
                str
            ):
                body = json.loads(
                    body
                )

            transaction_id = (
                body.get(
                    "transaction_id"
                )
            )

            action = (
                body.get(
                    "action"
                )
            )

            if not transaction_id:
                raise Exception(
                    "transaction_id is required"
                )

            if not action:
                raise Exception(
                    "action is required"
                )

            update_expression = []
            expression_values = {}

            # ==========================
            # ACTION LOGIC
            # ==========================
            if action == "APPROVE":

                update_expression.append(
                    "decision = :decision"
                )

                expression_values[
                    ":decision"
                ] = (
                    "MANUALLY_APPROVED"
                )

            elif action == "FREEZE":

                update_expression.append(
                    "account_status = :status"
                )

                expression_values[
                    ":status"
                ] = (
                    "FROZEN"
                )

            elif action == "UNFREEZE":

                update_expression.append(
                    "account_status = :status"
                )

                expression_values[
                    ":status"
                ] = (
                    "ACTIVE"
                )

            else:
                raise Exception(
                    "Invalid action"
                )

            # ==========================
            # AUDIT TRAIL
            # ==========================
            update_expression.extend([
                "review_status = :review_status",
                "reviewed_by = :reviewed_by",
                "reviewed_at = :reviewed_at",
                "action_taken = :action"
            ])

            expression_values[
                ":review_status"
            ] = "RESOLVED"

            expression_values[
                ":reviewed_by"
            ] = "fraud_analyst"

            expression_values[
                ":reviewed_at"
            ] = (
                datetime.now(
                    timezone.utc
                ).isoformat()
            )

            expression_values[
                ":action"
            ] = action

            # ==========================
            # UPDATE DYNAMODB
            # ==========================
            response = (
                table.update_item(
                    Key={
                        "transaction_id":
                        transaction_id
                    },

                    UpdateExpression=
                    "SET "
                    + ", ".join(
                        update_expression
                    ),

                    ExpressionAttributeValues=
                    expression_values,

                    ReturnValues=
                    "ALL_NEW"
                )
            )

            return {
                "statusCode":
                200,

                "body":
                json.dumps(
                    {
                        "status":
                        "success",

                        "message":
                        f"{action} successful",

                        "updated_item":
                        response.get(
                            "Attributes",
                            {}
                        )
                    },
                    default=
                    decimal_default
                )
            }

        # ==================================
        # EXISTING FRAUD ENGINE
        # ==================================
        body = (
            event.get(
                "body"
            )
            or {}
        )

        if (
            body
            and isinstance(
                body,
                str
            )
        ):
            body = json.loads(
                body
            )

        transaction_id = (
            body.get(
                "transaction_id"
            )
        )

        if not transaction_id:
            raise Exception(
                "transaction_id is required"
            )

        user_id = (
            body.get(
                "user_id",
                "unknown"
            )
        )

        amount = (
            body.get(
                "amount",
                0
            )
        )

        # ==========================
        # USER HISTORY
        # ==========================
        response = (
            table.query(
                IndexName=
                "user_id-index",

                KeyConditionExpression=
                Key(
                    "user_id"
                ).eq(
                    user_id
                )
            )
        )

        previous_transactions = (
            response.get(
                "Items",
                []
            )
        )

        now = datetime.now(
            timezone.utc
        )

        window_start = (
            now
            - timedelta(
                seconds=60
            )
        )

        recent_transactions = []

        for txn in (
            previous_transactions
        ):

            txn_timestamp = (
                txn.get(
                    "timestamp"
                )
            )

            if txn_timestamp:

                txn_time = (
                    datetime.fromisoformat(
                        txn_timestamp.replace(
                            "Z",
                            "+00:00"
                        )
                    )
                )

                if (
                    txn_time
                    >=
                    window_start
                ):
                    recent_transactions.append(
                        txn
                    )

        historical_amounts = []

        for txn in (
            previous_transactions
        ):

            amount_value = (
                txn.get(
                    "amount"
                )
            )

            if (
                amount_value
                is not None
            ):
                historical_amounts.append(
                    float(
                        amount_value
                    )
                )

        average_spend = 0

        if (
            historical_amounts
        ):
            average_spend = (
                sum(
                    historical_amounts
                )
                /
                len(
                    historical_amounts
                )
            )

        # ==========================
        # RISK SCORING ENGINE
        # ==========================
        risk_score = 0
        reasons = []

        # --------------------------
        # Transaction amount
        # --------------------------
        if amount > 10000:

            risk_score += 90
            reasons.append(
                "Extremely high amount"
            )

        elif amount > 5000:

            risk_score += 70
            reasons.append(
                "Very high amount"
            )

        elif amount > 1000:

            risk_score += 40
            reasons.append(
                "High transaction amount"
            )

        # --------------------------
        # Velocity attack
        # --------------------------
        if len(recent_transactions) >= 5:

            risk_score += 35

            reasons.append(
                "Velocity threshold exceeded"
            )

        # --------------------------
        # Behavioral anomaly
        # --------------------------
        if (
            average_spend > 0
            and amount >
            average_spend * 5
        ):

            risk_score += 30

            reasons.append(
                "Behavior anomaly"
            )

        # cap score
        risk_score = min(
            risk_score,
            100
        )

        # ==========================
        # DECISION ENGINE
        # ==========================
        if risk_score <= 30:

            decision = (
                "APPROVED"
            )

        elif risk_score <= 70:

            decision = (
                "VERIFICATION_REQUIRED"
            )

        elif risk_score <= 85:

            decision = (
                "UNDER_REVIEW"
            )

        else:

            decision = (
                "DECLINED"
            )

        item = {
            "transaction_id":
            transaction_id,

            "user_id":
            user_id,

            "amount":
            amount,

            "decision":
            decision,

            "risk_score":
            risk_score,

            "reasons":
            reasons,

            "timestamp":
            datetime.now(
                timezone.utc
            ).isoformat()
        }

        table.put_item(
            Item=item
        )

        # ==========================
        # SNS ALERTS
        # ==========================
        if decision in [
            "UNDER_REVIEW",
            "DECLINED"
        ]:

            sns.publish(
                TopicArn=
                topic_arn,

                Subject=
                "Fraud Alert",

                Message=
                json.dumps({
                    "transaction_id":
                    transaction_id,

                    "user_id":
                    user_id,

                    "amount":
                    amount,

                    "decision":
                    decision,

                    "risk_score":
                    risk_score,

                    "reasons":
                    reasons
                })
            )

        return {
            "statusCode":
            200,

            "body":
            json.dumps({
                "status":
                "success",

                "message":
                "Transaction processed successfully",

                "data":
                item
            })
        }

    except Exception as e:

        log_event(
            "error_occurred",
            {
                "error":
                str(e)
            }
        )

        return {
            "statusCode":
            500,

            "body":
            json.dumps({
                "status":
                "error",

                "message":
                str(e)
            })
        }