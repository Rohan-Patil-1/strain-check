"""Input metadata shared by data collection and later analysis stages."""

from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path


class TaskType(StrEnum):
    """Tasks included in the first validation round."""

    LIFTING = "lifting"
    REACHING = "reaching"
    REPETITIVE_SCANNING = "repetitive_scanning"


@dataclass(frozen=True, slots=True)
class ClipRecord:
    """Metadata for one self-recorded clip.

    The video itself stays local. Only this metadata and derived measurements
    need to be shared for analysis or validation.
    """

    clip_id: str
    task: TaskType
    video_path: Path
    duration_seconds: float
    camera_view: str
    participant_id: str
    consent_recorded: bool = False

    def validate(self) -> None:
        """Raise ValueError when the clip is not ready for analysis."""
        if not self.clip_id.strip():
            raise ValueError("clip_id must not be empty")
        if self.duration_seconds <= 0 or self.duration_seconds > 30:
            raise ValueError("duration_seconds must be between 0 and 30")
        if not self.camera_view.strip():
            raise ValueError("camera_view must not be empty")
        if not self.participant_id.strip():
            raise ValueError("participant_id must not be empty")
        if not self.consent_recorded:
            raise ValueError("consent_recorded must be true before analysis")
