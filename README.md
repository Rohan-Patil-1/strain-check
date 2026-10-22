# Strain Check

Client-side prototype for assessing ergonomic strain from ordinary phone video.

## Current milestone: Weeks 3-5 implementation

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

For the public prototype URL, follow the [public deployment guide](docs/public-deployment.md). A GitHub Pages workflow is ready in `.github/workflows/deploy-pages.yml` and publishes only the `web` folder.

## Planned next step

The Python flow now supports: video -> MediaPipe landmarks -> joint angles -> prototype RULA/REBA scores, with optional IMU repetition-frequency fusion and validation metrics.

The first Week 8 browser pose check is in [web/README.md](web/README.md). It processes a selected local video frame with MediaPipe Tasks Vision.

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
