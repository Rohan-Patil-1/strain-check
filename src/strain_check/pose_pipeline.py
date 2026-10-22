"""Extract MediaPipe Pose landmarks from a local video file."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


class PosePipelineError(RuntimeError):
    """Raised when a video cannot be processed."""


def process_video(
    video_path: Path,
    output_path: Path,
    *,
    minimum_visibility: float = 0.5,
    model_complexity: int = 1,
) -> dict[str, Any]:
    """Extract pose landmarks and write one JSON record per video frame.

    MediaPipe and OpenCV are imported lazily so the angle and scoring modules
    remain usable in environments that do not have video dependencies yet.
    """
    if not video_path.is_file():
        raise PosePipelineError(f"Video does not exist: {video_path}")
    if not 0 <= minimum_visibility <= 1:
        raise ValueError("minimum_visibility must be between 0 and 1")

    try:
        import cv2
        import mediapipe as mp
    except ImportError as error:
        raise PosePipelineError(
            "Video processing requires opencv-python and mediapipe. "
            "Install them with: py -m pip install opencv-python mediapipe"
        ) from error

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise PosePipelineError(f"Could not open video: {video_path}")

    fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    records: list[dict[str, Any]] = []
    frames_without_pose = 0
    mp_pose = mp.solutions.pose

    try:
        with mp_pose.Pose(
            static_image_mode=False,
            model_complexity=model_complexity,
            enable_segmentation=False,
            min_detection_confidence=minimum_visibility,
            min_tracking_confidence=minimum_visibility,
        ) as pose:
            frame_index = 0
            while True:
                success, frame = capture.read()
                if not success:
                    break
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                result = pose.process(rgb_frame)
                pose_landmarks = result.pose_landmarks
                if pose_landmarks is None:
                    frames_without_pose += 1
                    records.append(
                        {
                            "frame_index": frame_index,
                            "timestamp_seconds": _timestamp(frame_index, fps),
                            "pose_detected": False,
                            "landmarks": {},
                        }
                    )
                else:
                    landmarks = _serialize_landmarks(pose_landmarks, mp_pose)
                    records.append(
                        {
                            "frame_index": frame_index,
                            "timestamp_seconds": _timestamp(frame_index, fps),
                            "pose_detected": True,
                            "min_visibility": min(
                                point["visibility"] for point in landmarks.values()
                            ),
                            "landmarks": landmarks,
                        }
                    )
                frame_index += 1
    finally:
        capture.release()

    payload = {
        "source_video": str(video_path),
        "fps": fps,
        "frame_count_reported_by_video": frame_count,
        "frames_processed": len(records),
        "frames_without_pose": frames_without_pose,
        "minimum_visibility": minimum_visibility,
        "frames": records,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


def _timestamp(frame_index: int, fps: float) -> float:
    return frame_index / fps if fps > 0 else 0.0


def _serialize_landmarks(pose_landmarks: Any, mp_pose: Any) -> dict[str, dict[str, float]]:
    serialized: dict[str, dict[str, float]] = {}
    for landmark_name in mp_pose.PoseLandmark:
        landmark = pose_landmarks.landmark[landmark_name.value]
        serialized[landmark_name.name.lower()] = {
            "x": float(landmark.x),
            "y": float(landmark.y),
            "z": float(landmark.z),
            "visibility": float(getattr(landmark, "visibility", 1.0)),
        }

    _add_midpoint(serialized, "mid_shoulder", "left_shoulder", "right_shoulder")
    _add_midpoint(serialized, "mid_hip", "left_hip", "right_hip")
    return serialized


def _add_midpoint(
    landmarks: dict[str, dict[str, float]],
    midpoint_name: str,
    first_name: str,
    second_name: str,
) -> None:
    first = landmarks.get(first_name)
    second = landmarks.get(second_name)
    if first is None or second is None:
        return
    landmarks[midpoint_name] = {
        axis: (first[axis] + second[axis]) / 2
        for axis in ("x", "y", "z", "visibility")
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", type=Path, help="Input video path")
    parser.add_argument(
        "--output",
        type=Path,
        help="Output JSON path (default: data/derived/<video>.json)",
    )
    parser.add_argument("--minimum-visibility", type=float, default=0.5)
    args = parser.parse_args()
    output = args.output or Path("data/derived") / f"{args.video.stem}.json"
    payload = process_video(
        args.video,
        output,
        minimum_visibility=args.minimum_visibility,
    )
    print(
        f"Processed {payload['frames_processed']} frames; "
        f"{payload['frames_without_pose']} had no detected pose."
    )


if __name__ == "__main__":
    main()
