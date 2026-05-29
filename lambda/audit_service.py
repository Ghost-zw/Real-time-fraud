import json

from datetime import (
    datetime,
    timezone
)


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