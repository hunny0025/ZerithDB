# zerithdb-sdk

The official JavaScript/TypeScript SDK for [ZerithDB](https://zerithdb.netlify.app/) — a
local-first, peer-to-peer, CRDT-powered browser-native database platform.

Build full-stack apps with **zero backend**. The browser is the server.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core APIs](#core-apis)
  - [createApp](#createapp)
  - [Database Operations](#database-operations)
  - [Sync API](#sync-api)
  - [Auth API](#auth-api)
- [Framework Integrations](#framework-integrations)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Installation

```bash
npm install zerithdb-sdk
```

For React projects:

```bash
npm install zerithdb-sdk zerithdb-react
```

---

## Quick Start

```typescript
import { createApp } from "zerithdb-sdk";

const app = createApp({
  appId: "my-app-unique-id",
  sync: {
    signalingUrl: "wss://signal.zerithdb.dev", // optional: hosted relay
    // or: signalingUrl: "ws://localhost:4000"  // self-hosted
  },
});

// Write data — persisted locally via IndexedDB
await app.db("todos").insert({ text: "Ship ZerithDB v1", done: false });

// Query with a MongoDB-like API
const todos = await app.db("todos").find({ done: false });

// Enable real-time P2P sync
app.sync.enable();

// Authenticate with a keypair (no passwords, no servers)
const identity = await app.auth.signIn();
console.log(identity.publicKey); // "did:key:z6Mk..."
```

---

## Core APIs

### `createApp`

Initializes a new ZerithDB app instance.

```typescript
import { createApp } from "zerithdb-sdk";

const app = createApp({
  appId: "my-app",        // namespaces your local DB
  sync: {
    signalingUrl: "wss://signal.zerithdb.dev",
  },
});
```

| Option | Type | Required | Description |
|---|---|---|---|
| `appId` | `string` | ✅ | Unique namespace for your local database |
| `sync.signalingUrl` | `string` | ❌ | WebSocket URL of the signaling server for P2P |

---

### Database Operations

```typescript
const db = app.db("collection-name");

// Insert a document
await db.insert({ text: "Hello", done: false });

// Find documents (MongoDB-style query)
const results = await db.find({ done: false });

// Find a single document
const item = await db.findOne({ id: "abc123" });

// Update a document
await db.update("doc-id", { done: true });

// Delete a document
await db.delete("doc-id");

// Live / reactive query (fires on every change)
db.subscribe({ done: false }, (results) => {
  console.log("Updated results:", results);
});
```

---

### Sync API

ZerithDB syncs automatically, but you can also trigger a sync round manually:

```typescript
// Enable automatic P2P sync
app.sync.enable();

// Force a full sync with all connected peers
await app.sync.forceSync();

// Force sync with a specific peer
await app.sync.forceSyncWith("did:key:z6Mk...");

// Flush all pending local changes to peers immediately
await app.sync.flush();

// List currently connected peers
const peers = app.sync.getPeers();
// [{ id: "did:key:...", latency: 42 }, ...]
```

**Sync events:**

```typescript
app.sync.on("sync:start",       ()     => console.log("Sync started"));
app.sync.on("sync:complete",    (data) => console.log(`Done — ${data.peersReached} peers`));
app.sync.on("sync:error",       (err)  => console.error(err.message));
app.sync.on("peer:connected",   (peer) => console.log("Peer joined:", peer.id));
app.sync.on("peer:disconnected",(peer) => console.log("Peer left:", peer.id));
```

- See the full [Force Sync API guide](./docs/FORCE_SYNC.md) for all methods, events,
the React `useSyncStatus()` hook, and Python SDK usage.

---

### Auth API

```typescript
// Sign in — generates or loads an Ed25519 keypair (no password needed)
const identity = await app.auth.signIn();
console.log(identity.publicKey); // "did:key:z6Mk..."

// Sign out
await app.auth.signOut();

// Get the current identity
const current = app.auth.getIdentity();
```

---

## Framework Integrations

### React

```tsx
import { ZerithProvider, useQuery } from "zerithdb-react";

// 1. Wrap your app
export default function App({ children }) {
  return (
    <ZerithProvider config={{ appId: "my-app", sync: true }}>
      {children}
    </ZerithProvider>
  );
}

// 2. Use hooks to read and write data
function TodoList() {
  const { data: todos, insert } = useQuery("todos");

  return (
    <div>
      {todos.map((todo) => (
        <p key={todo.id}>{todo.text}</p>
      ))}
      <button onClick={() => insert({ text: "New Todo" })}>Add</button>
    </div>
  );
}
```

### Vanilla JavaScript

```javascript
import { createApp } from "zerithdb-sdk";

const app = createApp({ appId: "my-app" });
await app.db("notes").insert({ title: "First note" });
```

### Python (Backend / ML Agent)

See the [zerithdb-python](../zerithdb-python/README.md) package for connecting
Python scripts and ML workloads to the same P2P mesh.

---

## Architecture

```
Your Browser
├── ZerithDB SDK
│   ├── CRDT Engine (Yjs)       — conflict-free data sync
│   ├── IndexedDB Adapter       — local persistence
│   ├── WebRTC Layer            — peer-to-peer data channels
│   └── Signaling Client        — initial peer discovery (WebSocket)
└── Auth Module (Ed25519)       — keypair identity, no passwords
```

- **Local-first** — all reads and writes hit IndexedDB instantly (0ms latency).
- **CRDT-powered** — data is represented as Yjs documents; merges are always conflict-free.
- **WebRTC mesh** — peers connect directly via `simple-peer`; the signaling server
  is only used for the initial handshake.
- **Ed25519 identity** — every peer is identified by a cryptographic public key
  generated entirely in-browser.

---

## Troubleshooting

Having trouble? Check the resources below:

- [Force Sync API guide](./docs/FORCE_SYNC.md) — manual sync, flush, and sync events
- [zerithdb-python Troubleshooting](../zerithdb-python/TROUBLESHOOTING.md) — Python SDK
  install errors (`aiortc`, `ffmpeg`)
- [GitHub Issues](https://github.com/Zerith-Labs/ZerithDB/issues) — search or open a new issue
- [Discord](https://discord.gg/MhvuDvzWfF) — community support

---

## Contributing

We welcome contributions! Please read
[CONTRIBUTING.md](../../CONTRIBUTING.md) for the full workflow, coding guidelines
and how to find good first issues.

```bash
git clone https://github.com/Zerith-Labs/ZerithDB.git
cd ZerithDB
pnpm install
pnpm dev
```

---

## License

Apache 2.0 — see [LICENSE](../../LICENSE).