import os
import boto3


sns = boto3.client(
    "sns"
)

SNS_TOPIC = os.environ.get(
    "SNS_TOPIC"
)


def send_fraud_alert(
    transaction_id,
    user_id,
    amount,
    decision,
    risk_score,
    reasons
):

    if decision not in [
        "UNDER_REVIEW",
        "DECLINED"
    ]:
        return

    message = f"""
Fraud Alert Triggered

Transaction ID:
{transaction_id}

User ID:
{user_id}

Amount:
${amount}

Decision:
{decision}

Risk Score:
{risk_score}

Reasons:
{', '.join(reasons)}
"""

    sns.publish(
        TopicArn=
        SNS_TOPIC,

        Subject=
        "FraudGuard Alert",

        Message=
        message
    )