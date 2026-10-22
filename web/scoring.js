function upperArmScore(angle) {
  if (angle === null) return 1;
  if (angle <= 20) return 1;
  if (angle <= 45) return 2;
  if (angle <= 90) return 3;
  return 4;
}

function lowerArmScore(angle) {
  return angle === null || (angle >= 60 && angle <= 100) ? 1 : 2;
}

function neckScore(angle) {
  if (angle === null || angle <= 10) return 1;
  if (angle <= 20) return 2;
  if (angle <= 45) return 3;
  return 4;
}

function trunkScore(angle) {
  if (angle === null || angle <= 5) return 1;
  if (angle <= 20) return 2;
  if (angle <= 60) return 3;
  return 4;
}

function legScore(angle) {
  return angle === null || angle <= 20 ? 1 : 2;
}

function riskLevel(standard, score) {
  if (standard === "RULA") {
    return score <= 2 ? "low" : score <= 4 ? "medium" : score <= 6 ? "high" : "very_high";
  }
  return score === 1 ? "negligible" : score <= 3 ? "low" : score <= 7 ? "medium" : score <= 10 ? "high" : "very_high";
}

function incomplete(standard, missingInputs) {
  return { standard, score: null, riskLevel: "insufficient_data", components: {}, missingInputs, method: "browser_prototype_screening" };
}

export function scoreRula(angles, frequencyPerMinute = null) {
  const required = ["shoulder", "elbow", "trunk", "neck"];
  const missing = required.filter((name) => angles[name] === null);
  if (missing.length) return incomplete("RULA", missing);
  const components = {
    upperArm: upperArmScore(angles.shoulder),
    lowerArm: lowerArmScore(angles.elbow),
    wrist: 1,
    neck: neckScore(angles.neck),
    trunk: trunkScore(angles.trunk),
    legs: legScore(angles.knee),
  };
  let score = Math.max(1, Math.min(7, Object.values(components).reduce((sum, value) => sum + value, 0) - 5));
  if (frequencyPerMinute !== null && frequencyPerMinute >= 30) {
    score = Math.min(7, score + 1);
    components.frequencyModifier = 1;
  }
  return { standard: "RULA", score, riskLevel: riskLevel("RULA", score), components, missingInputs: [], method: "browser_prototype_screening" };
}

export function scoreReba(angles, frequencyPerMinute = null) {
  const required = ["shoulder", "elbow", "trunk", "neck"];
  const missing = required.filter((name) => angles[name] === null);
  if (missing.length) return incomplete("REBA", missing);
  const components = {
    trunk: trunkScore(angles.trunk),
    neck: neckScore(angles.neck),
    legs: legScore(angles.knee),
    upperArm: upperArmScore(angles.shoulder),
    lowerArm: lowerArmScore(angles.elbow),
    wrist: 1,
    load: 0,
    activity: 0,
  };
  let score = Math.max(1, Math.min(15, Object.values(components).reduce((sum, value) => sum + value, 0) - 4));
  if (frequencyPerMinute !== null && frequencyPerMinute >= 30) {
    score = Math.min(15, score + 1);
    components.frequencyModifier = 1;
  }
  return { standard: "REBA", score, riskLevel: riskLevel("REBA", score), components, missingInputs: [], method: "browser_prototype_screening" };
}
