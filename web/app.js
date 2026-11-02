import {
  FilesetResolver,
  PoseLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/+esm";
import { computeJointAngles } from "./angles.js";
import { drawAnnotatedFrame, postureStatus } from "./overlay.js";
import { scoreReba, scoreRula } from "./scoring.js";
import { buildGuidance, availableLanguages } from "./guidance.js";
import { drawHeatmap } from "./heatmap.js";
import { createMotionCapture } from "./motion.js";

const videoFile = document.querySelector("#video-file");
const video = document.querySelector("#video");
const analyzeButton = document.querySelector("#analyze");
const exportButton = document.querySelector("#export");
const exportVideoButton = document.querySelector("#export-video");
const printButton = document.querySelector("#print-report");
const motionButton = document.querySelector("#motion-toggle");
const motionStatus = document.querySelector("#motion-status");
const languageSelect = document.querySelector("#language");
const guidanceTitle = document.querySelector("#guidance-title");
const guidanceMessage = document.querySelector("#guidance-message");
const guidanceDisclaimer = document.querySelector("#guidance-disclaimer");
const heatmap = document.querySelector("#heatmap");
const overlay = document.querySelector("#overlay");
const sampleRate = document.querySelector("#sample-rate");
const modelStatus = document.querySelector("#model-status");
const modelProgress = document.querySelector("#model-progress");
const modelPercent = document.querySelector("#model-percent");
const progress = document.querySelector("#progress");
const status = document.querySelector("#status");
const frameCount = document.querySelector("#frames");
const poseCount = document.querySelector("#poses");
const rulaValue = document.querySelector("#rula");
const rebaValue = document.querySelector("#reba");
const modelUrl = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

let poseLandmarker;
let latestResults;
let latestAnnotatedVideo;
let modelError;
let videoReady = false;
let motionCapture;
let motionCaptureActive = false;
let motionEstimate = null;

for (const language of availableLanguages()) {
  const option = document.createElement("option");
  option.value = language.code;
  option.textContent = language.name;
  languageSelect.append(option);
}
languageSelect.value = "en";
motionCapture = createMotionCapture();

async function createPoseLandmarker() {
  setModelProgress(0.04, "Loading the vision runtime...");
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm",
  );
  setModelProgress(0.12, "Downloading the pose model...");
  const response = await fetch(modelUrl, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Model download failed (${response.status})`);
  const modelBuffer = await readModelWithProgress(response);
  setModelProgress(0.9, "Installing the model in this browser...");
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetBuffer: modelBuffer, delegate: "CPU" },
    runningMode: "VIDEO",
    numPoses: 1,
  });
}

async function readModelWithProgress(response) {
  if (!response.body) return new Uint8Array(await response.arrayBuffer());
  const reader = response.body.getReader();
  const total = Number(response.headers.get("content-length")) || 0;
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total) setModelProgress(0.12 + (received / total) * 0.76, "Downloading the pose model...");
  }
  const buffer = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }
  return buffer;
}

function setModelProgress(value, label) {
  modelProgress.value = Math.max(0, Math.min(1, value));
  modelPercent.textContent = `${Math.round(modelProgress.value * 100)}%`;
  modelStatus.textContent = label;
}

function updateAnalyzeState() {
  const ready = Boolean(poseLandmarker && videoReady);
  analyzeButton.disabled = !ready;
  analyzeButton.title = ready ? "Analyze the selected video" : "Prepare the model and choose a video first";
}

const modelReadyPromise = createPoseLandmarker()
  .then((landmarker) => {
    poseLandmarker = landmarker;
    setModelProgress(1, "Model ready on this device.");
    status.textContent = videoReady ? "Ready. Analyze the full video when you are ready." : "Model ready. Choose or record a video.";
    updateAnalyzeState();
    return landmarker;
  })
  .catch((error) => {
    modelError = error;
    setModelProgress(0, "Model setup could not finish. Check your internet connection and refresh.");
    status.textContent = `Model setup failed: ${error.message}`;
    updateAnalyzeState();
    return null;
  });

videoFile.addEventListener("change", () => {
  const [file] = videoFile.files;
  if (!file) return;
  video.src = URL.createObjectURL(file);
  videoReady = false;
  status.textContent = modelError ? "Model setup failed. Refresh after checking your connection." : "Video loaded. Preparing it for analysis...";
  updateAnalyzeState();
});

video.addEventListener("loadedmetadata", () => {
  videoReady = Number.isFinite(video.duration) && video.duration > 0;
  overlay.width = video.videoWidth || 1280;
  overlay.height = video.videoHeight || 720;
  const aspectRatio = `${overlay.width} / ${overlay.height}`;
  video.style.aspectRatio = aspectRatio;
  overlay.style.aspectRatio = aspectRatio;
  status.textContent = poseLandmarker ? "Ready. Analyze the full video when you are ready." : "Video ready. Finishing model setup...";
  updateAnalyzeState();
});

analyzeButton.addEventListener("click", async () => {
  if (!poseLandmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
  analyzeButton.disabled = true;
  exportButton.disabled = true;
  exportVideoButton.disabled = true;
  const results = [];
  const recorder = createAnnotatedVideoRecorder();
  const framesPerSecond = Number(sampleRate.value);
  const step = 1 / Math.max(1, Math.min(30, framesPerSecond));
  const originalTime = video.currentTime;
  try {
    recorder?.start();
    for (let time = 0; time < video.duration; time += step) {
      await seekTo(time);
      const detection = poseLandmarker.detectForVideo(video, time * 1000);
      const landmarks = detection.landmarks?.[0] ?? null;
      const angles = landmarks ? computeJointAngles(landmarks) : { shoulder: null, elbow: null, knee: null, trunk: null, neck: null };
      const frequency = motionEstimate?.repetitionsPerMinute ?? null;
      const rula = scoreRula(angles, frequency);
      const reba = scoreReba(angles, frequency);
      const posture = postureStatus(rula, reba);
      drawAnnotatedFrame(overlay, video, landmarks, angles, rula, reba);
      results.push({
        timestampSeconds: time,
        poseDetected: Boolean(landmarks),
        angles,
        posture: posture.label,
        rula,
        reba,
      });
      progress.value = Math.min(1, time / video.duration);
      status.textContent = `Analyzing ${Math.round(progress.value * 100)}%...`;
    }
    latestAnnotatedVideo = recorder ? await finishRecording(recorder) : null;
    if (motionCaptureActive) {
      motionEstimate = motionCapture.stop();
      motionCaptureActive = false;
      motionButton.textContent = "Capture phone motion";
      motionStatus.textContent = `${motionEstimate.peakCount} motion peaks; ${motionEstimate.repetitionsPerMinute ?? "insufficient data"} repetitions/minute`;
      applyMotionEstimate(results, motionEstimate.repetitionsPerMinute);
    }
    latestResults = summarize(results, motionEstimate);
    renderSummary(latestResults);
    exportButton.disabled = false;
    exportVideoButton.disabled = !latestAnnotatedVideo;
    printButton.disabled = false;
    status.textContent = `Finished. ${latestResults.framesWithPose} of ${latestResults.framesAnalyzed} sampled frames contained a pose.`;
  } catch (error) {
    status.textContent = `Analysis failed: ${error.message}`;
  } finally {
    if (recorder && recorder.state !== "inactive") recorder.stop();
    await seekTo(originalTime);
    analyzeButton.disabled = false;
  }
});

motionButton.addEventListener("click", async () => {
  if (motionCaptureActive) {
    motionEstimate = motionCapture.stop();
    motionCaptureActive = false;
    motionButton.textContent = "Capture phone motion";
    motionStatus.textContent = `${motionEstimate.peakCount} motion peaks; ${motionEstimate.repetitionsPerMinute ?? "insufficient data"} repetitions/minute`;
    return;
  }
  try {
    await motionCapture.start();
    motionCaptureActive = true;
    motionButton.textContent = "Stop motion capture";
    motionStatus.textContent = "Motion capture active. Keep the phone with the participant while analyzing.";
  } catch (error) {
    motionStatus.textContent = `Motion capture unavailable: ${error.message}`;
  }
});

exportButton.addEventListener("click", () => {
  if (!latestResults) return;
  const blob = new Blob([JSON.stringify(latestResults, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "strain-check-analysis.json";
  document.body.append(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 1000);
});

languageSelect.addEventListener("change", () => {
  if (latestResults) renderGuidance(latestResults);
});

printButton.addEventListener("click", () => {
  if (!latestResults) return;
  const reportWindow = window.open("", "_blank");
  if (!reportWindow) {
    status.textContent = "The report window was blocked. Allow pop-ups and try again.";
    return;
  }
  const report = buildPrintableReport(latestResults);
  reportWindow.document.open();
  reportWindow.document.write(report);
  reportWindow.document.close();
  reportWindow.onload = () => {
    reportWindow.focus();
    reportWindow.print();
  };
  window.setTimeout(() => {
    if (!reportWindow.closed) {
      reportWindow.focus();
      reportWindow.print();
    }
  }, 500);
});

exportVideoButton.addEventListener("click", () => {
  if (!latestAnnotatedVideo) {
    status.textContent = "Run Analyze full video first; the annotated download will appear when processing finishes.";
    return;
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(latestAnnotatedVideo);
  link.download = "strain-check-annotated.webm";
  document.body.append(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 1000);
});

function createAnnotatedVideoRecorder() {
  if (!overlay.captureStream || !window.MediaRecorder) return null;
  const stream = overlay.captureStream(30);
  const mimeTypes = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const mimeType = mimeTypes.find((candidate) => MediaRecorder.isTypeSupported(candidate));
  return new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
}

function finishRecording(recorder) {
  return new Promise((resolve) => {
    const chunks = [];
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) chunks.push(event.data);
    });
    recorder.addEventListener("stop", () => {
      resolve(chunks.length ? new Blob(chunks, { type: recorder.mimeType || "video/webm" }) : null);
    }, { once: true });
    recorder.stop();
  });
}

function seekTo(time) {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.001) {
      resolve();
      return;
    }
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = Math.min(Math.max(0, time), video.duration);
  });
}

function summarize(frames, frequency) {
  const complete = frames.filter((frame) => frame.rula.score !== null);
  const rulaAverage = average(complete.map((frame) => frame.rula.score));
  const rebaAverage = average(complete.map((frame) => frame.reba.score));
  const rulaRisk = riskFromAverage(rulaAverage, "RULA");
  const rebaRisk = riskFromAverage(rebaAverage, "REBA");
  const riskLevel = riskRank(rulaRisk) >= riskRank(rebaRisk) ? rulaRisk : rebaRisk;
  const result = {
    sourceFile: videoFile.files[0]?.name ?? "local-video",
    framesAnalyzed: frames.length,
    framesWithPose: frames.filter((frame) => frame.poseDetected).length,
    framesWithCompleteScores: complete.length,
    averageRula: rulaAverage,
    averageReba: rebaAverage,
    rulaRiskLevel: rulaRisk,
    rebaRiskLevel: rebaRisk,
    overallRiskLevel: riskLevel,
    motion: frequency,
    frames,
  };
  result.heatmap = drawHeatmap(heatmap, frames);
  result.guidance = buildGuidance(riskLevel, languageSelect.value);
  return result;
}

function applyMotionEstimate(frames, repetitionsPerMinute) {
  for (const frame of frames) {
    frame.rula = scoreRula(frame.angles, repetitionsPerMinute);
    frame.reba = scoreReba(frame.angles, repetitionsPerMinute);
  }
}

function average(values) {
  return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : null;
}

function renderSummary(results) {
  frameCount.textContent = results.framesAnalyzed;
  poseCount.textContent = `${results.framesWithPose}/${results.framesAnalyzed}`;
  rulaValue.textContent = results.averageRula ?? "insufficient data";
  rebaValue.textContent = results.averageReba ?? "insufficient data";
  renderGuidance(results);
}

function renderGuidance(results) {
  const guidance = buildGuidance(results.overallRiskLevel, languageSelect.value);
  results.guidance = guidance;
  guidanceTitle.textContent = guidance.title;
  guidanceMessage.textContent = guidance.message;
  guidanceDisclaimer.textContent = guidance.disclaimer;
}

function riskFromAverage(score, standard) {
  if (score === null) return "insufficient_data";
  if (standard === "RULA") return score <= 2 ? "low" : score <= 4 ? "medium" : score <= 6 ? "high" : "very_high";
  return score <= 1 ? "negligible" : score <= 3 ? "low" : score <= 7 ? "medium" : score <= 10 ? "high" : "very_high";
}

function riskRank(level) {
  return { insufficient_data: 0, negligible: 1, low: 2, medium: 3, high: 4, very_high: 5 }[level] ?? 0;
}

function buildPrintableReport(results) {
  const guidance = results.guidance;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Strain Check report</title><style>body{font:16px Arial;max-width:760px;margin:2rem auto;color:#091a33}h1{color:#0b3568}table{border-collapse:collapse;width:100%}td,th{border:1px solid #a8c6e3;padding:.6rem;text-align:left}.note{background:#e9f3fd;padding:1rem;margin-top:1rem}@media print{button{display:none}}</style></head><body><h1>Strain Check screening report</h1><p>Source: ${escapeHtml(results.sourceFile)}<br>Frames analyzed: ${results.framesAnalyzed}<br>Pose detected: ${results.framesWithPose}/${results.framesAnalyzed}</p><table><tr><th>Measure</th><th>Result</th><th>Risk level</th></tr><tr><td>RULA</td><td>${results.averageRula ?? "insufficient data"}</td><td>${results.rulaRiskLevel}</td></tr><tr><td>REBA</td><td>${results.averageReba ?? "insufficient data"}</td><td>${results.rebaRiskLevel}</td></tr></table><div class="note"><h2>${guidance.title}</h2><p>${guidance.message}</p><p>${guidance.disclaimer}</p></div><p>Generated locally in the browser. Review the original video and official RULA/REBA worksheets before making a workplace decision.</p></body></html>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}
