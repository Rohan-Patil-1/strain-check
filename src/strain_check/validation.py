"""Validation metrics for comparing system and human risk labels."""

from __future__ import annotations

import argparse
import csv
from collections import Counter
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class ValidationRecord:
    """One clip-level comparison between a human and system label."""

    clip_id: str
    observed_label: str
    predicted_label: str


@dataclass(frozen=True, slots=True)
class ValidationSummary:
    """Agreement results for one validation batch."""

    sample_count: int
    labels: tuple[str, ...]
    confusion_matrix: dict[str, dict[str, int]]
    observed_agreement: float
    cohen_kappa: float


def load_validation_csv(path: Path) -> list[ValidationRecord]:
    """Load clip_id, observed_label, and predicted_label columns."""
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        required = {"clip_id", "observed_label", "predicted_label"}
        if reader.fieldnames is None or not required.issubset(reader.fieldnames):
            raise ValueError(
                "Validation CSV needs clip_id, observed_label, and predicted_label columns"
            )
        records = [
            ValidationRecord(
                row["clip_id"].strip(),
                row["observed_label"].strip(),
                row["predicted_label"].strip(),
            )
            for row in reader
        ]
    if not records:
        raise ValueError("Validation CSV must contain at least one record")
    if any(not record.clip_id or not record.observed_label or not record.predicted_label for record in records):
        raise ValueError("Validation records cannot contain empty values")
    return records


def summarize_validation(records: list[ValidationRecord]) -> ValidationSummary:
    """Calculate confusion counts, agreement, and Cohen's kappa."""
    if not records:
        raise ValueError("At least one validation record is required")
    labels = tuple(sorted({record.observed_label for record in records} | {record.predicted_label for record in records}))
    matrix = {observed: {predicted: 0 for predicted in labels} for observed in labels}
    for record in records:
        matrix[record.observed_label][record.predicted_label] += 1

    total = len(records)
    observed_agreement = sum(matrix[label][label] for label in labels) / total
    observed_counts = Counter(record.observed_label for record in records)
    predicted_counts = Counter(record.predicted_label for record in records)
    expected_agreement = sum(
        observed_counts[label] * predicted_counts[label] for label in labels
    ) / (total * total)
    kappa = (
        1.0
        if expected_agreement == 1.0 and observed_agreement == 1.0
        else (observed_agreement - expected_agreement) / (1 - expected_agreement)
        if expected_agreement != 1.0
        else 0.0
    )
    return ValidationSummary(
        total,
        labels,
        matrix,
        observed_agreement,
        kappa,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_path", type=Path)
    args = parser.parse_args()
    summary = summarize_validation(load_validation_csv(args.csv_path))
    print(f"Compared {summary.sample_count} records; Cohen's kappa: {summary.cohen_kappa:.3f}")
    for observed, row in summary.confusion_matrix.items():
        print(f"{observed}: {row}")


if __name__ == "__main__":
    main()
