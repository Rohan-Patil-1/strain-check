"""Phone accelerometer ingestion and repetition-frequency estimation."""

from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from pathlib import Path

from .scoring import RiskScore


@dataclass(frozen=True, slots=True)
class ImuSample:
    """One accelerometer sample in seconds and device units."""

    timestamp_seconds: float
    ax: float
    ay: float
    az: float


@dataclass(frozen=True, slots=True)
class RepetitionEstimate:
    """Estimated repetition peaks from an accelerometer signal."""

    sample_count: int
    duration_seconds: float
    peak_indices: tuple[int, ...]
    repetitions_per_minute: float
    method: str = "vertical-acceleration-local-peaks"


def load_imu_csv(path: Path) -> list[ImuSample]:
    """Load a CSV with timestamp/time and ax, ay, az columns."""
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise ValueError("IMU CSV must have a header row")
        fields = {field.strip().lower(): field for field in reader.fieldnames}
        timestamp_field = fields.get("timestamp") or fields.get("time")
        required = [timestamp_field, fields.get("ax"), fields.get("ay"), fields.get("az")]
        if any(field is None for field in required):
            raise ValueError("IMU CSV needs timestamp/time, ax, ay, and az columns")

        samples: list[ImuSample] = []
        for row_number, row in enumerate(reader, start=2):
            try:
                samples.append(
                    ImuSample(
                        float(row[required[0]]),  # type: ignore[index]
                        float(row[required[1]]),  # type: ignore[index]
                        float(row[required[2]]),  # type: ignore[index]
                        float(row[required[3]]),  # type: ignore[index]
                    )
                )
            except (KeyError, TypeError, ValueError) as error:
                raise ValueError(f"Invalid IMU row {row_number}") from error

    if len(samples) < 3:
        raise ValueError("At least three IMU samples are required")
    if any(
        current.timestamp_seconds <= previous.timestamp_seconds
        for previous, current in zip(samples, samples[1:])
    ):
        raise ValueError("IMU timestamps must increase strictly")
    return samples


def estimate_repetitions(
    samples: list[ImuSample],
    *,
    minimum_peak_distance_seconds: float = 0.4,
    minimum_prominence: float | None = None,
) -> RepetitionEstimate:
    """Estimate repetition frequency using local peaks in acceleration magnitude."""
    if len(samples) < 3:
        raise ValueError("At least three IMU samples are required")
    if minimum_peak_distance_seconds <= 0:
        raise ValueError("minimum_peak_distance_seconds must be positive")

    signal = [
        (sample.ax**2 + sample.ay**2 + sample.az**2) ** 0.5
        for sample in samples
    ]
    mean = sum(signal) / len(signal)
    centered = [value - mean for value in signal]
    deviations = sorted(abs(value) for value in centered)
    baseline = deviations[len(deviations) // 2] or 1.0
    prominence = minimum_prominence if minimum_prominence is not None else baseline * 0.5
    peaks: list[int] = []
    last_peak_time = float("-inf")

    for index in range(1, len(centered) - 1):
        is_peak = centered[index] > centered[index - 1] and centered[index] >= centered[index + 1]
        if not is_peak or centered[index] < prominence:
            continue
        timestamp = samples[index].timestamp_seconds
        if timestamp - last_peak_time < minimum_peak_distance_seconds:
            if peaks and centered[index] > centered[peaks[-1]]:
                peaks[-1] = index
                last_peak_time = timestamp
            continue
        peaks.append(index)
        last_peak_time = timestamp

    duration = samples[-1].timestamp_seconds - samples[0].timestamp_seconds
    repetitions_per_minute = len(peaks) * 60 / duration if duration > 0 else 0.0
    return RepetitionEstimate(
        len(samples),
        duration,
        tuple(peaks),
        repetitions_per_minute,
    )


def apply_frequency_modifier(
    score: RiskScore,
    repetitions_per_minute: float,
    *,
    threshold: float = 30.0,
) -> RiskScore:
    """Add one activity point for high repetition, with an explicit method note."""
    if score.score is None or repetitions_per_minute < threshold:
        return score
    maximum = 7 if score.standard == "RULA" else 15
    adjusted_score = min(maximum, score.score + 1)
    return RiskScore(
        standard=score.standard,
        score=adjusted_score,
        risk_level=_risk_level(score.standard, adjusted_score),
        components={**score.components, "frequency_modifier": 1},
        missing_inputs=score.missing_inputs,
        method=f"{score.method}+frequency_modifier",
    )


def _risk_level(standard: str, score: int) -> str:
    if standard == "RULA":
        return "low" if score <= 2 else "medium" if score <= 4 else "high" if score <= 6 else "very_high"
    return "negligible" if score == 1 else "low" if score <= 3 else "medium" if score <= 7 else "high" if score <= 10 else "very_high"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_path", type=Path)
    parser.add_argument("--minimum-peak-distance", type=float, default=0.4)
    args = parser.parse_args()
    samples = load_imu_csv(args.csv_path)
    estimate = estimate_repetitions(
        samples,
        minimum_peak_distance_seconds=args.minimum_peak_distance,
    )
    print(
        f"Read {estimate.sample_count} samples; detected {len(estimate.peak_indices)} "
        f"peaks ({estimate.repetitions_per_minute:.1f} repetitions/minute)."
    )


if __name__ == "__main__":
    main()
