# Week 3 Task List: Python Pose Pipeline

## Week 3 goal

Build the first working pipeline that takes a phone video as input and produces body landmarks for each readable video frame.

```text
video file -> OpenCV frames -> MediaPipe Pose -> saved landmarks
```

This week is about getting reliable pose data out of video. RULA/REBA scoring is not a Week 3 task yet.

## Tasks

### 1. Prepare the inputs

- [ ] Put the pilot videos in `data/raw/`.
- [ ] Use one lifting, one reaching, and one repetitive-scanning clip.
- [ ] Confirm each clip is about 20 seconds and shows the full body.
- [ ] Create or check one metadata record per clip.
- [ ] Confirm that each record has consent and an anonymous participant ID.

### 2. Set up the Python environment

- [ ] Create a virtual environment.
- [ ] Install `mediapipe`, `opencv-python`, `numpy`, and `pytest`.
- [ ] Confirm Python can import OpenCV and MediaPipe.
- [ ] Keep raw videos excluded from Git through `.gitignore`.

Commands from the `codebase` directory:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install mediapipe opencv-python numpy pytest
```

### 3. Implement video reading

Create a pose-processing module that:

- [ ] Opens a video with OpenCV.
- [ ] Reads frames in order.
- [ ] Records frame number, timestamp, width, height, and FPS.
- [ ] Stops cleanly at the end of the video.
- [ ] Raises a clear error when the video cannot be opened.

### 4. Run MediaPipe Pose

For every frame:

- [ ] Convert the OpenCV BGR frame to RGB.
- [ ] Send the RGB frame to MediaPipe Pose.
- [ ] Extract the available landmarks.
- [ ] Store normalized `x`, `y`, `z`, and visibility/confidence values.
- [ ] Record frames where no pose is detected.
- [ ] Do not silently replace missing landmarks with valid-looking values.

### 5. Save a reusable output

Save one derived output file per input clip under `data/derived/`.

Each frame record should contain at least:

- `frame_index`
- `timestamp_seconds`
- `landmarks`
- `pose_detected`
- `min_visibility` or an equivalent confidence summary

JSON is acceptable for the first prototype. The output must be readable by the angle-calculation work in Week 4.

### 6. Add tests

- [ ] Test that a known landmark fixture can be converted to the expected output shape.
- [ ] Test that an unreadable video produces a clear error.
- [ ] Test that a frame with no detected pose is marked missing.
- [ ] Test that frame indices and timestamps increase in order.
- [ ] Run the tests with `py -m pytest`.

Do not require a real phone video for unit tests. Use small fixtures or mocked MediaPipe results so tests remain fast and repeatable.

### 7. Run a pilot analysis

- [ ] Process all three pilot clips.
- [ ] Confirm the output file exists for each clip.
- [ ] Compare the number of output records with the number of video frames.
- [ ] Note the percentage of frames without a detected pose.
- [ ] Record problems with lighting, framing, motion blur, or occlusion.
- [ ] Keep the original videos unchanged so the run can be repeated.

## Week 3 acceptance criteria

Week 3 is complete when:

- [ ] A command can process a video from `data/raw/`.
- [ ] The command produces a derived landmark file in `data/derived/`.
- [ ] The output includes frame timing and confidence information.
- [ ] Missing pose detections are visible rather than hidden.
- [ ] The tests pass.
- [ ] At least one pilot clip has been processed successfully.
- [ ] Known limitations are written down for Week 4.

## Suggested command interface

The exact implementation can change, but aim for a command like:

```powershell
py -m strain_check.pose_pipeline data/raw/lifting-p001-01-left-side.mp4
```

## What to report at the end of Week 3

Record these items in the progress tracker:

- Tasks completed.
- Number of videos processed.
- Number of frames processed per video.
- Approximate percentage of frames with a detected pose.
- Any camera or occlusion problems.
- Tasks carried over into Week 4.
- Hours worked.
