# L6 Music — v0.1 local prototype

A responsive, dark-themed independent music streaming prototype. No npm packages, API keys, or paid services are required.

## Run

1. Extract the ZIP.
2. Open a terminal in the `l6-music` folder.
3. Run `python3 -m http.server 8000` (Windows: `py -m http.server 8000`).
4. Open http://localhost:8000 in a modern browser.
5. Select **Artist Studio**, add a title, artist name, and audio file, confirm your rights, then publish to your browser library.
6. Return to **Home** or **Discover** to play the track.

If port 8000 is taken, use `python3 -m http.server 8080` and open http://localhost:8080.

## Included

- Responsive homepage and sidebar navigation
- Discover page with live search
- Artist directory and artist profile pages generated from uploads
- Audio playback with play/pause, skip, progress seek, volume, and next-track autoplay
- Local audio and optional cover art upload (IndexedDB)
- Favourite tracks (localStorage)

## Important limitations

- This is a local prototype, not a live hosted service.
- Uploaded tracks live **only in the current browser's IndexedDB**. Other users and devices cannot access them. Clearing browser site data removes them.
- No real accounts, cloud storage, moderation, playlists, subscriptions, payment processing, or royalties yet.
- Large uploads can exceed browser storage quotas; maximum audio size is 40 MB and cover art 5 MB per upload.
- Upload only recordings you own or are authorised to distribute.
- Use a modern browser; IndexedDB and `crypto.randomUUID()` require a secure context (localhost works).

## Next development milestone

Replace local IndexedDB uploads with authenticated accounts and a backend (for example Supabase Postgres/Auth and an object storage/CDN service). Implement per-artist access controls, validated upload endpoints, copyright reporting and takedown workflow, moderation, and secure streaming delivery. Build and test before public deployment.
L6 music deployment update 
