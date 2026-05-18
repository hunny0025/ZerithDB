# ZerithDB Architecture

> **Audience:** Contributors, integrators, and the curious.  
> This document explains how ZerithDB works, why we made the choices we did, and how the modules fit
> together.

---

## Core Design Principles

### 1. Local-First

Every operation hits the local database first. The network is an optimization, not a requirement. An
app built on ZerithDB works fully offline and syncs when connectivity is available.

### 2. CRDTs Over Consensus

We don't use leader election, Raft, or operational transforms. All mergeable data structures are
[CRDTs](https://crdt.tech/) (via Yjs). This means:

- No "last-write-wins" data loss
- No merge conflicts that require user intervention
- Sync order doesn't matter — eventual consistency is guaranteed

### 3. Zero Trust Signaling

The signaling server is a **dumb relay**. It only brokers WebRTC ICE candidate exchange. It never
sees document content, user data, or even decryption keys. Even if the signaling server is
compromised, user data remains private.

### 4. Package Independence

Each package in `packages/` can be used standalone without the SDK wrapper. A developer who only
needs the DB engine can `import { createDb } from "zerithdb-db"` without pulling in sync or
networking.

## Recommended Reading Guide

This document is designed for contributors, integrators, and developers who want a deeper
understanding of ZerithDB internals.

Suggested reading flow:

1. Core Design Principles
2. System Architecture Diagram
3. Module Reference
4. Data Flow Lifecycle
5. Engineering Challenges

## Reading in this order provides a clearer understanding of how the different ZerithDB packages interact internally.

## System Architecture

```
                            ┌─────────────────────────────────────────┐
                            │              ZerithDB SDK                │
                            │          (zerithdb-sdk)                 │
                            │                                          │
                            │  createApp() → ZerithDBApp               │
                            │    .db()      → DbClient                 │
                            │    .sync      → SyncEngine               │
                            │    .auth      → AuthManager              │
                            │    .network   → NetworkManager           │
                            └──────┬──────────────────────────────────┘
                                   │ orchestrates
              ┌────────────────────┼────────────────────────┐
              ▼                    ▼                         ▼
   ┌──────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
   │  zerithdb-db    │  │ zerithdb-sync  │  │ zerithdb-auth      │
   │                  │  │                 │  │                     │
   │  Dexie wrapper   │  │  Yjs Doc tree   │  │  Ed25519 keypairs   │
   │  IndexedDB       │  │  Awareness      │  │  DID:key identity   │
   │  Live queries    │  │  Undo/Redo      │  │  Signed messages    │
   └──────────────────┘  └────────┬────────┘  └─────────────────────┘
                                  │ emits/receives updates
                         ┌────────▼────────┐
                         │ zerithdb-      │
                         │ network         │
                         │                 │
                         │  WebRTC peers   │
                         │  simple-peer    │
                         │  Reconnection   │
                         └────────┬────────┘
                                  │ ICE handshake only
                         ┌────────▼────────┐
                         │ Signaling Server │
                         │ (infra/signaling)│
                         │                 │
                         │  WebSocket relay│
                         │  Room management│
                         │  No data stored │
                         └─────────────────┘
```

---

## Module Reference

### `zerithdb-core`

**Role:** The foundation. Shared types, error classes, event bus, and constants used by all other
packages.

**Key exports:**

- `ZerithDBError` — Typed error class with `ErrorCode` enum
- `EventEmitter<T>` — Typed event bus
- `ZerithDBConfig` — Root configuration schema
- Common TypeScript utility types

**Rule:** `core` has zero runtime dependencies. It must remain a pure TypeScript package.

---

### `zerithdb-db`

**Role:** Local database engine. Wraps [Dexie.js](https://dexie.org/) (an IndexedDB wrapper) with a
MongoDB-style query API.

**Key concepts:**

- **Collections** — Analogous to MongoDB collections or SQL tables. Schema is defined at collection
  creation.
- **Documents** — Plain JSON objects. Each gets a unique `_id` (UUID v7) on insert.
- **Live Queries** — `collection.liveQuery(filter)` returns an `Observable` that re-emits whenever
  matching documents change.

**Internal architecture:**

```
DbClient
  └─ CollectionManager
       └─ DexieAdapter          ← Dexie table operations
            └─ IndexedDB        ← Browser native
```

**Design decisions:**

- **UUID v7** for `_id`: Monotonically sortable, perfect for IndexedDB's B-tree structure.
- **Schema migrations** are version-gated via Dexie's built-in migration API.
- **Bulk operations** use Dexie's `bulkPut` for performance.

---

### `zerithdb-sync`

**Role:** CRDT-based sync engine. Manages [Yjs](https://yjs.dev/) documents and propagates updates
to/from the network layer.

**Key concepts:**

- **Yjs Document (`Y.Doc`)** — A CRDT document containing typed data structures (Map, Array, Text).
  One Y.Doc per ZerithDB collection.
- **Update encoding** — Yjs produces compact binary diffs. Only the delta is sent, not the full
  document.
- **Awareness** — Ephemeral user presence (cursor position, online status) via Yjs Awareness
  protocol — never persisted.
- **Persistence** — On sync, the Yjs state vector is checkpointed to IndexedDB (via `zerithdb-db`).
- **Delta Deduplication** - Identical updates are tracked and skipped before syncing data , so the
  same data is never sent to peers more than once thereby avoiding redundant data movement.In this
  approach , only those fields that are updated recently called delta are sent to peers instead of
  whole object.

**Sync flow:**

```
Local write → Y.Doc update → encode delta → emit to NetworkManager
                                                       │
Remote peer ─────────────────────────── receive delta ─┘
                                                       │
                              Y.Doc.applyUpdate(delta) ─┘
                                                       │
                              DB reflects merged state ─┘
```

**Conflict resolution:** Inherent in the CRDT. Concurrent edits to the same Y.Map key are resolved
by Yjs using a deterministic timestamp + client ID tie-break. No user intervention required.

---

### `zerithdb-network`

**Role:** WebRTC peer-to-peer communication layer.

**Key concepts:**

- **Rooms** — Logical namespaces. Peers join a room by `appId + collectionName`. Discovery happens
  via the signaling server.
- **Peer connections** — Managed via [`simple-peer`](https://github.com/feross/simple-peer). Each
  peer maintains N-1 connections in a full-mesh topology.
- **Data channels** — Binary data (Yjs updates) flows over WebRTC data channels. Text messages use a
  separate channel for signaling metadata.
- **Reconnection** — Exponential backoff with jitter. Peers re-signal via WebSocket if the WebRTC
  connection drops.

**Scalability note:** Full-mesh becomes expensive at ~20+ peers. v0.4 roadmap includes SFU
(Selective Forwarding Unit) topology for large rooms.

---

### `zerithdb-auth`

**Role:** Cryptographic identity management. No passwords, no auth servers.

**Key concepts:**

- **Identity** — An Ed25519 keypair stored in the browser's `localStorage` (private key) and
  exported as a `did:key` URI (public key).
- **Signing** — Every sync update is signed with the sender's private key. Recipients verify the
  signature before applying updates.
- **Verification** — Public keys are shared with peers via the Yjs Awareness channel on connection.
- **No central authority** — There is no "user database." A user is their keypair.

**DID format:** `did:key:z6Mk...` (per the
[W3C DID Key spec](https://w3c-ccg.github.io/did-method-key/))

**Limitations and future work:**

- Key rotation requires migrating documents (tracked in Roadmap).
- No revocation mechanism yet.
- Hardware key support (WebAuthn) is on the v0.5 roadmap.

---

### UCAN-based Capabilities

ZerithDB uses UCANs (User Controlled Authorization Networks) for decentralized access control.  
- **Delegation**: `auth.delegate(targetDid, capabilities, options)` returns a signed UCAN.  
- **Enforcement**: Sync engine and DB client check UCANs before allowing reads/writes.  
- **Attenuation**: Delegated capabilities are always a subset of the original.  
- **Expiration**: Short-lived UCANs (default 1 hour) prevent indefinite access.

Capability resource URIs follow the pattern:  
`zerithdb://{appId}/{collection}/{optionalDocId}`  
Wildcards: `zerithdb://my-app/todos/*` grants access to all documents in the `todos` collection.

---

### `zerithdb-sdk`

**Role:** The primary developer-facing API. A thin orchestration layer over `db`, `sync`, `network`,
and `auth`.

**Entry point:**

```typescript
const app = createApp(config);
// app.db(name)     → DbClient (from zerithdb-db)
// app.sync         → SyncEngine (from zerithdb-sync)
// app.auth         → AuthManager (from zerithdb-auth)
// app.network      → NetworkManager (from zerithdb-network)
```

**Design goal:** A developer should not need to import from `zerithdb-db`, `zerithdb-sync`, etc.
directly for 95% of use cases.

---

### `zerithdb-cli`

**Role:** `npx zerithdb` command-line tool. Bootstraps apps, manages local development, and provides
dev utilities.

**Commands:**

- `zerithdb init <name>` — Scaffold a new ZerithDB app using a Next.js template.
- `zerithdb signal` — Start a local signaling server for development.
- `zerithdb types` — Generate TypeScript types from collection schemas.
- `zerithdb dev` — Alias for `npm run dev` with ZerithDB-specific env setup.

---

### `infra/signaling-server`

**Role:** Minimal WebSocket server for WebRTC peer discovery.

**Responsibilities:**

- Accept WebSocket connections from browser clients.
- Route ICE candidates and SDP offers/answers between peers in the same room.
- Track connected peers per room for presence.

**Non-responsibilities:**

- Storage: stateless, no database.
- Authentication: the signaling server does not verify identities.
- Data relay: never touches document content.

**Technology:** Node.js + `ws` library. Intentionally minimal — this could be replaced with a
Cloudflare Worker or any WebSocket server.

---

## Data Flow: Full Write Cycle

```
1. Developer calls: await app.db("todos").insert({ text: "Buy milk" })

2. zerithdb-db
   └─ Generates _id (UUID v7)
   └─ Writes to IndexedDB via Dexie
   └─ Emits "document:inserted" event to Core EventBus

3. zerithdb-sync (listening to EventBus)
   └─ Applies insert to Y.Doc as Y.Map entry
   └─ Yjs produces binary delta (state update)
   └─ Emits delta to zerithdb-network

4. zerithdb-auth
   └─ Signs the delta with the local private key

5. zerithdb-network
   └─ Sends signed delta to all connected WebRTC peers
   └─ Peers verify signature, apply update to their Y.Doc
   └─ Peers' zerithdb-db reflects the merged state

6. Live queries on all peers automatically re-emit
```

---

## Engineering Challenges

### WebRTC Limitations

- **NAT traversal fails** for ~8% of network topologies (symmetric NAT). Mitigation: TURN server
  fallback (not yet implemented; tracked in issue #34).
- **Connection limits:** Browsers cap WebRTC peer connections at ~256. Our full-mesh model caps at
  ~20 practical peers per room.
- **Mobile background tabs:** iOS Safari aggressively kills WebRTC connections in background. We use
  heartbeat pings and aggressive reconnection.

### CRDT Storage Growth

Yjs documents grow monotonically — deletions are tombstones, not physical removals. For long-lived
documents with many edits, this becomes a storage problem. Mitigation: periodic GC snapshots
(tracked in Roadmap v0.3).

### Storage Quotas

IndexedDB has per-origin storage quotas (typically 60% of available disk, but browsers may prompt).
Large datasets require storage quota management. We expose `StorageManager.estimate()` to apps.

### Security Considerations

- Private keys in `localStorage` are accessible to XSS attacks. Future: migrate to non-extractable
  `CryptoKey` via WebCrypto API.
- The P2P model means any peer with room access can read all data. Fine-grained access control
  (capability tokens) is planned for v0.4.
- DoS via malformed Yjs updates: we validate update signatures and structure before applying.
