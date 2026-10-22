# Week 6-8 Task List

## Week 6: IMU fusion and repetition frequency

### Goal

Use optional phone accelerometer data to estimate how often a task repeats, then include that information as a transparent score modifier.

### Development tasks

- [x] Read accelerometer CSV files with timestamp, `ax`, `ay`, and `az` columns.
- [x] Validate that timestamps increase correctly.
- [x] Calculate acceleration magnitude.
- [x] Detect separated local peaks as repetition events.
- [x] Calculate repetitions per minute.
- [x] Add a frequency modifier to RULA/REBA output.
- [x] Connect the optional IMU result to the main analysis command.
- [x] Test CSV errors, peak detection, and frequency scoring.

### Required user tasks

- [ ] Export accelerometer data from a phone if available.
- [ ] Save it beside the matching video in `data/raw/`.
- [ ] Make sure the CSV has `timestamp`, `ax`, `ay`, and `az` columns.
- [ ] Check whether the detected repetition count matches the video.

### Example command

```powershell
py -m strain_check.analysis data/derived/lifting-p001-01-left-side.json --imu-csv data/raw/lifting-p001-01-left-side.csv
```

### Week 6 completion criteria

- [ ] At least one video has matching IMU data.
- [ ] The detected repetition count is written down.
- [ ] The frequency modifier is explained in the analysis result.
- [ ] Any mismatch between the video and IMU estimate is documented.

## Week 7: Validation round 1

### Goal

Compare the system's risk labels with manual labels from the same clips.

### Development tasks

- [x] Load clip-level observed and predicted labels.
- [x] Build a confusion matrix.
- [x] Calculate observed agreement.
- [x] Calculate Cohen's kappa.
- [x] Add command-line validation reporting.
- [x] Test perfect agreement and disagreement cases.

### Required user tasks

- [ ] Select 10-15 clips across lifting, reaching, and repetitive scanning when possible.
- [ ] Watch each clip and assign a manual risk label.
- [ ] Use only these labels: `low`, `medium`, `high`, or `very_high`.
- [ ] Record your labels in `data/validation-round-1.csv`.
- [ ] Copy the system's predicted label for each clip into the same file.
- [ ] Review mismatches and write a short reason for each one.
- [ ] Ask a PT or ergonomics professional to label a small sample if available.

### Validation CSV format

```csv
clip_id,observed_label,predicted_label
lifting-p001-01,low,low
reaching-p001-01,medium,high
scanning-p001-01,high,medium
```

### Example command

```powershell
py -m strain_check.validation data/validation-round-1.csv
```

### Week 7 completion criteria

- [ ] At least 10 labeled clips are compared, or the smaller available sample is documented.
- [ ] Cohen's kappa is recorded.
- [ ] The confusion matrix is reviewed.
- [ ] Systematic errors are listed.
- [ ] Camera, lighting, occlusion, or scoring problems are separated from labeling disagreements.

## Week 8: Browser pose port

### Goal

Run pose extraction in the browser so the video stays on the user's device and does not need a Python server.

### Development tasks

- [x] Load MediaPipe Tasks Vision in the browser.
- [x] Allow a user to select a local video.
- [x] Process a full video timeline at a chosen sampling rate.
- [x] Calculate joint angles in browser JavaScript.
- [x] Calculate prototype RULA/REBA results in browser JavaScript.
- [x] Show progress and summary scores.
- [x] Export browser results as JSON.
- [x] Keep video processing client-side.

### Required user tasks

- [ ] Start the browser server from the `codebase` folder.
- [ ] Open `http://localhost:8000`.
- [ ] Select a pilot video.
- [ ] Wait until the page says the pose model is ready.
- [ ] Run the full-video analysis.
- [ ] Compare browser results with the Python results for the same clip.
- [ ] Download and keep the browser JSON output.
- [ ] Record any differences between Python and browser results.

### Start the browser app

```powershell
py -m http.server 8000 --directory web
```

Open:

```text
http://localhost:8000
```

### Week 8 completion criteria

- [ ] A local video can be selected in the browser.
- [ ] The browser detects poses in sampled frames.
- [ ] The browser produces angle and risk summaries.
- [ ] The result JSON downloads successfully.
- [ ] Python and browser results are compared for at least one clip.
- [ ] Any differences are documented before further UI or deployment work.

## Important limitation

The RULA/REBA logic is still a prototype screening implementation. Cross-check results against official worksheets and obtain qualified ergonomics review before treating scores as formal workplace assessments.
