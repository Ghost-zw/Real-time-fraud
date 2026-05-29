def determine_decision(
    risk_score
):

    if (
        risk_score >= 86
    ):

        return (
            "DECLINED"
        )

    elif (
        risk_score >= 71
    ):

        return (
            "UNDER_REVIEW"
        )

    elif (
        risk_score >= 31
    ):

        return (
            "VERIFICATION_REQUIRED"
        )

    return "APPROVED"