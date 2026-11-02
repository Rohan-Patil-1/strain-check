# Strain Check

Client-side prototype for assessing ergonomic strain from ordinary phone video.

## Current milestone: Prototype implementation complete

Week 2 establishes the research and data plan before pose extraction begins. The project currently defines:

- Three target tasks: lifting, reaching, and repetitive scanning.
- A self-recording protocol for short validation clips.
- A machine-readable clip manifest so later pose and scoring work can be reproduced.
- Public datasets to use for sanity checks, not model training.

See [the Week 2 protocol](docs/week-2-data-collection-protocol.md) and [the data format](data/README.md).

The Week 3 pose pipeline is implemented in `src/strain_check/pose_pipeline.py` and documented in the [Week 3 task list](docs/week-3-task-list.md).

[Week 4 angle calculation](docs/week-4-task-list.md) is implemented in `src/strain_check/angles.py`, including confidence checks and missing-landmark handling.

[Week 5 RULA/REBA scoring](docs/week-5-task-list.md) is implemented in `src/strain_check/scoring.py`. It is a transparent prototype screening engine and must be cross-checked against published worksheets before formal use.

The [personal Week 3-5 checklist](docs/your-week-3-to-5-checklist.md) explains the few steps that require your recorded videos and review.

The [Week 6-8 task list](docs/week-6-to-8-task-list.md) covers IMU fusion, validation round 1, and the browser port. The personal checklist has been extended through Week 8.

The browser prototype now also includes:

- Optional phone DeviceMotion capture and repetition-frequency estimation.
- Body-region strain heatmap visualization.
- Plain-language guidance in English, Spanish, and Hindi.
- Local printable/saveable screening reports.
- JSON export containing frame results, scores, motion estimates, heatmap values, and guidance.

The automated Python test suite currently passes all 15 tests. Python compilation and browser JavaScript syntax checks also pass.

For the public prototype URL, follow the [public deployment guide](docs/public-deployment.md). A GitHub Pages workflow is ready in `.github/workflows/deploy-pages.yml` and publishes only the `web` folder.

## Remaining project work

The software prototype is ready for real-world validation. The remaining work requires project inputs and human review:

1. Record consented pilot videos and place them in `data/raw/`.
2. Process the videos with the Python pipeline and browser application.
3. Add matching phone accelerometer CSV data when available.
4. Manually label 10–15 clips and run validation round 1.
5. Compare Python and browser results for the same clip.
6. Cross-check the prototype scores against official RULA/REBA worksheets.
7. Obtain review from a qualified ergonomics or physical-therapy professional.
8. Complete final mobile/browser testing and deploy with the [public deployment guide](docs/public-deployment.md).

Do not treat the prototype output as medical, legal, or formal workplace-safety advice.

## Implemented pipeline

The Python flow supports: video -> MediaPipe landmarks -> joint angles -> prototype RULA/REBA scores, with optional IMU repetition-frequency fusion and validation metrics.

The browser flow supports: local video -> MediaPipe Tasks Vision landmarks -> joint angles -> prototype RULA/REBA scores -> overlay, heatmap, guidance, and downloadable reports. See [web/README.md](web/README.md).

## Development setup

Use Python 3.11 or newer. From this directory:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -e ".[video,dev]"
py -m pytest
```

Process a video and analyze its output:

```powershell
py -m strain_check.pose_pipeline data/raw/lifting-p001-01-left-side.mp4
py -m strain_check.analysis data/derived/lifting-p001-01-left-side.json --output data/derived/lifting-p001-analysis.json
py -m strain_check.analysis data/derived/lifting-p001-01-left-side.json --imu-csv data/raw/lifting-p001-01-left-side.csv
py -m strain_check.validation data/validation-round-1.csv
```
