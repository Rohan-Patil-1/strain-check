"""Deterministic first-pass RULA/REBA screening scores.

The thresholds here are a prototype implementation for engineering iteration.
They must be cross-checked against the published RULA and REBA worksheets by a
qualified ergonomics reviewer before the results are used for formal assessment.
"""

from dataclasses import dataclass

from .angles import JointAngles


@dataclass(frozen=True, slots=True)
class PostureInput:
    """Posture measurements used by the prototype scoring engine."""

    shoulder_angle: float | None
    elbow_angle: float | None
    knee_angle: float | None
    trunk_angle: float | None
    neck_angle: float | None
    wrist_angle: float | None = None
    load_kg: float | None = None
    repetition_count: int | None = None

    @classmethod
    def from_joint_angles(cls, angles: JointAngles) -> "PostureInput":
        return cls(
            shoulder_angle=angles.shoulder,
            elbow_angle=angles.elbow,
            knee_angle=angles.knee,
            trunk_angle=angles.trunk,
            neck_angle=angles.neck,
        )


@dataclass(frozen=True, slots=True)
class RiskScore:
    """A score plus enough detail to explain how it was produced."""

    standard: str
    score: int | None
    risk_level: str
    components: dict[str, int]
    missing_inputs: tuple[str, ...]
    method: str = "prototype_screening"

    @property
    def is_complete(self) -> bool:
        return not self.missing_inputs


def score_rula(posture: PostureInput) -> RiskScore:
    """Return a deterministic RULA-style screening result."""
    missing = _missing(posture, ("shoulder_angle", "elbow_angle", "trunk_angle", "neck_angle"))
    if missing:
        return _incomplete("RULA", missing)

    components = {
        "upper_arm": _upper_arm_score(posture.shoulder_angle),
        "lower_arm": _lower_arm_score(posture.elbow_angle),
        "wrist": _wrist_score(posture.wrist_angle),
        "neck": _neck_score(posture.neck_angle),
        "trunk": _trunk_score(posture.trunk_angle),
        "legs": _leg_score(posture.knee_angle),
    }
    score = _clamp(
        components["upper_arm"]
        + components["lower_arm"]
        + components["wrist"]
        + components["neck"]
        + components["trunk"]
        + components["legs"]
        - 5,
        1,
        7,
    )
    return RiskScore("RULA", score, _rula_level(score), components, ())


def score_reba(posture: PostureInput) -> RiskScore:
    """Return a deterministic REBA-style screening result."""
    missing = _missing(posture, ("shoulder_angle", "elbow_angle", "trunk_angle", "neck_angle"))
    if missing:
        return _incomplete("REBA", missing)

    components = {
        "trunk": _trunk_score(posture.trunk_angle),
        "neck": _neck_score(posture.neck_angle),
        "legs": _leg_score(posture.knee_angle),
        "upper_arm": _upper_arm_score(posture.shoulder_angle),
        "lower_arm": _lower_arm_score(posture.elbow_angle),
        "wrist": _wrist_score(posture.wrist_angle),
        "load": _load_score(posture.load_kg),
        "activity": _activity_score(posture.repetition_count),
    }
    score = _clamp(
        components["trunk"]
        + components["neck"]
        + components["legs"]
        + components["upper_arm"]
        + components["lower_arm"]
        + components["wrist"]
        + components["load"]
        + components["activity"]
        - 4,
        1,
        15,
    )
    return RiskScore("REBA", score, _reba_level(score), components, ())


def _missing(posture: PostureInput, required: tuple[str, ...]) -> tuple[str, ...]:
    return tuple(name for name in required if getattr(posture, name) is None)


def _incomplete(standard: str, missing: tuple[str, ...]) -> RiskScore:
    return RiskScore(
        standard,
        None,
        "insufficient_data",
        {},
        missing,
    )


def _upper_arm_score(angle: float | None) -> int:
    if angle is None:
        return 1
    if angle <= 20:
        return 1
    if angle <= 45:
        return 2
    if angle <= 90:
        return 3
    return 4


def _lower_arm_score(angle: float | None) -> int:
    if angle is None or 60 <= angle <= 100:
        return 1
    return 2


def _wrist_score(angle: float | None) -> int:
    return 1 if angle is None or abs(angle) <= 15 else 2


def _neck_score(angle: float | None) -> int:
    if angle is None or angle <= 10:
        return 1
    if angle <= 20:
        return 2
    if angle <= 45:
        return 3
    return 4


def _trunk_score(angle: float | None) -> int:
    if angle is None or angle <= 5:
        return 1
    if angle <= 20:
        return 2
    if angle <= 60:
        return 3
    return 4


def _leg_score(knee_angle: float | None) -> int:
    return 1 if knee_angle is None or knee_angle <= 20 else 2


def _load_score(load_kg: float | None) -> int:
    if load_kg is None or load_kg <= 2:
        return 0
    if load_kg <= 10:
        return 1
    return 2


def _activity_score(repetition_count: int | None) -> int:
    return 1 if repetition_count is not None and repetition_count >= 10 else 0


def _rula_level(score: int) -> str:
    if score <= 2:
        return "low"
    if score <= 4:
        return "medium"
    if score <= 6:
        return "high"
    return "very_high"


def _reba_level(score: int) -> str:
    if score == 1:
        return "negligible"
    if score <= 3:
        return "low"
    if score <= 7:
        return "medium"
    if score <= 10:
        return "high"
    return "very_high"


def _clamp(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(maximum, value))
