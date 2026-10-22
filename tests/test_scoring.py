from strain_check.scoring import PostureInput, score_reba, score_rula


def test_neutral_posture_is_low_risk() -> None:
    posture = PostureInput(10, 90, 10, 5, 5)
    assert score_rula(posture).risk_level == "low"
    assert score_reba(posture).risk_level in {"negligible", "low"}


def test_missing_required_input_is_explicit() -> None:
    posture = PostureInput(10, 90, 10, None, 5)
    result = score_rula(posture)
    assert result.score is None
    assert result.risk_level == "insufficient_data"
    assert result.missing_inputs == ("trunk_angle",)


def test_extreme_posture_scores_higher_than_neutral() -> None:
    neutral = PostureInput(10, 90, 10, 5, 5)
    extreme = PostureInput(100, 150, 80, 70, 50, load_kg=12, repetition_count=20)
    assert score_reba(extreme).score > score_reba(neutral).score
