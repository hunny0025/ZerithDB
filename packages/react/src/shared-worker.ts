import { createApp } from "zerithdb-sdk";
import type { Document, Identity, SyncState, ZerithDBConfig } from "zerithdb-sdk";
import type {
  ClientToWorkerMessage,
  DisposeMessage,
  InitMessage,
  RequestMessage,
  SubscribeMessage,
  UnsubscribeMessage,
  WorkerToClientMessage,
} from "./shared-worker-protocol.js";
import { serializeError } from "./shared-worker-protocol.js";

type AppContext = {
  app: ReturnType<typeof createApp>;
  ports: Set<MessagePort>;
  subscriptions: Map<string, () => void>;
};

const contexts = new Map<string, AppContext>();
const portToAppId = new WeakMap<MessagePort, string>();
const portToSubscriptions = new WeakMap<MessagePort, Set<string>>();

declare const self: typeof globalThis & {
  onconnect: ((event: MessageEvent) => void) | null;
};

self.onconnect = (event: MessageEvent) => {
  const [port] = event.ports;
  if (port === undefined) return;

  port.start();
  port.onmessage = async (messageEvent: MessageEvent<ClientToWorkerMessage>) => {
    try {
      await handleMessage(port, messageEvent.data);
    } catch (error) {
      const response = messageEvent.data.kind === "request" || messageEvent.data.kind === "dispose"
        ? ({ kind: "response", id: messageEvent.data.id, ok: false, error: serializeError(error) } as const)
        : null;
      if (response !== null) {
        port.postMessage(response satisfies WorkerToClientMessage);
      }
    }
  };
};

async function handleMessage(port: MessagePort, message: ClientToWorkerMessage): Promise<void> {
  switch (message.kind) {
    case "init": {
      const context = ensureContext(message);
      context.ports.add(port);
      portToAppId.set(port, message.appId);
      if (!portToSubscriptions.has(port)) {
        portToSubscriptions.set(port, new Set<string>());
      }
      port.postMessage({
        kind: "response",
        id: "init",
        ok: true,
        value: null,
      } satisfies WorkerToClientMessage);
      return;
    }
    case "request": {
      const context = ensureContextForApp(message.appId);
      const value = await handleRequest(context, message);
      port.postMessage({ kind: "response", id: message.id, ok: true, value } satisfies WorkerToClientMessage);
      return;
    }
    case "subscribe": {
      const context = ensureContextForApp(message.appId);
      await handleSubscribe(port, context, message);
      return;
    }
    case "unsubscribe": {
      const context = contexts.get(message.appId);
      if (!context) return;
      context.subscriptions.get(message.id)?.();
      context.subscriptions.delete(message.id);
      portToSubscriptions.get(port)?.delete(message.id);
      return;
    }
    case "dispose": {
      await handleDispose(port, message);
      return;
    }
  }
}

function ensureContext(init: InitMessage): AppContext {
  const existing = contexts.get(init.appId);
  if (existing) return existing;

  const app = createApp(init.config);
  const context: AppContext = {
    app,
    ports: new Set<MessagePort>(),
    subscriptions: new Map<string, () => void>(),
  };

  app.sync.on("state:change", (state: SyncState) => {
    broadcastToApp(init.appId, {
      kind: "state",
      appId: init.appId,
      scope: "sync",
      value: state,
    } satisfies WorkerToClientMessage);
  });

  app.network.on("peer:connected", () => {
    broadcastNetworkState(init.appId);
  });
  app.network.on("peer:disconnected", () => {
    broadcastNetworkState(init.appId);
  });

  contexts.set(init.appId, context);
  broadcastNetworkState(init.appId);
  return context;
}

function ensureContextForApp(appId: string): AppContext {
  const existing = contexts.get(appId);
  if (existing) return existing;

  throw new Error(`ZerithDB app "${appId}" has not been initialized in this worker`);
}

async function handleRequest(context: AppContext, message: RequestMessage): Promise<unknown> {
  if (message.scope === "collection") {
    if (!message.collectionName) {
      throw new Error("Missing collection name");
    }

    const collection = context.app.db(message.collectionName);
    return await invoke(collection as unknown as Record<string, unknown>, message.method, message.args);
  }

  return await invoke((context.app as unknown as Record<string, unknown>)[message.scope] as Record<string, unknown>, message.method, message.args);
}

async function handleSubscribe(port: MessagePort, context: AppContext, message: SubscribeMessage): Promise<void> {
  const collection = context.app.db(message.collectionName);
  const subscriptionId = message.id;
  const callback = (documents: Document<Record<string, unknown>>[]) => {
    port.postMessage({
      kind: "subscription",
      appId: message.appId,
      collectionName: message.collectionName,
      subscriptionId,
      documents,
    } satisfies WorkerToClientMessage);
  };

  const unsubscribe = collection.subscribe(callback);
  context.subscriptions.set(subscriptionId, unsubscribe);

  if (!portToSubscriptions.has(port)) {
    portToSubscriptions.set(port, new Set<string>());
  }

  portToSubscriptions.get(port)?.add(subscriptionId);
}

async function handleDispose(port: MessagePort, message: DisposeMessage): Promise<void> {
  const appId = message.appId;
  const context = contexts.get(appId);
  if (!context) {
    port.postMessage({ kind: "response", id: message.id, ok: true, value: null } satisfies WorkerToClientMessage);
    return;
  }

  context.ports.delete(port);
  cleanupPortSubscriptions(port, context);

  if (context.ports.size === 0) {
    await context.app.dispose();
    contexts.delete(appId);
  }

  port.postMessage({ kind: "response", id: message.id, ok: true, value: null } satisfies WorkerToClientMessage);
}

function cleanupPortSubscriptions(port: MessagePort, context: AppContext): void {
  const subscriptions = portToSubscriptions.get(port);
  if (!subscriptions) return;

  for (const subscriptionId of subscriptions) {
    context.subscriptions.get(subscriptionId)?.();
    context.subscriptions.delete(subscriptionId);
  }

  subscriptions.clear();
}

function broadcastToApp(appId: string, message: WorkerToClientMessage): void {
  const context = contexts.get(appId);
  if (!context) return;

  for (const port of context.ports) {
    port.postMessage(message);
  }
}

function broadcastNetworkState(appId: string): void {
  const context = contexts.get(appId);
  if (!context) return;

  broadcastToApp(appId, {
    kind: "state",
    appId,
    scope: "network",
    value: {
      connectedPeerCount: context.app.network.connectedPeerCount,
      connectedPeers: context.app.network.connectedPeers,
    },
  } satisfies WorkerToClientMessage);
}

async function invoke(target: Record<string, unknown>, method: string, args: unknown[]): Promise<unknown> {
  const handler = target[method];
  if (typeof handler !== "function") {
    throw new Error(`Unsupported method: ${method}`);
  }

  return await Promise.resolve((handler as (...values: unknown[]) => unknown).apply(target, args));
}
