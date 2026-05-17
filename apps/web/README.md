# ZerithDB Web

This is the Next.js web app for ZerithDB.

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit
the file.

## Offline App Shell

The production build registers `public/sw.js` as an offline-first service worker template. It
pre-caches the required app shell files, opportunistically warms common routes and public assets,
then serves `public/offline.html` when a navigation request cannot reach the network.

The service worker is intentionally registered only in production so local development does not get
stuck behind stale cached bundles. To test it locally:

```bash
pnpm build
pnpm start
```

Open the app, wait for the service worker to register, then use DevTools to switch the browser to
offline mode and reload a cached route. If you need to clear an old worker, use DevTools >
Application > Service Workers > Unregister.

The required app shell cache includes:

- `/`
- `/offline.html`

If either required shell file fails to cache, installation fails so the browser does not keep a
partially prepared offline worker.

The optional warm cache includes:

- `/docs`
- `/playground`
- `/blog`
- shared public assets such as `/logo.svg`, `/favicon.ico`, and `/manifest.webmanifest`

Update `REQUIRED_APP_SHELL_URLS` in `public/sw.js` whenever a route or shell asset must be available
offline. Add non-critical routes and assets to `OPTIONAL_APP_SHELL_URLS` so a missing optional page
does not block service worker installation.

Runtime caching is intentionally bounded. Static assets and allowed app navigations share a capped
runtime cache, and navigation responses are only stored for known routes without query strings or
`no-store` cache-control headers. The worker also waits for the normal browser update cycle instead
of calling `skipWaiting()` or `clients.claim()`, which helps avoid taking over pages that still
reference chunks from a previous Next.js build.
