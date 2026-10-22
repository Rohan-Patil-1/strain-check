from math import isclose

from strain_check.angles import Point3D, calculate_angle, compute_joint_angles


def test_calculate_angle_for_straight_and_right_angles() -> None:
    assert isclose(
        calculate_angle(Point3D(-1, 0), Point3D(0, 0), Point3D(1, 0)) or 0,
        180,
    )
    assert isclose(
        calculate_angle(Point3D(0, 1), Point3D(0, 0), Point3D(1, 0)) or 0,
        90,
    )


def test_low_visibility_landmarks_are_not_scored() -> None:
    landmarks = {
        "left_hip": Point3D(0, 2),
        "left_shoulder": Point3D(0, 1),
        "left_elbow": Point3D(1, 1, visibility=0.2),
    }
    angles = compute_joint_angles(landmarks)
    assert angles.shoulder is None


def test_joint_angles_average_left_and_right_sides() -> None:
    landmarks = {
        "left_hip": Point3D(0, 2),
        "left_shoulder": Point3D(0, 1),
        "left_elbow": Point3D(1, 1),
        "right_hip": Point3D(4, 2),
        "right_shoulder": Point3D(4, 1),
        "right_elbow": Point3D(3, 1),
    }
    angles = compute_joint_angles(landmarks)
    assert angles.shoulder is not None
    assert isclose(angles.shoulder, 90)
