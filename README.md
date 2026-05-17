<div align="center">

<img src="./docs/assets/logo.svg" alt="ZerithDB" width="80" />

# ZerithDB

### **Build full-stack apps with ZERO backend. The browser is the server.**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![CI](https://github.com/Zerith-Labs/ZerithDB/actions/workflows/ci.yml/badge.svg)](https://github.com/Zerith-Labs/ZerithDB/actions/workflows/ci.yml)
[![Status](https://img.shields.io/badge/status-alpha-orange.svg)]()
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289da?logo=discord&logoColor=white)](https://discord.gg/MhvuDvzWfF)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[**Documentation**](https://zerithdb.netlify.app/docs) ·
[**Live Playground**](https://zerithdb.netlify.app/playground) ·
[**Discord**](https://discord.gg/MhvuDvzWfF) · [**Roadmap**](ROADMAP.md)

</div>

---

## What is ZerithDB?

ZerithDB is a **local-first, peer-to-peer application platform** that eliminates the need for
traditional backend infrastructure. Think of it as Supabase — but instead of a centralized server,
your users' browsers form a resilient, encrypted mesh network.

- **No backend to manage.** No servers, no databases, no DevOps.
- **Works offline.** All data lives locally first, syncs opportunistically.
- **Conflict-free by design.** CRDT-based sync means merges just work.
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

| Feature                | Description                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| 🗄️ **Local Database**  | IndexedDB-backed via Dexie. MongoDB-style query API. Reactive live queries.                           |
| 🔄 **CRDT Sync**       | Yjs-powered conflict-free sync. Merge without servers. Works across browser tabs, devices, and peers. |
| 🕸️ **P2P Network**     | WebRTC mesh via `simple-peer`. Minimal signaling server (only for initial handshake).                 |
| 🔐 **Keychain Auth**   | Ed25519 keypair identity. Sign-in is `generateKey()`. No email, no OAuth, no passwords.               |
| 📦 **Modular SDK**     | Tree-shakeable. Use only what you need. Works with React, Vue, Svelte, or vanilla JS.                 |
| ⚡ **Zero Config CLI** | `npx zerithdb init` bootstraps a full project in seconds.                                             |

---

## Quick Start

### Option 1: CLI (Recommended)

If you're new here, follow these beginner friendly steps to get ZerithDB running on your machine:

| Step | Action              | Command                           | What it does                            |
| ---- | ------------------- | --------------------------------- | --------------------------------------- |
| 1    | **Initialize**      | `npx zerithdb@latest init my-app` | Creates your project folder.            |
| 2    | **Go to Directory** | `cd my-app`                       | Enters the folder you just created.     |
| 3    | **Install**         | `npm install`                     | Gets all the tools needed for the app.  |
| 4    | **Start App**       | `npm run dev`                     | Launches the app in your local browser. |

> **Note:** You need [Node.js](https://nodejs.org/) installed to run these commands!

### Option 2: Manual Install

```bash
pnpm add zerithdb-sdk
# or
npm install zerithdb-sdk
```

### Minimal Setup

```typescript
import { createApp } from "zerithdb-sdk";

const app = createApp({
  appId: "my-app-unique-id", // namespaces your local DB
  sync: {
    signalingUrl: "wss://signal.zerithdb.dev", // optional: use our hosted relay
    // or: signalingUrl: "ws://localhost:4000"  // self-hosted
  },
});
```

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
