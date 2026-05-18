# createApp() Configuration Guide

The `createApp()` function is the primary entry point for initializing a ZerithDB application.

It bootstraps the complete ZerithDB runtime, including:

- local database access
- CRDT synchronization
- peer-to-peer networking
- authentication and identity management

The returned application instance exposes APIs for working with collections, synchronization,
networking, and resource lifecycle management.

---

# Installation

```bash
npm install zerithdb-sdk
```

---

# Importing createApp

```typescript
import { createApp } from "zerithdb-sdk";
```

---

# Minimal Example

```typescript
import { createApp } from "zerithdb-sdk";

const app = createApp({
  appId: "my-todo-app",
});
```

---

# Full Configuration Example

```typescript
import { createApp } from "zerithdb-sdk";

const app = createApp({
  appId: "collaborative-editor",

  sync: {
    signalingUrl: "wss://signal.zerithdb.dev",
    maxPeers: 20,
  },

  auth: {
    storageKey: "__editor_identity",
  },

  network: {
    autoReconnect: true,
    reconnectDelay: 2000,
  },
});
```

---

# Function Signature

```typescript
createApp(config: ZerithDBConfig): ZerithDBApp
```

---

# Configuration Overview

| Option     | Description                               |
| ---------- | ----------------------------------------- |
| `appId`    | Unique identifier for the application     |
| `sync`     | Synchronization engine configuration      |
| `auth`     | Authentication and identity configuration |
| `network`  | Peer-to-peer networking configuration     |
| `logLevel` | SDK logging level                         |

---

# appId

Defines a unique identifier for the ZerithDB application instance.

Applications using different IDs operate independently.

## Type

```typescript
string;
```

## Example

```typescript
createApp({
  appId: "chat-app",
});
```

---

# sync

Configuration for the CRDT synchronization engine.

The sync engine manages:

- Yjs document synchronization
- peer-to-peer update propagation
- signaling coordination

## Type

```typescript
{
  signalingUrl?: string;
  maxPeers?: number;
}
```

---

## sync.signalingUrl

Defines the WebSocket signaling server used for WebRTC peer discovery.

### Default

```typescript
"wss://signal.zerithdb.dev";
```

### Example

```typescript
createApp({
  sync: {
    signalingUrl: "wss://custom-signal.example.com",
  },
});
```

---

## sync.maxPeers

Maximum number of peer connections allowed simultaneously.

### Default

```typescript
10;
```

### Example

```typescript
createApp({
  sync: {
    maxPeers: 20,
  },
});
```

---

# auth

Authentication and identity management configuration.

The authentication manager handles:

- local identity persistence
- keypair generation
- message signing

## Type

```typescript
{
  storageKey?: string;
}
```

---

## auth.storageKey

Defines the storage key used to persist local identity information.

### Default

```typescript
"__zerithdb_identity";
```

### Example

```typescript
createApp({
  auth: {
    storageKey: "__custom_identity",
  },
});
```

---

# network

Peer-to-peer networking configuration.

The network manager is responsible for:

- WebRTC peer connections
- reconnect handling
- signaling communication

## Type

```typescript
{
  autoReconnect?: boolean;
  reconnectDelay?: number;
}
```

---

## network.autoReconnect

Automatically reconnects peers when a connection is lost.

### Default

```typescript
true;
```

### Example

```typescript
createApp({
  network: {
    autoReconnect: true,
  },
});
```

---

## network.reconnectDelay

Delay before attempting reconnection.

### Default

```typescript
1000;
```

### Example

```typescript
createApp({
  network: {
    reconnectDelay: 3000,
  },
});
```

---

# Default Configuration

The SDK automatically applies sensible defaults.

```typescript
{
  logLevel: "warn",

  sync: {
    signalingUrl: "wss://signal.zerithdb.dev",
    maxPeers: 10,
  },

  auth: {
    storageKey: "__zerithdb_identity",
  },

  network: {
    autoReconnect: true,
    reconnectDelay: 1000,
  }
}
```

---

# Working with Collections

Collections are accessed using the `db()` method.

Collections are lazily initialized on first access.

## Example

```typescript
const todos = app.db("todos");
```

---

# Typed Collections

The `db()` method supports TypeScript generics for type-safe document operations.

## Example

```typescript
interface Todo {
  text: string;
  done: boolean;
}

const todos = app.db<Todo>("todos");

await todos.insert({
  text: "Ship ZerithDB v1",
  done: false,
});

const results = await todos.find({});
```

---

# Synchronization API

The `sync` property exposes the CRDT synchronization engine.

## Example

```typescript
app.sync.enable();
```

The sync engine manages:

- Yjs document synchronization
- peer discovery
- update propagation

---

# Authentication API

The `auth` property provides access to authentication and identity utilities.

## Example

```typescript
const auth = app.auth;
```

Authentication features include:

- identity persistence
- cryptographic signing
- peer identity verification

---

# Network API

The `network` property exposes peer-to-peer networking functionality.

## Example

```typescript
const network = app.network;
```

The network manager handles:

- WebRTC signaling
- peer connections
- reconnection behavior

---

# Resource Cleanup

Applications should call `dispose()` before shutdown to release:

- active peer connections
- synchronization resources
- database handles

## Example

```typescript
await app.dispose();
```

---

# ZerithDBApp Interface

```typescript
interface ZerithDBApp {
  db<T>(name: string): CollectionClient<T>;

  sync: SyncEngine;

  auth: AuthManager;

  network: NetworkManager;

  config: Readonly<ZerithDBConfig>;

  dispose(): Promise<void>;
}
```

---

# Best Practices

## Use Unique appId Values

Separate applications should use different IDs to avoid unintended synchronization overlap.

---

## Configure Reconnection Carefully

For unstable mobile or public networks, increase reconnect delay values to reduce excessive retries.

---

## Secure Signaling Infrastructure

Production deployments should:

- use secure WebSocket connections (`wss://`)
- deploy trusted signaling servers
- monitor peer connection activity

---

## Dispose Resources Properly

Always call:

```typescript
await app.dispose();
```

before application shutdown or page unload.

---

# Common Usage Patterns

## Collaborative Editor

```typescript
const app = createApp({
  appId: "editor-app",

  sync: {
    maxPeers: 50,
  },

  network: {
    autoReconnect: true,
  },
});
```

---

## Offline-First Todo App

```typescript
const app = createApp({
  appId: "offline-todos",

  network: {
    autoReconnect: false,
  },
});
```

---

# Summary

`createApp()` initializes the complete ZerithDB environment and acts as the central coordination
layer for:

- local database collections
- CRDT synchronization
- authentication
- peer-to-peer networking

It is the recommended entry point for building collaborative and offline-first applications with
ZerithDB.
