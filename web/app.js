import {
  FilesetResolver,
  PoseLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm";
import { computeJointAngles } from "./angles.js";
import { scoreReba, scoreRula } from "./scoring.js";

const videoFile = document.querySelector("#video-file");
const video = document.querySelector("#video");
const analyzeButton = document.querySelector("#analyze");
const exportButton = document.querySelector("#export");
const sampleRate = document.querySelector("#sample-rate");
const progress = document.querySelector("#progress");
const status = document.querySelector("#status");
const frameCount = document.querySelector("#frames");
const poseCount = document.querySelector("#poses");
const rulaValue = document.querySelector("#rula");
const rebaValue = document.querySelector("#reba");
const modelUrl = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let poseLandmarker;
let latestResults;

async function createPoseLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm",
  );
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: modelUrl, delegate: "CPU" },
    runningMode: "VIDEO",
    numPoses: 1,
  });
}

videoFile.addEventListener("change", () => {
  const [file] = videoFile.files;
  if (!file) return;
  video.src = URL.createObjectURL(file);
  analyzeButton.disabled = true;
  analyzeButton.title = "Preparing the pose model";
  status.textContent = "Video loaded locally. Preparing pose model...";
  createPoseLandmarker()
    .then((landmarker) => {
      poseLandmarker = landmarker;
      analyzeButton.disabled = false;
      analyzeButton.title = "Analyze the selected video";
      status.textContent = "Ready. Analyze the full video when you are ready.";
    })
    .catch((error) => {
      analyzeButton.disabled = true;
      analyzeButton.title = "The pose model could not be loaded";
      status.textContent = `Could not load pose model: ${error.message}`;
    });
});

analyzeButton.addEventListener("click", async () => {
  if (!poseLandmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
  analyzeButton.disabled = true;
  exportButton.disabled = true;
  const results = [];
  const framesPerSecond = Number(sampleRate.value);
  const step = 1 / Math.max(1, Math.min(30, framesPerSecond));
  const originalTime = video.currentTime;
  try {
    for (let time = 0; time < video.duration; time += step) {
      await seekTo(time);
      const detection = poseLandmarker.detectForVideo(video, time * 1000);
      const landmarks = detection.landmarks?.[0] ?? null;
      const angles = landmarks ? computeJointAngles(landmarks) : { shoulder: null, elbow: null, knee: null, trunk: null, neck: null };
      results.push({
        timestampSeconds: time,
        poseDetected: Boolean(landmarks),
        angles,
        rula: scoreRula(angles),
        reba: scoreReba(angles),
      });
      progress.value = Math.min(1, time / video.duration);
      status.textContent = `Analyzing ${Math.round(progress.value * 100)}%...`;
    }
    latestResults = summarize(results);
    renderSummary(latestResults);
    exportButton.disabled = false;
    status.textContent = `Finished. ${latestResults.framesWithPose} of ${latestResults.framesAnalyzed} sampled frames contained a pose.`;
  } catch (error) {
    status.textContent = `Analysis failed: ${error.message}`;
  } finally {
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
  link.click();
  URL.revokeObjectURL(link.href);
});

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
