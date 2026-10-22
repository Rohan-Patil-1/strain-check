"""Joint-angle calculations from normalized pose landmarks."""

from dataclasses import dataclass
from math import acos, degrees, hypot
from typing import Mapping


@dataclass(frozen=True, slots=True)
class Point3D:
    """A pose landmark with an optional visibility/confidence value."""

    x: float
    y: float
    z: float = 0.0
    visibility: float = 1.0


@dataclass(frozen=True, slots=True)
class JointAngles:
    """Angles used by the first RULA/REBA scoring pass."""

    shoulder: float | None = None
    elbow: float | None = None
    knee: float | None = None
    trunk: float | None = None
    neck: float | None = None


def calculate_angle(first: Point3D, vertex: Point3D, last: Point3D) -> float | None:
    """Return the 0-180 degree angle at ``vertex``.

    The calculation uses x/y coordinates because a phone video is a 2D
    observation. A missing or degenerate vector returns ``None``.
    """
    if min(first.visibility, vertex.visibility, last.visibility) <= 0:
        return None

    first_vector = (first.x - vertex.x, first.y - vertex.y)
    last_vector = (last.x - vertex.x, last.y - vertex.y)
    first_length = hypot(*first_vector)
    last_length = hypot(*last_vector)
    if first_length == 0 or last_length == 0:
        return None

    cosine = (
        first_vector[0] * last_vector[0] + first_vector[1] * last_vector[1]
    ) / (first_length * last_length)
    cosine = max(-1.0, min(1.0, cosine))
    return degrees(acos(cosine))


def angle_from_vertical(top: Point3D, bottom: Point3D) -> float | None:
    """Return the absolute angle of a segment from the downward vertical."""
    if min(top.visibility, bottom.visibility) <= 0:
        return None
    dx = top.x - bottom.x
    dy = top.y - bottom.y
    length = hypot(dx, dy)
    if length == 0:
        return None
    return degrees(acos(max(-1.0, min(1.0, abs(dy) / length))))


def _get(landmarks: Mapping[str, Point3D], name: str) -> Point3D | None:
    return landmarks.get(name)


def compute_joint_angles(
    landmarks: Mapping[str, Point3D],
    *,
    minimum_visibility: float = 0.5,
) -> JointAngles:
    """Compute available angles, marking incomplete measurements as ``None``."""
    filtered = {
        name: point
        for name, point in landmarks.items()
        if point.visibility >= minimum_visibility
    }

    def angle(first: str, vertex: str, last: str) -> float | None:
        points = [_get(filtered, name) for name in (first, vertex, last)]
        if any(point is None for point in points):
            return None
        return calculate_angle(points[0], points[1], points[2])  # type: ignore[arg-type]

    left_shoulder = angle("left_hip", "left_shoulder", "left_elbow")
    right_shoulder = angle("right_hip", "right_shoulder", "right_elbow")
    left_elbow = angle("left_shoulder", "left_elbow", "left_wrist")
    right_elbow = angle("right_shoulder", "right_elbow", "right_wrist")
    left_knee = angle("left_hip", "left_knee", "left_ankle")
    right_knee = angle("right_hip", "right_knee", "right_ankle")

    shoulder = _average(left_shoulder, right_shoulder)
    elbow = _average(left_elbow, right_elbow)
    knee = _average(left_knee, right_knee)

    trunk = _average(
        _vertical_angle(filtered, "left_shoulder", "left_hip"),
        _vertical_angle(filtered, "right_shoulder", "right_hip"),
    )
    neck = _average(
        _vertical_angle(filtered, "nose", "mid_shoulder"),
        _vertical_angle(filtered, "nose", "mid_hip"),
    )
    return JointAngles(shoulder, elbow, knee, trunk, neck)


def _vertical_angle(
    landmarks: Mapping[str, Point3D], top_name: str, bottom_name: str
) -> float | None:
    top = landmarks.get(top_name)
    bottom = landmarks.get(bottom_name)
    if top is None or bottom is None:
        return None
    return angle_from_vertical(top, bottom)


def _average(*values: float | None) -> float | None:
    available = [value for value in values if value is not None]
    return sum(available) / len(available) if available else None
