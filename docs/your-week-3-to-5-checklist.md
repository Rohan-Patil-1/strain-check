# Your Week 3-8 Checklist

The coding work for Weeks 3 through 8 is now in the repository. Your main responsibility is to provide realistic input, label results, and compare the Python and browser outputs.

## Before you start

- [ ] Use a phone and a stable surface or tripod.
- [ ] Choose an anonymous participant label such as `p001`.
- [ ] Confirm the participant understands the recording and gives consent.
- [ ] Do not record an unsafe load or an activity that causes pain.

## Record the pilot videos

Record one short clip for each task first:

- [ ] Lifting: lift a light object from floor or low position to waist height five times.
- [ ] Reaching: move objects to a shelf at or above shoulder height five times.
- [ ] Repetitive scanning: scan and place small objects continuously for about 20 seconds.

For every clip:

- [ ] Use landscape orientation.
- [ ] Keep the phone stationary, about 2-4 metres away.
- [ ] Keep the entire body and working area visible.
- [ ] Use a side view first; add a front or diagonal view if practical.
- [ ] Use even lighting and avoid strong backlighting.
- [ ] Keep the clip near 20 seconds, with a short still period at the start and end.
- [ ] Do not include unnecessary names, faces, screens, or identifying information.

Put the clips in:

```text
data/raw/
```

Use names like:

```text
lifting-p001-01-left-side.mp4
reaching-p001-01-left-side.mp4
repetitive-scanning-p001-01-left-side.mp4
```

## Create the metadata

For each clip, record the clip ID, task, path, duration, camera view, participant ID, and consent. The `ClipRecord` class in `src/strain_check/data.py` enforces these required fields.

## Run the code

From the `codebase` directory, install the video dependencies:

```powershell
py -m pip install -e ".[video,dev]"
```

Process a video into pose landmarks:

```powershell
py -m strain_check.pose_pipeline data/raw/lifting-p001-01-left-side.mp4
```

This writes a JSON file under `data/derived/`.

Analyze the landmarks into angles and scores:

```powershell
py -m strain_check.analysis data/derived/lifting-p001-01-left-side.json --output data/derived/lifting-p001-analysis.json
```

Run the automated tests:

```powershell
py -m pytest
```

## Review the results

For each analyzed clip, check:

- [ ] The number of processed frames is reasonable.
- [ ] Most frames have `pose_detected: true`.
- [ ] Missing-pose frames are visible in the JSON rather than silently ignored.
- [ ] The angle values change when the posture changes.
- [ ] A neutral posture does not receive an unexpectedly high score.
- [ ] A clearly bent or loaded posture scores higher than a neutral posture.
- [ ] Any poor result is explained by framing, lighting, blur, or occlusion.

## Your Week 3-5 deliverable

You do not need to create the pose, angle, or scoring code yourself. Your deliverable is:

- three pilot clips;
- metadata for those clips;
- the generated files under `data/derived/`;
- notes about clips or frames that look unreliable;
- a short note on whether the scores match what you observed in the video.

The RULA/REBA implementation is a prototype screening engine. Its results must be cross-checked against published worksheets and, ideally, reviewed by an ergonomics or physical-therapy professional before being treated as formal assessments.

## Week 6: IMU and repetition data

- [ ] If your phone supports it, export accelerometer data for at least one recorded video.
- [ ] Save the CSV in `data/raw/` beside the matching video.
- [ ] Confirm the CSV has `timestamp`, `ax`, `ay`, and `az` columns.
- [ ] Run the analysis with the matching IMU file:

```powershell
py -m strain_check.analysis data/derived/lifting-p001-01-left-side.json --imu-csv data/raw/lifting-p001-01-left-side.csv
```

- [ ] Compare the detected repetitions per minute with the video.
- [ ] Note whether the estimated frequency looks too high, too low, or reasonable.
- [ ] Record any phone-sensor problems, missing data, or incorrect timestamps.

## Week 7: validation round 1

- [ ] Select 10-15 clips across lifting, reaching, and repetitive scanning if available.
- [ ] Watch each clip and assign one manual label: `low`, `medium`, `high`, or `very_high`.
- [ ] Create `data/validation-round-1.csv` using this format:

```csv
clip_id,observed_label,predicted_label
lifting-p001-01,low,low
reaching-p001-01,medium,high
```

- [ ] Copy each system prediction into `predicted_label`.
- [ ] Write down why each mismatch may have happened.
- [ ] Ask a PT or ergonomics professional to label a small sample if possible.
- [ ] Run the validation report:

```powershell
py -m strain_check.validation data/validation-round-1.csv
```

- [ ] Record the agreement percentage and Cohen's kappa.
- [ ] Keep the confusion matrix and list of systematic errors.

## Week 8: browser validation

- [ ] Start the browser app from the `codebase` folder:

```powershell
py -m http.server 8000 --directory web
```

- [ ] Open `http://localhost:8000`.
- [ ] Select one of the same videos used by the Python pipeline.
- [ ] Wait until the page says the pose model is ready.
- [ ] Click **Analyze full video**.
- [ ] Review frames analyzed, pose detections, RULA, and REBA.
- [ ] Click **Download results** and save the JSON file.
- [ ] Compare the browser scores with the Python scores for the same clip.
- [ ] Record any differences and possible causes.

## Final Week 3-8 handoff

- [ ] Three or more usable videos are available.
- [ ] At least one video has matching IMU data, if phone export is available.
- [ ] Validation labels and Cohen's kappa are recorded.
- [ ] Python and browser results have been compared.
- [ ] Camera, lighting, occlusion, and scoring problems are documented.
- [ ] The progress tracker has actual hours and completed tasks filled in.
