const CONNECTIONS = [
  [0, 11], [0, 12], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
];

export function postureStatus(rula, reba) {
  if (rula.score === null || reba.score === null) {
    return { label: "INSUFFICIENT DATA", color: "#e1a44a" };
  }
  if (rula.score <= 2 && reba.score <= 3) {
    return { label: "POSTURE OK", color: "#54c878" };
  }
  return { label: "ADJUST POSTURE", color: "#f06b5d" };
}

export function drawAnnotatedFrame(canvas, video, landmarks, angles, rula, reba) {
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  context.drawImage(video, 0, 0, width, height);
  const state = postureStatus(rula, reba);

  if (landmarks) {
    context.lineWidth = Math.max(2, width / 320);
    context.strokeStyle = state.color;
    for (const [firstIndex, secondIndex] of CONNECTIONS) {
      const first = landmarks[firstIndex];
      const second = landmarks[secondIndex];
      if (!first || !second || Math.min(first.visibility ?? 1, second.visibility ?? 1) < 0.5) continue;
      context.beginPath();
      context.moveTo(first.x * width, first.y * height);
      context.lineTo(second.x * width, second.y * height);
      context.stroke();
    }
    context.fillStyle = "#fafdff";
    context.strokeStyle = state.color;
    for (const point of landmarks) {
      if ((point.visibility ?? 1) < 0.5) continue;
      context.beginPath();
      context.arc(point.x * width, point.y * height, Math.max(3, width / 160), 0, Math.PI * 2);
      context.fill();
      context.stroke();
    }
  }

  drawPanel(context, width, height, state, angles, rula, reba, Boolean(landmarks));
  return state;
}

function drawPanel(context, width, height, state, angles, rula, reba, hasPose) {
  const panelWidth = Math.min(width * 0.48, 390);
  const panelHeight = Math.min(height * 0.34, 210);
  context.fillStyle = "rgba(18, 59, 50, .9)";
  context.fillRect(16, 16, panelWidth, panelHeight);
  context.fillStyle = state.color;
  context.font = `800 ${Math.max(16, width / 42)}px Trebuchet MS, sans-serif`;
  context.fillText(state.label, 30, 48);
  context.fillStyle = "#fafdff";
  context.font = `600 ${Math.max(11, width / 75)}px Trebuchet MS, sans-serif`;
  const lines = [
    `Neck ${formatAngle(angles.neck)}`,
    `Trunk ${formatAngle(angles.trunk)}`,
    `Shoulder ${formatAngle(angles.shoulder)}`,
    `Elbow ${formatAngle(angles.elbow)}`,
    `Knee ${formatAngle(angles.knee)}`,
    hasPose ? `RULA ${rula.score ?? "-"}  ·  REBA ${reba.score ?? "-"}` : "No pose detected",
  ];
  lines.forEach((line, index) => context.fillText(line, 30, 76 + index * 21));
}

function formatAngle(value) {
  return value === null ? "-" : `${Math.round(value)}°`;
}
