# Week 8 browser pose foundation

`index.html`, `app.js`, `angles.js`, and `scoring.js` provide the Week 8 browser-port implementation.

The page:

- lets a user select a local video;
- loads MediaPipe Tasks Vision in the browser;
- samples a full local video timeline with Pose Landmarker;
- calculates browser-side joint angles;
- produces browser-side prototype RULA/REBA summaries;
- exports the sampled results as JSON;
- reports how many landmarks were detected;
- does not upload the video to a server.

Serve the `web` folder from a local HTTP server because browser modules and model loading are restricted when opening a file directly. For example, from `codebase`:

```powershell
py -m http.server 8000 --directory web
```

Open `http://localhost:8000`, choose a pilot video, and click **Analyze full video**. The sampling rate controls how many frames are analyzed per second. Start with 10 frames/second for a short pilot clip.

This is a browser prototype. The scoring logic is intentionally labeled prototype screening and must be cross-checked against the Python implementation and official worksheets before formal use.
