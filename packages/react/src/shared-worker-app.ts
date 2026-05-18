import { createApp } from "zerithdb-sdk";
import type {
  AppScope,
  ClientToWorkerMessage,
  CollectionProxy,
  Identity,
  InsertResult,
  RequestMessage,
  SharedWorkerApp,
  SyncState,
  UpdateSpec,
  WorkerToClientMessage,
  ZerithDBConfig,
  QueryFilter,
  Document,
} from "./shared-worker-protocol.js";
import { makeRequestId } from "./shared-worker-protocol.js";
import type { ZerithDBApp } from "zerithdb-sdk";

type RequestResolver = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

type SubscriptionCallback<T extends Record<string, unknown>> = (documents: Document<T>[]) => void;

class SharedWorkerBridge {
  private readonly port: MessagePort | null;
  private readonly ready: Promise<void>;
  private readonly requestResolvers = new Map<string, RequestResolver>();
  private readonly subscriptionCallbacks = new Map<string, (documents: unknown[]) => void>();
  private readonly fallbackApp: ZerithDBApp | null;
  private readonly appId: string;
  private syncState: SyncState = { synced: false, pendingUpdates: 0, connectedPeers: 0 };
  private authIdentity: Identity | null = null;
  private connectedPeers: ZerithDBApp["network"]["connectedPeers"] = [];
  private connectedPeerCount = 0;

  constructor(private readonly config: ZerithDBConfig) {
    this.appId = config.appId;

    if (typeof SharedWorker === "undefined") {
      this.fallbackApp = createApp(config);
      this.port = null;
      this.ready = Promise.resolve();
      return;
    }

    try {
      const worker = new SharedWorker(new URL("./shared-worker.js", import.meta.url), {
        type: "module",
        name: `zerithdb:${config.appId}`,
      });
      this.port = worker.port;
      this.port.start();
      this.fallbackApp = null;

      this.ready = new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("Timed out waiting for ZerithDB SharedWorker to initialize"));
        }, 5000);

        this.port?.addEventListener("message", (event: MessageEvent<WorkerToClientMessage>) => {
          const message = event.data;
          if (message.kind === "response" && message.id === "init" && message.ok) {
            clearTimeout(timer);
            resolve();
            return;
          }

          this.handleMessage(message);
        });

        this.port?.postMessage({
          kind: "init",
          appId: config.appId,
          config,
        } satisfies ClientToWorkerMessage);
      });
    } catch {
      this.fallbackApp = createApp(config);
      this.port = null;
      this.ready = Promise.resolve();
    }
  }

  get sync(): SharedWorkerApp["sync"] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const bridge = this;
    return {
      enable: () => {
        void bridge.requestApp("sync", "enable", []);
      },
      disable: () => {
        void bridge.requestApp("sync", "disable", []);
      },
      get state() {
        return bridge.syncState;
      },
    };
  }

  get auth(): SharedWorkerApp["auth"] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const bridge = this;
    return {
      signIn: () => bridge.requestApp("auth", "signIn", []) as Promise<Identity>,
      generateIdentity: () =>
        bridge.requestApp("auth", "generateIdentity", []) as Promise<Identity>,
      sign: (data: Uint8Array) => bridge.requestApp("auth", "sign", [data]) as Promise<string>,
      verify: (data: Uint8Array, signature: string, publicKey: string) =>
        bridge.requestApp("auth", "verify", [data, signature, publicKey]) as Promise<boolean>,
      signOut: () => {
        void bridge.requestApp("auth", "signOut", []);
      },
      get identity() {
        return bridge.authIdentity;
      },
    };
  }

  get network(): SharedWorkerApp["network"] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const bridge = this;
    return {
      connect: (roomId: string) =>
        bridge.requestApp("network", "connect", [roomId]) as Promise<void>,
      broadcast: (message: { type: string; payload: string | Uint8Array }) => {
        void bridge.requestApp("network", "broadcast", [message]);
      },
      sendTo: (peerId: string, message: { type: string; payload: string | Uint8Array }) => {
        void bridge.requestApp("network", "sendTo", [peerId, message]);
      },
      get connectedPeerCount() {
        return bridge.connectedPeerCount;
      },
      get connectedPeers() {
        return bridge.connectedPeers;
      },
      dispose: () => bridge.requestApp("network", "dispose", []) as Promise<void>,
    };
  }

  getConfig(): Readonly<ZerithDBConfig> {
    return Object.freeze({ ...this.config });
  }

  async dispose(): Promise<void> {
    if (this.fallbackApp !== null) {
      await this.fallbackApp.dispose();
      return;
    }

    await this.ready;
    if (this.port !== null) {
      this.port.postMessage({
        kind: "dispose",
        id: makeRequestId(),
        appId: this.appId,
      } satisfies ClientToWorkerMessage);
      this.port.close();
    }
  }

  db<T extends Record<string, unknown> = Record<string, unknown>>(
    name: string
  ): CollectionProxy<T> {
    if (this.fallbackApp !== null) {
      return this.fallbackApp.db<T>(name) as unknown as CollectionProxy<T>;
    }

    return {
      insert: (document: T) =>
        this.requestCollection(name, "insert", [document]) as Promise<InsertResult>,
      insertMany: (documents: T[]) =>
        this.requestCollection(name, "insertMany", [documents]) as Promise<InsertResult[]>,
      find: (filter?: QueryFilter<T>) =>
        this.requestCollection(name, "find", [filter ?? {}]) as Promise<Document<T>[]>,
      findById: (id: string) =>
        this.requestCollection(name, "findById", [id]) as Promise<Document<T> | undefined>,
      update: (filter: QueryFilter<T>, spec: UpdateSpec<T>) =>
        this.requestCollection(name, "update", [filter, spec]) as Promise<number>,
      delete: (target: QueryFilter<T> | string) =>
        this.requestCollection(name, "delete", [target]) as Promise<number>,
      clearAll: () => this.requestCollection(name, "clearAll", []) as Promise<void>,
      count: (filter?: QueryFilter<T>) =>
        this.requestCollection(name, "count", [filter ?? {}]) as Promise<number>,
      subscribe: (callback: SubscriptionCallback<T>) => {
        const subscriptionId = makeRequestId();
        this.subscriptionCallbacks.set(subscriptionId, (documents) => {
          callback(documents as Document<T>[]);
        });

        void this.ready.then(() => {
          this.postMessage({
            kind: "subscribe",
            id: subscriptionId,
            appId: this.appId,
            collectionName: name,
          } satisfies ClientToWorkerMessage);
        });

        return () => {
          this.subscriptionCallbacks.delete(subscriptionId);
          if (this.port !== null) {
            this.port.postMessage({
              kind: "unsubscribe",
              id: makeRequestId(),
              appId: this.appId,
              collectionName: name,
            } satisfies ClientToWorkerMessage);
          }
        };
      },
    };
  }

  private async requestApp(
    scope: Exclude<AppScope, "collection">,
    method: string,
    args: unknown[]
  ): Promise<unknown> {
    if (this.fallbackApp !== null) {
      const app = this.fallbackApp as unknown as Record<string, unknown>;
      const target = app[scope] as Record<string, unknown>;
      const handler = target[method];
      if (typeof handler !== "function") {
        throw new Error(`Unsupported app method: ${scope}.${method}`);
      }
      return await Promise.resolve(
        (handler as (...values: unknown[]) => unknown).apply(target, args)
      );
    }

    return this.request({
      kind: "request",
      id: makeRequestId(),
      appId: this.appId,
      scope,
      method,
      args,
    });
  }

  private async requestCollection(
    collectionName: string,
    method: string,
    args: unknown[]
  ): Promise<unknown> {
    if (this.fallbackApp !== null) {
      const collection = this.fallbackApp.db(collectionName) as unknown as Record<string, unknown>;
      const handler = collection[method];
      if (typeof handler !== "function") {
        throw new Error(`Unsupported collection method: ${method}`);
      }
      return await Promise.resolve(
        (handler as (...values: unknown[]) => unknown).apply(collection, args)
      );
    }

    return this.request({
      kind: "request",
      id: makeRequestId(),
      appId: this.appId,
      scope: "collection",
      collectionName,
      method,
      args,
    });
  }

  private async request(message: RequestMessage): Promise<unknown> {
    await this.ready;

    if (this.port === null) {
      throw new Error("SharedWorker is unavailable");
    }

    return new Promise<unknown>((resolve, reject) => {
      this.requestResolvers.set(message.id, { resolve, reject });
      this.port?.postMessage(message);
    });
  }

  private postMessage(message: ClientToWorkerMessage): void {
    if (this.port !== null) {
      this.port.postMessage(message);
    }
  }

  private handleMessage(message: WorkerToClientMessage): void {
    if (message.kind === "response") {
      const pending = this.requestResolvers.get(message.id);
      if (!pending) return;
      this.requestResolvers.delete(message.id);
      if (message.ok) {
        pending.resolve(message.value);
      } else {
        pending.reject(Object.assign(new Error(message.error.message), message.error));
      }
      return;
    }

    if (message.kind === "subscription") {
      const callback = this.subscriptionCallbacks.get(message.subscriptionId);
      if (callback) {
        callback(message.documents);
      }
      return;
    }

    if (message.kind === "state") {
      if (message.scope === "sync") {
        this.syncState = message.value as SyncState;
      } else {
        this.connectedPeers = (
          message.value as { connectedPeers: ZerithDBApp["network"]["connectedPeers"] }
        ).connectedPeers;
        this.connectedPeerCount = (
          message.value as { connectedPeerCount: number }
        ).connectedPeerCount;
      }
      return;
    }

    if (message.kind === "identity") {
      this.authIdentity = message.identity;
    }
  }
}

export function createSharedWorkerApp(config: ZerithDBConfig): SharedWorkerApp {
  const bridge = new SharedWorkerBridge(config);

  return {
    db: <T extends Record<string, unknown> = Record<string, unknown>>(name: string) =>
      bridge.db<T>(name),
    sync: bridge.sync,
    auth: bridge.auth,
    network: bridge.network,
    config: bridge.getConfig(),
    dispose: () => bridge.dispose(),
  };
}
