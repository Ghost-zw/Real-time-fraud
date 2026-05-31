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

    cloudwatch.put_metric_data(
        Namespace=NAMESPACE,

        MetricData=[
            {
                "MetricName":
                metric_name,

                "Value":
                value,

                "Unit":
                unit
            }
        ]
    )