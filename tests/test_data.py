from pathlib import Path

import pytest

from strain_check import ClipRecord, TaskType


def make_clip(**overrides: object) -> ClipRecord:
    values: dict[str, object] = {
        "clip_id": "lift-001",
        "task": TaskType.LIFTING,
        "video_path": Path("data/raw/lift-001.mp4"),
        "duration_seconds": 20.0,
        "camera_view": "left_side",
        "participant_id": "participant-001",
        "consent_recorded": True,
    }
    values.update(overrides)
    return ClipRecord(**values)  # type: ignore[arg-type]


def test_valid_clip_passes_validation() -> None:
    make_clip().validate()


@pytest.mark.parametrize("duration", [0, 30.1])
def test_clip_duration_is_limited(duration: float) -> None:
    with pytest.raises(ValueError, match="duration_seconds"):
        make_clip(duration_seconds=duration).validate()


def test_consent_is_required() -> None:
    with pytest.raises(ValueError, match="consent"):
        make_clip(consent_recorded=False).validate()
