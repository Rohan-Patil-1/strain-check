# Week 8 browser pose foundation

`index.html`, `app.js`, `angles.js`, and `scoring.js` provide the Week 8 browser-port implementation.

The page:

- installs the pose model automatically on first open with download progress;
- uses MediaPipe Pose Landmarker Full for better landmark quality while remaining practical on phones;
- lets a user select a local video;
- loads MediaPipe Tasks Vision in the browser;
- samples a full local video timeline with Pose Landmarker;
- calculates browser-side joint angles;
- produces browser-side prototype RULA/REBA summaries;
- draws a green/red skeleton overlay with angle labels and posture status;
- exports the sampled results as JSON;
- exports the annotated canvas as a WebM video;
- reports how many landmarks were detected;
- does not upload the video to a server.

Serve the `web` folder from a local HTTP server because browser modules and model loading are restricted when opening a file directly. For example, from `codebase`:

```powershell
py -m http.server 8000 --directory web
```

Open `http://localhost:8000`, wait for the model progress bar to reach 100%, choose or record a pilot video, and click **Analyze full video**. The file picker supports camera capture on compatible phones. The sampling rate controls how many frames are analyzed per second. Start with 10 frames/second for a short pilot clip.

When analysis finishes, **Download annotated video** saves a WebM containing the video, skeleton, detected angles, and per-frame posture status. Green means the current prototype thresholds classify the posture as okay; red means it should be reviewed; amber means pose data was insufficient.

This is a browser prototype. The scoring logic is intentionally labeled prototype screening and must be cross-checked against the Python implementation and official worksheets before formal use.
