# Week 2: self-recording protocol

This protocol creates a small, repeatable validation set for Week 3's pose pipeline. It is not a training-data collection exercise. The scoring method is rule-based, so recordings are used to check whether pose extraction and later RULA/REBA calculations behave sensibly.

## What Week 2 means in plain language

By the end of this week we should know:

1. What we will record.
2. How every clip will be recorded consistently.
3. What information must be written down beside each clip.
4. Which public datasets are useful for sanity checks.
5. What questions remain for a PT or ergonomics reviewer.

The development plan already identifies Human3.6M for pose sanity checks and PAMAP2/WISDM for motion-signal sanity checks. They are comparison references, not substitutes for task-specific phone recordings.

## Recording plan

Record 3 to 5 clips for each task. A first pass of 9 clips is enough to begin Week 3; expand to 10 to 15 clips before Week 7 validation.

| Task | Example activity | Repetitions | Main posture to capture |
| --- | --- | ---: | --- |
| Lifting | Lift a light object from floor to waist-height shelf | 5 | Squat/hinge, trunk flexion, shoulder elevation |
| Reaching | Move objects to a shelf at or above shoulder height | 5 | Shoulder elevation, elbow angle, neck/trunk position |
| Repetitive scanning | Scan and place small items at a steady pace | 20-30 seconds | Repetition rate, wrist/arm motion, trunk stability |

Use a light, ordinary object. Do not perform an activity that causes pain or requires unsafe load. The prototype is not medical advice and the recordings should not be treated as a diagnosis.

## Camera setup

- Use a phone in landscape orientation on a stable surface or tripod.
- Record the whole body, including feet and the working area, with space above the head.
- Start with a side view at roughly hip height; record a second front or diagonal view when practical.
- Keep the camera stationary and about 2 to 4 metres away.
- Use good, even lighting and avoid strong backlighting.
- Record about 20 seconds per clip, including 2 seconds still at the start and end.
- Do not include faces, names, screens, or other identifying information unless needed and explicitly consented to.

The side-view recommendation is a starting assumption for the first prototype. Week 4 will test how much camera angle and occlusion affect the extracted joint angles.

## Clip naming and metadata

Use this pattern:

```text
<task>-<participant>-<sequence>-<camera-view>.mp4
```

Example: `lifting-p001-01-left-side.mp4`

For each clip, record:

- `clip_id`: unique identifier matching the filename.
- `task`: `lifting`, `reaching`, or `repetitive_scanning`.
- `participant_id`: anonymous label such as `p001`.
- `duration_seconds`: approximate duration.
- `camera_view`: `left_side`, `right_side`, `front`, or `diagonal`.
- `consent_recorded`: yes/no before any analysis.
- repetitions or load description, if relevant, in a separate notes field.

Do not put names, contact details, or other identifying information in the manifest.

## Suggested manifest row

```json
{
  "clip_id": "lifting-p001-01-left-side",
  "task": "lifting",
  "video_path": "data/raw/lifting-p001-01-left-side.mp4",
  "duration_seconds": 20,
  "camera_view": "left_side",
  "participant_id": "p001",
  "consent_recorded": true
}
```

## Consent and privacy checklist

Before recording, confirm that the participant understands:

- the clip is for a prototype research/validation workflow;
- the video remains local unless they explicitly approve sharing it;
- the clip can be withdrawn or deleted;
- participation is voluntary and they can stop at any time.

Store raw video locally. Do not commit it to Git. Share only de-identified metadata or derived landmarks unless a separate approval permits video sharing.

## Week 2 completion checklist

- [ ] Confirm the three task definitions.
- [ ] Record at least one pilot clip for each task.
- [ ] Create a metadata row for every pilot clip.
- [ ] Confirm the camera framing is usable before recording the full set.
- [ ] Identify at least one PT/ergonomics contact or document that outreach is pending.
- [ ] Record open questions for Week 3, especially camera view and occlusion cases.

## Week 3 handoff

Give the pose-pipeline work:

- the manifest rows;
- the local paths to the pilot videos;
- the camera-view notes;
- any clips with occlusion, poor lighting, or incomplete body framing.

The pose pipeline should report confidence and missing landmarks rather than silently treating a bad frame as a valid measurement.
