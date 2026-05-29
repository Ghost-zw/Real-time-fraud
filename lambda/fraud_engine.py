def calculate_fraud_score(
    amount,
    user_transactions
):

    risk_score = 0
    reasons = []

    # ==================
    # HIGH AMOUNT
    # ==================
    if amount >= 1000:

        risk_score += 40

        reasons.append(
            "High transaction amount"
        )

    # ==================
    # VELOCITY CHECK
    # ==================
    if (
        len(
            user_transactions
        ) >= 5
    ):

        risk_score += 30

        reasons.append(
            "High transaction velocity"
        )

    return {
        "risk_score":
        risk_score,

        "reasons":
        reasons
    }