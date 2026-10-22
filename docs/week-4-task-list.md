# Week 4 Task List: Angle Accuracy & Calibration

## Week 4 goal

Validate whether the basic joint angles extracted from video are accurate enough to be trusted in the next phase. This week is about calibration, camera assumptions, and handling missing or low-confidence landmarks.

```text
landmarks from video -> compute joint angles -> compare against known-good poses -> improve assumptions
```

The core objective is not final RULA/REBA scoring yet. The objective is to make sure the extracted angles are stable and explainable before they feed into the risk logic.

## Tasks

### 1. Confirm the angle set to compute

- [ ] Compute shoulder angle.
- [ ] Compute elbow angle.
- [ ] Compute knee angle.
- [ ] Compute neck/trunk orientation angle.
- [ ] Use the same landmark definitions across every clip.
- [ ] Document which MediaPipe points are being used for each angle.

Suggested starting set:

- Shoulder angle: between torso and upper arm.
- Elbow angle: between upper arm and forearm.
- Knee angle: between thigh and lower leg.
- Trunk angle: relative to vertical axis or a stable reference line.
- Neck angle: head relative to torso or vertical reference.

### 2. Build the angle calculator

- [ ] Create a function to compute an angle from three landmarks.
- [ ] Normalize the angle to a consistent range (for example 0–180 degrees).
- [ ] Handle points that are missing or low-confidence.
- [ ] Return `None` or a flagged value when angle calculation is not valid.
- [ ] Log which landmark pairs are missing for each frame.

### 3. Validate angle math on simple known poses

- [ ] Test a straight-arm pose.
- [ ] Test a bent-arm pose.
- [ ] Test a neutral standing pose.
- [ ] Test a bent-knee pose.
- [ ] Test a trunk-forward or trunk-leaning pose.

Expected behavior:

- Straight segments should produce near-180° values.
- Bent joints should produce smaller values.
- Frames with poor detection should not produce fake “good” results.

### 4. Evaluate camera angle and distance assumptions

- [ ] Run the same pose or movement from a side view.
- [ ] Repeat from a front or diagonal view.
- [ ] Compare the angle values across viewpoints.
- [ ] Identify which tasks are easiest to measure reliably.
- [ ] Record the supported camera conditions for the prototype.

Main questions:

- Does the same movement produce similar angles from different valid angles?
- Does a side view produce more stable trunk and elbow angles than a front view?
- Does camera distance affect the computed vertical reference?

### 5. Handle occlusion and low-confidence landmarks

- [ ] Ignore angle calculations when key landmarks are missing.
- [ ] Flag frames with low confidence rather than auto-correcting them.
- [ ] Record how often a clip has missing landmarks.
- [ ] Design fallback logic for the next stage if a landmark is temporarily invisible.

### 6. Create a calibration summary document

Add a short document or section covering:

- The allowed camera positions.
- The expected distance to the subject.
- The expected framing rules.
- Which angles are reliable vs. noisy.
- Which task types are hardest to estimate.

This becomes the prototype assumptions document for later validation.

### 7. Add angle-focused tests

- [ ] Test a 180° straight line case.
- [ ] Test a 90° bent angle case.
- [ ] Test missing-landmark rejection.
- [ ] Test a clip with low-confidence points does not give a valid angle.
- [ ] Test per-frame angle output shape.

### 8. Review pilot clips and identify issues

- [ ] Look at the current pilot clips.
- [ ] Mark clips that have good alignment and usable body visibility.
- [ ] Mark clips with poor lighting, blurring, or body partial occlusion.
- [ ] Decide which clips are good enough for the next validation stage.

## Week 4 acceptance criteria

Week 4 is complete when:

- [ ] The project computes joint angles from detected landmarks.
- [ ] The angle values behave sensibly for simple known poses.
- [ ] Missing landmarks are handled explicitly.
- [ ] Camera assumptions are documented.
- [ ] At least one pilot clip has been reviewed with a clear assessment of quality.
- [ ] The team knows which task/view combinations are reliable enough to continue.

## What to report at the end of Week 4

Record in the tracker:

- Which angles were implemented.
- Which poses were tested.
- Which camera views were reliable.
- Which frames or clips were rejected due to low confidence or occlusion.
- Any remaining unresolved accuracy issues.
- Hours logged.

## Week 5 handoff

Week 5 should start from a validated set of angle calculations and move into the deterministic risk-scoring logic (RULA/REBA rules).
