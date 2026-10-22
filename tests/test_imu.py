from pathlib import Path

from strain_check.imu import (
    ImuSample,
    apply_frequency_modifier,
    estimate_repetitions,
    load_imu_csv,
)
from strain_check.scoring import PostureInput, score_reba


def test_estimate_repetitions_detects_separated_peaks() -> None:
    values = [0.0, 2.0, 0.0, 0.0, 2.0, 0.0, 0.0, 2.0, 0.0]
    samples = [ImuSample(index * 0.5, value, 0.0, 0.0) for index, value in enumerate(values)]
    estimate = estimate_repetitions(samples, minimum_peak_distance_seconds=0.4, minimum_prominence=0.5)
    assert estimate.peak_indices == (1, 4, 7)
    assert estimate.repetitions_per_minute > 0


def test_load_imu_csv_reads_standard_columns() -> None:
    samples = load_imu_csv(Path("tests/fixtures/imu.csv"))
    assert len(samples) == 5
    assert samples[0].timestamp_seconds == 0


def test_frequency_modifier_increases_high_repetition_score() -> None:
    score = score_reba(PostureInput(50, 90, 30, 25, 20))
    adjusted = apply_frequency_modifier(score, 45)
    assert adjusted.score == score.score + 1
    assert adjusted.components["frequency_modifier"] == 1
