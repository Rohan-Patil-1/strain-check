# Strain Check Project Status

Updated: November 2, 2026

## Completed

### Python prototype

- Video frame processing with MediaPipe Pose and OpenCV.
- Frame timestamps, pose detection status, visibility, and missing-pose reporting.
- Shoulder, elbow, knee, trunk, and neck angle calculations.
- Low-confidence and missing-landmark handling.
- Prototype deterministic RULA and REBA scoring.
- Explicit incomplete-score results instead of guessed values.
- Optional accelerometer CSV ingestion.
- Repetition peak detection and repetitions-per-minute estimation.
- Frequency modifier for RULA/REBA results.
- Validation CSV loading, confusion matrix, agreement, and Cohen's kappa.

### Browser prototype

- Local video selection and client-side MediaPipe Tasks Vision processing.
- Full-video sampling with progress reporting.
- Joint-angle calculation and RULA/REBA scoring in JavaScript.
- Skeleton overlay with posture status and angle labels.
- Optional phone DeviceMotion capture for repetition estimation.
- Body-region strain heatmap.
- Plain-language guidance in English, Spanish, and Hindi.
- JSON result export.
- Annotated WebM video export.
- Printable or saveable screening report through the browser print dialog.
- Videos remain in the browser and are not uploaded by the application.

### Verification

- Python test suite: **15 tests passed**.
- Python source compilation: passed.
- Browser JavaScript syntax checks: passed.
- Local static browser server check: passed.

## Remaining work

The remaining items require real project data, human review, or deployment access:

1. Record safe, consented pilot videos for lifting, reaching, and repetitive scanning.
2. Store the videos locally in `data/raw/`; do not commit them to Git.
3. Create metadata records for each clip.
4. Run the Python pose and analysis pipeline on the real clips.
5. Export matching phone accelerometer CSV data when available.
6. Compare detected repetition counts with the original videos.
7. Select 10–15 clips for validation.
8. Assign manual labels: `low`, `medium`, `high`, or `very_high`.
9. Run validation and record agreement and Cohen's kappa.
10. Compare Python and browser results for at least one identical clip.
11. Cross-check scores against official RULA and REBA worksheets.
12. Obtain review from a qualified ergonomics or physical-therapy professional.
13. Perform final testing on Android Chrome and iOS Safari.
14. Commit and push the latest changes to GitHub.
15. Enable and verify GitHub Pages deployment.
16. Complete the weekly progress tracker with actual hours and outcomes.

## Run the project

From the `codebase` directory:

```powershell
py -m pip install -e ".[video,dev]"
py -m pytest
```

Process a real video:

```powershell
py -m strain_check.pose_pipeline data/raw/example.mp4
py -m strain_check.analysis data/derived/example.json --output data/derived/example-analysis.json
```

Start the browser application:

```powershell
py -m http.server 8000 --directory web
```

Open `http://localhost:8000`, select a local video, and run the analysis.

## Important limitation

Strain Check is an engineering prototype and screening aid. Its output is not medical, legal, or formal workplace-safety advice. Real use requires validation, official worksheet review, and qualified ergonomics oversight.

