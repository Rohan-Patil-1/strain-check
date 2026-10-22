"""Convert extracted landmark JSON into angles and risk summaries."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from .angles import Point3D, compute_joint_angles
from .imu import apply_frequency_modifier, estimate_repetitions, load_imu_csv
from .scoring import PostureInput, score_reba, score_rula


def analyze_landmarks(
    input_path: Path,
    output_path: Path,
    *,
    minimum_visibility: float = 0.5,
    repetitions_per_minute: float | None = None,
) -> dict[str, Any]:
    """Analyze every frame in a pose-pipeline JSON file."""
    payload = json.loads(input_path.read_text(encoding="utf-8"))
    frame_results: list[dict[str, Any]] = []
    valid_postures: list[PostureInput] = []

    for frame in payload.get("frames", []):
        landmarks = {
            name: Point3D(
                point["x"],
                point["y"],
                point.get("z", 0.0),
                point.get("visibility", 1.0),
            )
            for name, point in frame.get("landmarks", {}).items()
        }
        angles = compute_joint_angles(
            landmarks,
            minimum_visibility=minimum_visibility,
        )
        posture = PostureInput.from_joint_angles(angles)
        rula = score_rula(posture)
        reba = score_reba(posture)
        if repetitions_per_minute is not None:
            rula = apply_frequency_modifier(rula, repetitions_per_minute)
            reba = apply_frequency_modifier(reba, repetitions_per_minute)
        if rula.is_complete and reba.is_complete:
            valid_postures.append(posture)
        frame_results.append(
            {
                "frame_index": frame["frame_index"],
                "timestamp_seconds": frame["timestamp_seconds"],
                "pose_detected": frame.get("pose_detected", False),
                "angles": {
                    "shoulder": angles.shoulder,
                    "elbow": angles.elbow,
                    "knee": angles.knee,
                    "trunk": angles.trunk,
                    "neck": angles.neck,
                },
                "rula": _score_dict(rula),
                "reba": _score_dict(reba),
            }
        )

    summary = _summarize(valid_postures, repetitions_per_minute)
    result = {
        "source_landmarks": str(input_path),
        "frames_analyzed": len(frame_results),
        "frames_with_complete_scores": len(valid_postures),
        "frames": frame_results,
        "summary": summary,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


def _score_dict(score: Any) -> dict[str, Any]:
    return {
        "standard": score.standard,
        "score": score.score,
        "risk_level": score.risk_level,
        "components": score.components,
        "missing_inputs": list(score.missing_inputs),
        "method": score.method,
    }


def _summarize(
    postures: list[PostureInput],
    repetitions_per_minute: float | None = None,
) -> dict[str, Any]:
    if not postures:
        return {
            "rula": {"score": None, "risk_level": "insufficient_data"},
            "reba": {"score": None, "risk_level": "insufficient_data"},
        }

    rula_scores = [
        apply_frequency_modifier(score_rula(posture), repetitions_per_minute).score
        if repetitions_per_minute is not None
        else score_rula(posture).score
        for posture in postures
    ]
    reba_scores = [
        apply_frequency_modifier(score_reba(posture), repetitions_per_minute).score
        if repetitions_per_minute is not None
        else score_reba(posture).score
        for posture in postures
    ]
    rula_average = round(sum(score for score in rula_scores if score is not None) / len(postures), 2)
    reba_average = round(sum(score for score in reba_scores if score is not None) / len(postures), 2)
    return {
        "rula": {"score": rula_average, "risk_level": _average_level(rula_average, "rula")},
        "reba": {"score": reba_average, "risk_level": _average_level(reba_average, "reba")},
    }


def _average_level(score: float, standard: str) -> str:
    if standard == "rula":
        if score <= 2:
            return "low"
        if score <= 4:
            return "medium"
        if score <= 6:
            return "high"
        return "very_high"
    if score <= 1:
        return "negligible"
    if score <= 3:
        return "low"
    if score <= 7:
        return "medium"
    if score <= 10:
        return "high"
    return "very_high"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("landmarks", type=Path, help="Pose-pipeline JSON input")
    parser.add_argument("--output", type=Path, default=Path("data/derived/analysis.json"))
    parser.add_argument("--imu-csv", type=Path, help="Optional accelerometer CSV")
    args = parser.parse_args()
    repetitions_per_minute = None
    if args.imu_csv:
        estimate = estimate_repetitions(load_imu_csv(args.imu_csv))
        repetitions_per_minute = estimate.repetitions_per_minute
    result = analyze_landmarks(
        args.landmarks,
        args.output,
        repetitions_per_minute=repetitions_per_minute,
    )
    print(
        f"Analyzed {result['frames_analyzed']} frames; "
        f"{result['frames_with_complete_scores']} had complete scores."
    )


if __name__ == "__main__":
    main()
