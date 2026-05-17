# ZerithDB DevTools Extension

Chrome DevTools panel that visualizes live ZerithDB memory usage: IndexedDB storage and WebRTC
send-buffer pressure.

## Prerequisites

1. Build the ZerithDB packages (`pnpm build` from the repo root).
2. Enable DevTools sampling in your app:

```typescript
import { createApp } from "zerithdb-sdk";

const app = createApp({
  appId: "my-app",
  debug: { devtools: true },
});
```

## Load the extension in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select this directory: `extensions/zerithdb-devtools`.
5. Open your ZerithDB app, then open DevTools → **ZerithDB** tab.

## What you'll see

- **Dual-line chart** — IndexedDB bytes (storage estimate) and WebRTC buffered bytes over time
- **Stats bar** — current values, peaks, record count, peer count
- **Peer list** — per-peer `bufferedAmount` from each WebRTC data channel
- **Clear graph** — resets the chart and peak trackers

## How data flows

```
App (MemoryCollector)
  → window CustomEvent "zerith:memory"
  → content.js (chrome.runtime.sendMessage)
  → background.js (relay by tab id)
  → panel.js (Chart.js update)
```

The panel also polls `window.__ZERITH_MEMORY_LATEST__` every 3 seconds as a fallback.

## Alerts

The WebRTC stat card highlights when send buffers grow:

- Yellow border: ≥ 512 KB buffered
- Red border: ≥ 2 MB buffered
