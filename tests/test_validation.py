from pathlib import Path

from strain_check.validation import load_validation_csv, summarize_validation


def test_validation_csv_and_perfect_agreement() -> None:
    records = load_validation_csv(Path("tests/fixtures/validation.csv"))
    summary = summarize_validation(records)
    assert summary.sample_count == 4
    assert summary.observed_agreement == 1.0
    assert summary.cohen_kappa == 1.0


def test_confusion_matrix_counts_disagreements() -> None:
    records = load_validation_csv(Path("tests/fixtures/validation_mixed.csv"))
    summary = summarize_validation(records)
    assert summary.confusion_matrix["low"]["medium"] == 1
    assert summary.cohen_kappa < 1.0
