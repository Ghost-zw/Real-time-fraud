import boto3

cloudwatch = boto3.client(
    "cloudwatch"
)

NAMESPACE = "FraudGuard"


def publish_metric(
    metric_name,
    value=1,
    unit="Count"
):
    publish_metrics([
        {
            "MetricName": metric_name,
            "Value": value,
            "Unit": unit
        }
    ])


def publish_metrics(metrics):
    cloudwatch.put_metric_data(
        Namespace=NAMESPACE,
        MetricData=metrics
    )