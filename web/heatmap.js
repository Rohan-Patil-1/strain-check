const REGIONS = [
  ["neck", "Neck"],
  ["trunk", "Trunk"],
  ["shoulder", "Shoulders"],
  ["elbow", "Elbows"],
  ["knee", "Knees"],
];

export function drawHeatmap(canvas, frames) {
  const context = canvas.getContext("2d");
  const width = canvas.width = Math.max(320, canvas.clientWidth * devicePixelRatio);
  const height = canvas.height = Math.max(180, canvas.clientHeight * devicePixelRatio);
  context.clearRect(0, 0, width, height);
  context.font = `${Math.max(12, width / 48)}px Trebuchet MS, sans-serif`;

  const validFrames = frames.filter((frame) => frame.poseDetected);
  const intensities = REGIONS.map(([key]) => {
    const values = validFrames
      .map((frame) => frame.angles[key])
      .filter((value) => value !== null);
    if (!values.length) return 0;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const thresholds = { neck: 45, trunk: 60, shoulder: 90, elbow: 150, knee: 90 };
    return Math.max(0, Math.min(1, average / thresholds[key]));
  });

  const barHeight = Math.min(30, height / (REGIONS.length * 1.8));
  const gap = barHeight * 0.7;
  const left = width * 0.27;
  const barWidth = width * 0.65;
  REGIONS.forEach(([key, label], index) => {
    const y = index * (barHeight + gap) + gap;
    const intensity = intensities[index];
    context.fillStyle = "#4c6580";
    context.fillText(label, width * 0.04, y + barHeight * 0.72);
    context.fillStyle = "#d5e7f8";
    context.fillRect(left, y, barWidth, barHeight);
    context.fillStyle = heatColor(intensity);
    context.fillRect(left, y, barWidth * intensity, barHeight);
    context.fillStyle = "#091a33";
    context.fillText(`${Math.round(intensity * 100)}%`, left + barWidth + 8, y + barHeight * 0.72);
  });
  return Object.fromEntries(REGIONS.map(([key], index) => [key, Number(intensities[index].toFixed(2))]));
}

function heatColor(value) {
  const red = Math.round(54 + value * 186);
  const green = Math.round(200 - value * 150);
  return `rgb(${red}, ${green}, 92)`;
}
