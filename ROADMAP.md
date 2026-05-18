# ZerithDB Roadmap

> This roadmap reflects our current direction, not commitments. Priorities shift based on community
> feedback and real-world usage.
> [Open a Discussion](https://github.com/Zerith-Labs/ZerithDB/discussions) to influence it.

---

## Status Legend

| Symbol | Meaning           |
| ------ | ----------------- |
| ✅     | Done              |
| 🚧     | In Progress       |
| 📋     | Planned           |
| 🔮     | Future / Research |

## Roadmap Navigation

- [Phase 0 — Foundation](#phase-0--foundation-v01--current)
- [Phase 1 — Developer Experience](#phase-1--developer-experience-v02)
- [Phase 2 — Reliability & Scale](#phase-2--reliability--scale-v03)
- [Phase 3 — Access Control](#phase-3--access-control-v04)
- [Phase 4 — Ecosystem & v10](#phase-4--ecosystem--v10-v10)
- [Future / Research](#future--research)
- [How to Influence the Roadmap](#how-to-influence-the-roadmap)

---

## Phase 0 — Foundation (v0.1) — **Current**

The goal of this phase is to establish a working, testable monorepo with core functionality.

| Item                                       | Status | Notes                             |
| ------------------------------------------ | ------ | --------------------------------- |
| Monorepo setup (Turborepo + pnpm)          | ✅     |                                   |
| `zerithdb-core` — types, events, errors    | ✅     |                                   |
| `zerithdb-db` — IndexedDB via Dexie        | 🚧     | Basic CRUD done, live queries WIP |
| `zerithdb-sync` — Yjs integration          | 🚧     | Local sync working, network WIP   |
| `zerithdb-network` — WebRTC + signaling    | 🚧     | 2-peer tested, mesh topology WIP  |
| `zerithdb-auth` — Ed25519 keypair identity | 🚧     |                                   |
| `zerithdb-sdk` — createApp() API           | 🚧     | Basic composition working         |
| `zerithdb-cli` — `zerithdb init`           | 📋     |                                   |
| Signaling server                           | ✅     | Basic WebSocket relay             |
| Unit tests (>60% coverage)                 | 🚧     |                                   |
| CI pipeline                                | ✅     | GitHub Actions                    |
| Todo demo app                              | 🚧     |                                   |

**Target:** Q3 2026

---

## Phase 1 — Developer Experience (v0.2)

Focus: Make it delightful to build with. Remove all friction.

| Item                                                | Status | Notes                               |
| --------------------------------------------------- | ------ | ----------------------------------- |
| React hooks (`useQuery`, `useLiveQuery`, `useAuth`) | 📋     | Separate `zerithdb-react` package   |
| Vue composables (`useQuery`, `usePeer`)             | 📋     | Separate `zerithdb-vue` package     |
| `zerithdb signal` dev server command                | 📋     |                                     |
| `zerithdb types` code generation                    | 📋     | TypeScript types from schema        |
| Schema validation (Zod integration)                 | 📋     | Optional, opt-in                    |
| Collection indexing                                 | 📋     | Compound indexes for query perf     |
| Full CRUD + query operator coverage                 | 📋     | `$gt`, `$lt`, `$in`, `$regex`, etc. |
| DevTools browser extension                          | 📋     | Inspect DB state, sync log, peers   |
| Playground app (live demo)                          | 📋     | Interactive API explorer            |
| Test coverage >80%                                  | 📋     |                                     |
| API documentation site                              | 📋     | Fumadocs-based                      |

**Target:** Q4 2026

---

## Phase 2 — Reliability & Scale (v0.3)

Focus: Production-grade reliability. Handle edge cases. Handle scale.

| Item                            | Status | Notes                                       |
| ------------------------------- | ------ | ------------------------------------------- |
| TURN server support             | 📋     | For symmetric NAT traversal                 |
| Yjs document GC / compaction    | 📋     | Prevent unbounded storage growth            |
| Storage quota management        | 📋     | Expose estimates, handle full storage       |
| Offline queue / sync backlog    | 📋     | Guaranteed delivery of pending ops          |
| Reconnection hardening          | 📋     | Better exponential backoff, circuit breaker |
| Multi-tab coordination          | 📋     | BroadcastChannel for same-origin tabs       |
| E2E test coverage (Playwright)  | 📋     | Full user flow tests                        |
| Performance benchmarks          | 📋     | Automated regression detection              |
| `zerithdb-svelte` adapter       | 📋     | Svelte stores                               |
| Server-assisted sync (optional) | 📋     | For datasets too large for P2P              |

**Target:** Q1 2027

---

## Phase 3 — Access Control (v0.4)

Focus: Fine-grained permissions without central authority.

| Item                        | Status | Notes                                  |
| --------------------------- | ------ | -------------------------------------- |
| Capability token system     | 📋     | UCAN-based, signed capabilities        |
| Room-level access policies  | 📋     | Read/write/admin roles                 |
| Collection-level encryption | 📋     | Only peers with capability can decrypt |
| Peer revocation             | 📋     | Exclude specific keys from a room      |
| SFU topology option         | 📋     | For rooms with >20 peers               |
| Audit log (CRDT-based)      | 📋     | Tamper-evident operation history       |

**Target:** Q2 2027

---

## Phase 4 — Ecosystem & v1.0 (v1.0)

Focus: Stable API, plugin ecosystem, community launch.

| Item                                    | Status | Notes                               |
| --------------------------------------- | ------ | ----------------------------------- |
| Stable public API (no breaking changes) | 📋     | SemVer 1.x guarantee                |
| Plugin system                           | 📋     | Extend db, sync, network layers     |
| `zerithdb-storage` — File/blob support  | 📋     | P2P file transfer via data channels |
| Hardware key support (WebAuthn)         | 📋     | FIDO2 for key storage               |
| Key rotation                            | 📋     | Migrate documents to a new identity |
| Migration tooling                       | 📋     | CLI for schema migrations           |
| Hosted signaling (zerithdb.cloud)       | 📋     | Managed relay for production apps   |
| ZerithDB Studio (GUI)                   | 📋     | Visual data explorer, admin panel   |
| Community showcase                      | 📋     | Apps built on ZerithDB              |
| Security audit                          | 📋     | Third-party cryptographic review    |

**Target:** Q3 2027

---

## Future / Research

These are ideas we are tracking but not yet committed to:

| Idea                        | Notes                                                             |
| --------------------------- | ----------------------------------------------------------------- |
| **Mobile SDKs**             | React Native, Capacitor                                           |
| **Node.js backend adapter** | Use ZerithDB DB on the server                                     |
| **Blockchain anchoring**    | Optional: anchor Yjs state vectors to a chain for tamper evidence |
| **Differential privacy**    | Add noise to analytics without exposing individual records        |
| **WASM CRDT engine**        | Compile Rust-based CRDT to WASM for 10x sync performance          |
| **Cross-app data sharing**  | Standardized schemas for inter-app data portability               |

## How Contributors Can Help

Contributors can support ZerithDB development in several areas:

- Improving onboarding and documentation
- Expanding automated test coverage
- Improving WebRTC reliability
- Enhancing CRDT synchronization workflows
- Building framework integrations
- Improving accessibility and developer tooling
- Optimizing local database performance

New contributors are encouraged to explore issues labeled:

- `good-first-issue`
- `help-wanted`

---

## How to Influence the Roadmap

1. **Vote with 👍** on GitHub Issues to signal demand.
2. **Start a Discussion** with your use case — real use cases drive priorities.
3. **Build it** — PRs for roadmap features are the fastest way to ship them.

---

_Last updated: May 2026 — ZerithDB Core Team_
