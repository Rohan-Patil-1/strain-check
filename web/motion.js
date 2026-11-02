export function createMotionCapture() {
  const samples = [];
  let listening = false;
  const listener = (event) => {
    const acceleration = event.accelerationIncludingGravity || event.acceleration;
    if (!acceleration) return;
    samples.push({
      timestamp: performance.now() / 1000,
      x: acceleration.x ?? 0,
      y: acceleration.y ?? 0,
      z: acceleration.z ?? 0,
    });
  };

  return {
    async start() {
      if (!("DeviceMotionEvent" in window)) {
        throw new Error("This browser does not provide motion sensors.");
      }
      if (typeof DeviceMotionEvent.requestPermission === "function") {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== "granted") throw new Error("Motion permission was not granted.");
      }
      samples.length = 0;
      window.addEventListener("devicemotion", listener);
      listening = true;
    },
    stop() {
      if (listening) window.removeEventListener("devicemotion", listener);
      listening = false;
      return estimateFrequency(samples);
    },
  };
}

function estimateFrequency(samples) {
  if (samples.length < 3) return { sampleCount: samples.length, repetitionsPerMinute: null, peakCount: 0 };
  const signal = samples.map((sample) => Math.hypot(sample.x, sample.y, sample.z));
  const mean = signal.reduce((sum, value) => sum + value, 0) / signal.length;
  const centered = signal.map((value) => value - mean);
  const spread = centered.map((value) => Math.abs(value)).sort((a, b) => a - b)[Math.floor(centered.length / 2)] || 1;
  const threshold = spread * 0.5;
  const peaks = [];
  let lastPeak = -Infinity;
  for (let index = 1; index < centered.length - 1; index += 1) {
    if (centered[index] <= threshold || centered[index] <= centered[index - 1] || centered[index] < centered[index + 1]) continue;
    if (samples[index].timestamp - lastPeak < 0.4) continue;
    peaks.push(index);
    lastPeak = samples[index].timestamp;
  }
  const duration = samples.at(-1).timestamp - samples[0].timestamp;
  return {
    sampleCount: samples.length,
    peakCount: peaks.length,
    repetitionsPerMinute: duration > 0 ? Number((peaks.length * 60 / duration).toFixed(2)) : null,
  };
}
