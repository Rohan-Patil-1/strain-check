export const LANDMARK = Object.freeze({
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
});

export function calculateAngle(first, vertex, last, minimumVisibility = 0.5) {
  if (!first || !vertex || !last) return null;
  if (Math.min(first.visibility ?? 1, vertex.visibility ?? 1, last.visibility ?? 1) < minimumVisibility) {
    return null;
  }
  const firstVector = { x: first.x - vertex.x, y: first.y - vertex.y };
  const lastVector = { x: last.x - vertex.x, y: last.y - vertex.y };
  const firstLength = Math.hypot(firstVector.x, firstVector.y);
  const lastLength = Math.hypot(lastVector.x, lastVector.y);
  if (!firstLength || !lastLength) return null;
  const cosine = Math.max(-1, Math.min(1,
    (firstVector.x * lastVector.x + firstVector.y * lastVector.y) / (firstLength * lastLength),
  ));
  return Math.acos(cosine) * 180 / Math.PI;
}

function verticalAngle(top, bottom, minimumVisibility) {
  if (!top || !bottom) return null;
  if (Math.min(top.visibility ?? 1, bottom.visibility ?? 1) < minimumVisibility) return null;
  const length = Math.hypot(top.x - bottom.x, top.y - bottom.y);
  if (!length) return null;
  return Math.acos(Math.max(-1, Math.min(1, Math.abs(top.y - bottom.y) / length))) * 180 / Math.PI;
}

function average(...values) {
  const available = values.filter((value) => value !== null);
  return available.length ? available.reduce((sum, value) => sum + value, 0) / available.length : null;
}

export function computeJointAngles(landmarks, minimumVisibility = 0.5) {
  const point = (index) => landmarks[index];
  return {
    shoulder: average(
      calculateAngle(point(LANDMARK.LEFT_HIP), point(LANDMARK.LEFT_SHOULDER), point(LANDMARK.LEFT_ELBOW), minimumVisibility),
      calculateAngle(point(LANDMARK.RIGHT_HIP), point(LANDMARK.RIGHT_SHOULDER), point(LANDMARK.RIGHT_ELBOW), minimumVisibility),
    ),
    elbow: average(
      calculateAngle(point(LANDMARK.LEFT_SHOULDER), point(LANDMARK.LEFT_ELBOW), point(LANDMARK.LEFT_WRIST), minimumVisibility),
      calculateAngle(point(LANDMARK.RIGHT_SHOULDER), point(LANDMARK.RIGHT_ELBOW), point(LANDMARK.RIGHT_WRIST), minimumVisibility),
    ),
    knee: average(
      calculateAngle(point(LANDMARK.LEFT_HIP), point(LANDMARK.LEFT_KNEE), point(LANDMARK.LEFT_ANKLE), minimumVisibility),
      calculateAngle(point(LANDMARK.RIGHT_HIP), point(LANDMARK.RIGHT_KNEE), point(LANDMARK.RIGHT_ANKLE), minimumVisibility),
    ),
    trunk: average(
      verticalAngle(point(LANDMARK.LEFT_SHOULDER), point(LANDMARK.LEFT_HIP), minimumVisibility),
      verticalAngle(point(LANDMARK.RIGHT_SHOULDER), point(LANDMARK.RIGHT_HIP), minimumVisibility),
    ),
    neck: verticalAngle(point(LANDMARK.NOSE), {
      x: (point(LANDMARK.LEFT_SHOULDER)?.x + point(LANDMARK.RIGHT_SHOULDER)?.x) / 2,
      y: (point(LANDMARK.LEFT_SHOULDER)?.y + point(LANDMARK.RIGHT_SHOULDER)?.y) / 2,
      visibility: Math.min(point(LANDMARK.LEFT_SHOULDER)?.visibility ?? 0, point(LANDMARK.RIGHT_SHOULDER)?.visibility ?? 0),
    }, minimumVisibility),
  };
}
