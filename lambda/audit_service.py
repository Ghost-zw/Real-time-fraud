import json

from datetime import (
    datetime,
    timezone
)


SENSITIVE_HEADERS = [
    "x-api-key",
    "X-API-Key",
    "authorization",
    "Authorization"
]


def sanitize_event(event):

    safe_event = dict(event)

    headers = (
        safe_event.get("headers")
        or {}
    )

    for header in SENSITIVE_HEADERS:
        if header in headers:
            headers[header] = "***REDACTED***"

    safe_event["headers"] = headers

    multi_headers = (
        safe_event.get("multiValueHeaders")
        or {}
    )

    for header in SENSITIVE_HEADERS:
        if header in multi_headers:
            multi_headers[header] = [
                "***REDACTED***"
            ]

    safe_event[
        "multiValueHeaders"
    ] = multi_headers

    return safe_event


def log_event(
    event_type,
    details
):

    if (
        "raw_event"
        in details
    ):
        details[
            "raw_event"
        ] = sanitize_event(
            details[
                "raw_event"
            ]
        )

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