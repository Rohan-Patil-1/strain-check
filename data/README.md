# Data layout

Keep recorded video local and out of version control.

```text
data/
  raw/          # phone clips, ignored by git
  manifests/    # clip metadata in JSON or CSV
  derived/      # extracted landmarks and angles
```

Each clip should have a corresponding `ClipRecord` with a unique `clip_id`. Use the protocol in `docs/week-2-data-collection-protocol.md` before recording.
