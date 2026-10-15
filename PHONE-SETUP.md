# L6 Music — phone-first setup (v0.2)

## Important
This is a working **local prototype**, not a multi-user streaming service. Audio and artwork are stored in IndexedDB in **your own browser**, not on a server. People visiting a published site will **not** see your uploaded tracks. Browser data clearing or storage limits can remove tracks, so keep the original music files.

## Publish from iPhone without a computer (GitHub Pages)
1. Create a GitHub account (if you don't already have one) at github.com.
2. In Safari, create a **public** repository named `l6-music`.
3. Extract the ZIP in the iPhone Files app. Open the repository on GitHub, tap **Add file → Upload files** (use Safari's desktop website option if the mobile layout hides it).
4. Upload the **contents of the `l6-music` folder** to the repository root: `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, and this guide. Do not upload the ZIP as the website.
5. Open **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, `main`, `/ (root)`, then Save.
6. Once GitHub finishes deploying, visit `https://YOUR-USERNAME.github.io/l6-music/` in Safari.
7. Tap **Share → Add to Home Screen** to use it like an app.

GitHub's interface can change; if the upload flow is awkward on mobile, a browser-based code editor/hosting service can be used instead. GitHub Pages serves static files only; it does not provide private user accounts, a music database, or cloud storage. Do not put API keys or secrets in this repository.

## What works in this prototype
- Responsive homepage, discovery, artist profiles, favourites and music player
- Upload audio and artwork to this browser, stored in IndexedDB
- Play, pause, seek, skip, shuffle, repeat, volume
- Delete your own local uploads
- Home-screen installation on supported browsers; offline app-shell caching after first successful load

## Next build: real public streaming
We need a backend for authentication, permissioned uploads, durable object storage, track metadata, moderation, copyright reports, and secure playback. We'll build that as a separate phase and test it before accepting public artist uploads.
