# Public deployment

The browser prototype is a static client-side application. GitHub Pages can publish the `web` folder at no cost.

## One-time setup

1. Create a new GitHub repository, for example `strain-check`.
2. From the `codebase` folder, initialize Git and create the first commit:

```powershell
git init
git add .
git commit -m "Prepare Strain Check prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/strain-check.git
git push -u origin main
```

3. On GitHub, open **Settings -> Pages**.
4. Under **Build and deployment**, select **GitHub Actions**.
5. Open the **Actions** tab and wait for **Deploy Strain Check browser app** to finish.
6. The public URL will be:

```text
https://YOUR-USERNAME.github.io/strain-check/
```

The workflow publishes only `web`, so Python source, test fixtures, and local videos are not part of the public site. Do not place private videos or personal information inside `web`.

## User-facing limitations

- Users need a modern browser and internet access to download the MediaPipe library/model from the CDN.
- Video processing happens in the user's browser; videos are not uploaded by the app.
- The RULA/REBA output is a prototype screening result, not a medical or legal determination.
- The site has no server-side storage, accounts, or analytics.

## Before demonstrating

Open the public URL on a second device or an incognito window and verify:

- the page loads;
- a local video can be selected;
- the pose model reaches the ready state;
- full-video analysis completes;
- the JSON result downloads;
- no private files are exposed.
