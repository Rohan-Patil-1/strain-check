import {
  FilesetResolver,
  PoseLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/+esm";
import { computeJointAngles } from "./angles.js";
import { drawAnnotatedFrame, postureStatus } from "./overlay.js";
import { scoreReba, scoreRula } from "./scoring.js";

const videoFile = document.querySelector("#video-file");
const video = document.querySelector("#video");
const analyzeButton = document.querySelector("#analyze");
const exportButton = document.querySelector("#export");
const exportVideoButton = document.querySelector("#export-video");
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
      const rula = scoreRula(angles);
      const reba = scoreReba(angles);
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
    latestResults = summarize(results);
    renderSummary(latestResults);
    exportButton.disabled = false;
    exportVideoButton.disabled = !latestAnnotatedVideo;
    status.textContent = `Finished. ${latestResults.framesWithPose} of ${latestResults.framesAnalyzed} sampled frames contained a pose.`;
  } catch (error) {
    status.textContent = `Analysis failed: ${error.message}`;
  } finally {
    if (recorder && recorder.state !== "inactive") recorder.stop();
    await seekTo(originalTime);
    analyzeButton.disabled = false;
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

function summarize(frames) {
  const complete = frames.filter((frame) => frame.rula.score !== null);
  const rulaAverage = average(complete.map((frame) => frame.rula.score));
  const rebaAverage = average(complete.map((frame) => frame.reba.score));
  return {
    sourceFile: videoFile.files[0]?.name ?? "local-video",
    framesAnalyzed: frames.length,
    framesWithPose: frames.filter((frame) => frame.poseDetected).length,
    framesWithCompleteScores: complete.length,
    averageRula: rulaAverage,
    averageReba: rebaAverage,
    frames,
  };
}

function average(values) {
  return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : null;
}

function renderSummary(results) {
  frameCount.textContent = results.framesAnalyzed;
  poseCount.textContent = `${results.framesWithPose}/${results.framesAnalyzed}`;
  rulaValue.textContent = results.averageRula ?? "insufficient data";
  rebaValue.textContent = results.averageReba ?? "insufficient data";
}
