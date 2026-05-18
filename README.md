<div align="center">

<img src="./docs/assets/logo.svg" alt="ZerithDB" width="80" />

# ZerithDB

### **Build full-stack apps with ZERO backend. The browser is the server.**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![CI](https://github.com/Zerith-Labs/ZerithDB/actions/workflows/ci.yml/badge.svg)](https://github.com/Zerith-Labs/ZerithDB/actions/workflows/ci.yml)
[![Status](https://img.shields.io/badge/status-alpha-orange.svg)](https://github.com/Zerith-Labs/ZerithDB)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289da?logo=discord&logoColor=white)](https://discord.gg/MhvuDvzWfF)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[**Documentation**](https://zerithdb.netlify.app/docs) ·
[**Live Playground**](https://zerithdb.netlify.app/playground) ·
[**Discord**](https://discord.gg/MhvuDvzWfF) · [**Roadmap**](ROADMAP.md)

</div>

## Ecosystem

ZerithDB provides multiple packages for building collaborative and offline-first applications.

| Package            | Installation                   | Description               |
| ------------------ | ------------------------------ | ------------------------- |
| `zerithdb-sdk`     | `npm install zerithdb-sdk`     | Main developer-facing SDK |
| `zerithdb-db`      | `npm install zerithdb-db`      | IndexedDB adapter         |
| `zerithdb-sync`    | `npm install zerithdb-sync`    | CRDT sync engine          |
| `zerithdb-network` | `npm install zerithdb-network` | WebRTC networking layer   |
| `zerithdb-auth`    | `npm install zerithdb-auth`    | Authentication utilities  |
| `zerithdb-core`    | `npm install zerithdb-core`    | Shared internal utilities |
| `zerithdb-cli`     | `npm install -g zerithdb-cli`  | CLI tooling               |
| `zerithdb-react`   | `npm install zerithdb-react`   | React integration package |
| `zerithdb-python`  | `pip install zerithdb-python`  | Python SDK support        |

---

## Table of Contents

- [What is ZerithDB?](#what-is-zerithdb)
- [Why ZerithDB?](#why-zerithdb)
- [The 30-Second Demo](#the-30-second-demo)
- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture in One Diagram](#architecture-in-one-diagram)
- [Packages](#packages)
- [CLI Reference](#cli-reference)
- [FAQ](#faq)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Community](#community)
- [License](#license)

---

## What is ZerithDB?

ZerithDB is a **local-first, peer-to-peer application platform** that eliminates the need for
traditional backend infrastructure. Think of it as Supabase — but instead of a centralized server,
your users' browsers form a resilient, encrypted mesh network.

- **No backend to manage.** No servers, no databases, no DevOps.
- **Works offline.** All data lives locally first, syncs opportunistically.
- **Conflict-free by design.** CRDT-based sync means merges work seamlessly.
- **Private by default.** Public/private key identity — no passwords, no auth servers.

> ZerithDB is in **alpha**. APIs will change. Feedback is our oxygen —
> [open an issue](https://github.com/Zerith-Labs/ZerithDB/issues).

---

## Why ZerithDB?

Traditional backend infrastructure is complex, expensive, and centralized. ZerithDB offers a
different path:

- **Infinite Scalability:** Your infrastructure scales with your users. Each new user adds computing
  and storage power to the network.
- **Zero Latency:** Data is read and written to a local database (IndexedDB) instantly. Sync happens
  in the background.
- **Privacy by Design:** Data is encrypted end-to-end. Since there's no central server, there's no
  single point of failure or data breach.
- **Development Speed:** Go from `npx zerithdb init` to a live, syncing app in minutes. Focus on
  your UI, not your API.

---

## The 30-Second Demo

```typescript
import { createApp } from "zerithdb-sdk";

const app = createApp({ appId: "my-todo-app" });

// Write data — persisted locally via IndexedDB
await app.db("todos").insert({ text: "Ship ZerithDB v1", done: false });

// Query with a MongoDB-like API
const todos = await app.db("todos").find({ done: false });

// Enable real-time P2P sync — no server config needed
app.sync.enable();

// Authenticate with a keypair (no passwords, no servers)
const identity = await app.auth.signIn(); // generates or loads a keypair
console.log(identity.publicKey); // "did:key:z6Mk..."
```

That's it. No `.env` files. No `docker-compose.yml`. No cloud accounts.

---

## Features

| Feature                | Description                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 🗄️ **Local Database**  | IndexedDB-backed via Dexie. MongoDB-style query API. Reactive live queries.                                      |
| 🔄 **CRDT Sync**       | Yjs-powered conflict-free sync. Syncs and merges without servers. Works across browser tabs, devices, and peers. |
| 🕸️ **P2P Network**     | WebRTC mesh via `simple-peer`. Minimal signaling server (only for initial handshake).                            |
| 🔐 **Keychain Auth**   | Ed25519 keypair identity. Sign-in is `generateKey()`. No email, no OAuth, no passwords.                          |
| 📦 **Modular SDK**     | Tree-shakeable. Use only what you need. Works with React, Vue, Svelte, or vanilla JS.                            |
| ⚡ **Zero Config CLI** | `npx zerithdb init` bootstraps a full project in seconds.                                                        |

---

## Quick Start

### Installation

> **Note:** ZerithDB is currently in alpha and packages are not yet published to NPM. To use it, please clone the repository!

```bash
git clone https://github.com/Zerith-Labs/ZerithDB.git
cd ZerithDB
pnpm install
pnpm dev
```

### Minimal Setup

```typescript
import { createApp } from "zerithdb-sdk";

const app = createApp({
  appId: "my-app-unique-id", // namespaces your local DB
  sync: {
    signalingUrl: "wss://signal.zerithdb.dev", // optional: use our hosted relay
    ephemeral: {
      throttleMs: 0, // immediate mute/speaker/stream metadata updates
    },
    // or: signalingUrl: "ws://localhost:4000"  // self-hosted
  },
});
```

## Documentation Navigation

New contributors and developers can use the following documents to better understand the project
structure and workflow:

- [Architecture Overview](ARCHITECTURE.md)
- [Roadmap](ROADMAP.md)
- [Contributing Guide](CONTRIBUTING.md)

## Recommended Reading Order

For the best onboarding experience:

1. Read the README for project overview
2. Explore the architecture documentation
3. Review the roadmap for planned features
4. Read contribution guidelines before contributing

### Local Cloud Backups

```typescript
import { createApp, GoogleDriveBackupTarget } from "zerithdb-sdk";

const app = createApp({ appId: "my-app-unique-id" });

const backup = app.backup(
  new GoogleDriveBackupTarget({
    accessToken: await getGoogleDriveAccessToken(),
    folderId: "drive-folder-id",
  }),
  {
    collections: ["todos", "settings"],
    intervalMs: 30 * 60 * 1000,
  }
);

backup.start();
```

The backup adapter periodically exports the selected IndexedDB collections as a JSON snapshot and
uploads it through a cloud target. ZerithDB includes Google Drive and Dropbox targets; applications
remain responsible for obtaining the provider access token through their own OAuth flow.

---

### P2P Video Calls

```typescript
const app = createApp({
  appId: "standup-room",
  sync: { signalingUrl: "wss://signal.zerithdb.dev" },
});

await app.network.connect("standup-room");

const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
app.video.publishStream(stream, { kind: "camera", label: "Ariyan camera" });

app.video.setMuted("audio", true);
app.video.setActiveSpeaker(app.network.peerId);

app.video.on("stream:added", ({ peerId, stream }) => {
  console.log("remote stream", peerId, stream);
});

app.video.on("participant:updated", (participant) => {
  console.log(participant.muted, participant.streams, participant.activeSpeaker);
});
```

Media travels over the existing WebRTC mesh. Mute status, active speaker, and stream metadata use
ZerithDB ephemeral sync, so they are broadcast immediately and never persisted.

---

## Architecture in One Diagram

```mermaid
flowchart TB
  subgraph browser["Your Browser"]
    direction LR
    SDK["ZerithDB SDK"]
    SYNC["Sync Engine\n(CRDT)"]
    P2P["P2P Network Layer\n(WebRTC mesh)"]
    SDK -->|writes| SYNC
    SYNC -->|broadcast| P2P
  end

  subgraph storage["Local Storage"]
    DB["Local DB\n(IndexedDB)"]
  end

  SDK -->|persist| DB
  SYNC -->|flush| DB

  SIG["Signaling Server\n(WS relay)"]
  PEER["Other Peer Browser"]

  P2P -->|handshake only| SIG
  SIG -->|peer discovery| PEER
  P2P <-.->|"direct P2P\n(after handshake)"| PEER
```

The signaling server **never sees your data**. It only brokers the initial WebRTC handshake. After
that, peers communicate directly.

---

## Packages

| Package                                | Version                                               | Description                       |
| -------------------------------------- | ----------------------------------------------------- | --------------------------------- |
| [`zerithdb-sdk`](packages/sdk)         | ![npm](https://img.shields.io/npm/v/zerithdb-sdk)     | Main developer-facing API         |
| [`zerithdb-db`](packages/db)           | ![npm](https://img.shields.io/npm/v/zerithdb-db)      | IndexedDB adapter (Dexie wrapper) |
| [`zerithdb-sync`](packages/sync)       | ![npm](https://img.shields.io/npm/v/zerithdb-sync)    | CRDT sync engine (Yjs)            |
| [`zerithdb-network`](packages/network) | ![npm](https://img.shields.io/npm/v/zerithdb-network) | WebRTC P2P layer                  |
| [`zerithdb-auth`](packages/auth)       | ![npm](https://img.shields.io/npm/v/zerithdb-auth)    | Keypair identity management       |
| [`zerithdb-core`](packages/core)       | ![npm](https://img.shields.io/npm/v/zerithdb-core)    | Internal types, events, utilities |
| [`zerithdb-cli`](packages/cli)         | ![npm](https://img.shields.io/npm/v/zerithdb-cli)     | `npx zerithdb init` CLI tool      |

---

## CLI Reference

```bash
# Scaffold a new ZerithDB app
npx zerithdb init <app-name>

# Add features interactively
npx zerithdb add auth
npx zerithdb add sync

# Start a local signaling server for development
npx zerithdb signal --port 4000

# Generate TypeScript types from your schema
npx zerithdb types --output ./src/db.types.ts
```

---

## Firebase Import

Migrating from Firebase Realtime Database? ZerithDB includes a built-in import tool that converts
Firebase JSON exports into ZerithDB-compatible collection files.

```bash
# Basic usage — reads Firebase export, writes one JSON file per collection
node scripts/firebase-import.mjs ./firebase-export.json

# Custom output directory
node scripts/firebase-import.mjs ./firebase-export.json --out ./my-collections
```

**How it works:**

- Each **top-level key** in the Firebase export becomes a **ZerithDB collection**
- Each **child object** becomes a **document** in that collection
- Arrays and nested objects within documents are **preserved as-is**
- The original Firebase push key is stored as `_firebaseKey` for traceability
- No external dependencies — uses only Node.js built-ins

**Example input** (`firebase-export.json`):

```json
{
  "users": {
    "-Mxyz1": { "name": "Alice", "age": 30 },
    "-Mxyz2": { "name": "Bob", "age": 25 }
  },
  "posts": {
    "-Mabc1": { "title": "Hello", "tags": ["news", "update"] }
  }
}
```

**Example output** (`firebase-import-output/users.json`):

```json
[
  { "_firebaseKey": "-Mxyz1", "name": "Alice", "age": 30 },
  { "_firebaseKey": "-Mxyz2", "name": "Bob", "age": 25 }
]
```

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the phased plan.

Highlights:

- **v0.2** — React hooks (`useQuery`, `useLiveQuery`)
- **v0.3** — Server-assisted sync for large datasets
- **v0.4** — Fine-grained access control (capability tokens)
- **v1.0** — Stable API, plugin system, ecosystem launch

---

## Contributing

We are **actively looking for contributors**. ZerithDB is built in the open, and every PR matters.

```bash
git clone https://github.com/Zerith-Labs/ZerithDB.git
cd zerithdb
pnpm install
pnpm dev
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow, coding guidelines, and how to find
good first issues.

Good places to start:

- Issues labeled
  [`good-first-issue`](https://github.com/Zerith-Labs/ZerithDB/issues?q=label%3Agood-first-issue)
- Issues labeled
  [`help-wanted`](https://github.com/Zerith-Labs/ZerithDB/issues?q=label%3Ahelp-wanted)

---

## Community

|                |                                                        |
| -------------- | ------------------------------------------------------ |
| 💬 **Discord** | [discord.gg/MhvuDvzWfF](https://discord.gg/MhvuDvzWfF) |

---

## License

Apache 2.0 — see [LICENSE](LICENSE).

Built with ❤️ by the ZerithDB community.

Contributor: YASHODHA (GSSoC 2026)
