def calculate_fraud_score(
    amount,
    recent_transactions,
    average_spend
):

    risk_score = 0
    reasons = []

    # ==========================
    # TRANSACTION AMOUNT
    # ==========================
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

    # ==========================
    # VELOCITY ATTACK
    # ==========================
    if (
        len(
            recent_transactions
        ) >= 5
    ):

        risk_score += 35

        reasons.append(
            "Velocity threshold exceeded"
        )

    # ==========================
    # BEHAVIOR ANOMALY
    # ==========================
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

    return {
        "risk_score":
        risk_score,

        "reasons":
        reasons
    }