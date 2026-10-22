# Week 5 Task List: RULA/REBA Scoring Engine

## Week 5 goal

Turn validated joint-angle measurements into a deterministic ergonomic risk score using RULA and REBA logic. This week is about rule-based scoring, not model training or browser work.

```text
validated joint angles -> scoring tables -> RULA/REBA values -> risk level
```

The objective is to implement the scoring engine in a clean, testable form so the next step can compare results across clips and task types.

## Tasks

### 1. Define the scoring inputs

- [ ] Decide which joint angles are required for RULA.
- [ ] Decide which joint angles are required for REBA.
- [ ] Decide how to handle missing or invalid angles in a score.
- [ ] Decide how to represent posture stage values for each body region.
- [ ] Store the input values in a simple structured format.

Minimum expected inputs:

- Upper arm angle
- Lower arm angle
- Wrist angle / wrist position
- Trunk angle
- Neck angle
- Knee angle
- Posture frequency or repetition estimate (if available at this stage)

### 2. Implement the scoring tables

- [ ] Encode the RULA worksheet rules as code.
- [ ] Encode the REBA worksheet rules as code.
- [ ] Separate the posture scoring from the final risk interpretation.
- [ ] Keep the logic deterministic and rule-based.
- [ ] Use simple helper functions for score lookup and posture grouping.

Recommended structure:

- `score_rula(posture)`
- `score_reba(posture)`
- `classify_risk(score)`
- `build_posture_summary(angles)`

### 3. Score simple posture examples

- [ ] Test a neutral posture.
- [ ] Test a bent-forward trunk posture.
- [ ] Test a raised shoulder posture.
- [ ] Test a bent elbow posture.
- [ ] Test a deep knee bend or lower-body loading posture.

The purpose is to confirm that the engine is returning plausible risk levels before using it on real clips.

### 4. Translate posture values into risk categories

- [ ] Map the numeric score to low / medium / high / very high risk output.
- [ ] Keep the classification consistent with the underlying scoring standard.
- [ ] Use plain-language labels for the report output.
- [ ] Ensure the final result can be explained by the user.

### 5. Add score validation logic

- [ ] Reject invalid or impossible angle ranges.
- [ ] Handle missing angles without crashing.
- [ ] Flag cases where a risk score is being computed from incomplete posture data.
- [ ] Keep the score output reproducible for the same input values.

### 6. Build the first scoring summary object

Create a minimum output object like:

- `rula_score`
- `reba_score`
- `overall_risk_level`
- `problem_regions`
- `missing_inputs`
- `confidence_note`

This summary will become the foundation for later report generation and UI output.

### 7. Add unit tests for the engine

- [ ] Test neutral posture produces a low-risk outcome.
- [ ] Test extreme trunk flexion produces a higher score.
- [ ] Test missing angle data is handled explicitly.
- [ ] Test invalid angle ranges are rejected.
- [ ] Test that both RULA and REBA functions return numeric values.
- [ ] Test that risk classification is consistent and stable.

### 8. Review how the scoring meets the project goal

- [ ] Confirm the output is explainable in plain language.
- [ ] Confirm the engine is deterministic.
- [ ] Confirm the scoring logic is independent of any training data.
- [ ] Confirm the input requirements are realistic for the available input video and landmark data.

## Week 5 acceptance criteria

Week 5 is complete when:

- [ ] A RULA scoring function produces numeric risk values.
- [ ] A REBA scoring function produces numeric risk values.
- [ ] The engine recognizes invalid/missing angles and handles them safely.
- [ ] The output can be mapped to risk categories.
- [ ] Unit tests cover the baseline behavior of the scoring engine.
- [ ] The code is ready to be applied to pilot clips in the next stage.

## What to report at the end of Week 5

Record in the tracker:

- Which scoring rules were implemented.
- Which posture examples were tested.
- Which angles are required as input.
- Any gaps or limitations in the current engine.
- Which clips are ready to be scored in the next step.
- Hours logged.

## Week 6 handoff

Week 6 should start from a working deterministic scoring engine and add the optional IMU/frequency component if needed, while keeping the core RULA/REBA rules intact.
