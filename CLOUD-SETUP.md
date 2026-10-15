# L6 Music — Supabase-ready build

This build adds a shared public catalogue and authenticated uploads. It is not deployed or connected until you supply the Supabase project URL and publishable/anon key.

1. Review and run SUPABASE-SETUP.sql in your Supabase SQL Editor. It makes the `l6-music` bucket public, so only use it for music intended for public streaming.
2. Put the Supabase Project URL and publishable/anon key into config.js. NEVER use a service_role or secret key.
3. Create/invite an artist account in Supabase Authentication. Sign in on Artist Studio to upload.
4. Upload the files in this folder to your GitHub repository root. The app will load public songs from Supabase.
5. Test on two devices: upload while signed in, then open the public site on the other device.

Notes: The original browser-only uploads remain local. This build does not migrate those files automatically. Supabase configuration, bucket permissions and deployed playback still need testing. Public uploads should not be enabled for arbitrary accounts without moderation, abuse limits and copyright reporting. This is a first integration, not a production-ready public streaming platform.
