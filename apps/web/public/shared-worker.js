import { serializeError } from "./chunk-U4PLIMGS.js";
import { createApp } from "zerithdb-sdk";

var contexts = /* @__PURE__ */ new Map();
var portToAppId = /* @__PURE__ */ new WeakMap();
var portToSubscriptions = /* @__PURE__ */ new WeakMap();
self.onconnect = (event) => {
  const [port] = event.ports;
  if (port === void 0) return;
  port.start();
  port.onmessage = async (messageEvent) => {
    try {
      await handleMessage(port, messageEvent.data);
    } catch (error) {
      const response =
        messageEvent.data.kind === "request" || messageEvent.data.kind === "dispose"
          ? { kind: "response", id: messageEvent.data.id, ok: false, error: serializeError(error) }
          : null;
      if (response !== null) {
        port.postMessage(response);
      }
    }
  };
};
async function handleMessage(port, message) {
  switch (message.kind) {
    case "init": {
      const context = ensureContext(message);
      context.ports.add(port);
      portToAppId.set(port, message.appId);
      if (!portToSubscriptions.has(port)) {
        portToSubscriptions.set(port, /* @__PURE__ */ new Set());
      }
      port.postMessage({
        kind: "response",
        id: "init",
        ok: true,
        value: null,
      });
      return;
    }
    case "request": {
      const context = ensureContextForApp(message.appId);
      const value = await handleRequest(context, message);
      port.postMessage({ kind: "response", id: message.id, ok: true, value });
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
function ensureContext(init) {
  const existing = contexts.get(init.appId);
  if (existing) return existing;
  const app = createApp(init.config);
  const context = {
    app,
    ports: /* @__PURE__ */ new Set(),
    subscriptions: /* @__PURE__ */ new Map(),
  };
  app.sync.on("state:change", (state) => {
    broadcastToApp(init.appId, {
      kind: "state",
      appId: init.appId,
      scope: "sync",
      value: state,
    });
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
function ensureContextForApp(appId) {
  const existing = contexts.get(appId);
  if (existing) return existing;
  throw new Error(`ZerithDB app "${appId}" has not been initialized in this worker`);
}
async function handleRequest(context, message) {
  if (message.scope === "collection") {
    if (!message.collectionName) {
      throw new Error("Missing collection name");
    }
    const collection = context.app.db(message.collectionName);
    return await invoke(collection, message.method, message.args);
  }
  return await invoke(context.app[message.scope], message.method, message.args);
}
async function handleSubscribe(port, context, message) {
  const collection = context.app.db(message.collectionName);
  const subscriptionId = message.id;
  const callback = (documents) => {
    port.postMessage({
      kind: "subscription",
      appId: message.appId,
      collectionName: message.collectionName,
      subscriptionId,
      documents,
    });
  };
  const unsubscribe = collection.subscribe(callback);
  context.subscriptions.set(subscriptionId, unsubscribe);
  if (!portToSubscriptions.has(port)) {
    portToSubscriptions.set(port, /* @__PURE__ */ new Set());
  }
  portToSubscriptions.get(port)?.add(subscriptionId);
}
async function handleDispose(port, message) {
  const appId = message.appId;
  const context = contexts.get(appId);
  if (!context) {
    port.postMessage({ kind: "response", id: message.id, ok: true, value: null });
    return;
  }
  context.ports.delete(port);
  cleanupPortSubscriptions(port, context);
  if (context.ports.size === 0) {
    await context.app.dispose();
    contexts.delete(appId);
  }
  port.postMessage({ kind: "response", id: message.id, ok: true, value: null });
}
function cleanupPortSubscriptions(port, context) {
  const subscriptions = portToSubscriptions.get(port);
  if (!subscriptions) return;
  for (const subscriptionId of subscriptions) {
    context.subscriptions.get(subscriptionId)?.();
    context.subscriptions.delete(subscriptionId);
  }
  subscriptions.clear();
}
function broadcastToApp(appId, message) {
  const context = contexts.get(appId);
  if (!context) return;
  for (const port of context.ports) {
    port.postMessage(message);
  }
}
function broadcastNetworkState(appId) {
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
  });
}
async function invoke(target, method, args) {
  const handler = target[method];
  if (typeof handler !== "function") {
    throw new Error(`Unsupported method: ${method}`);
  }
  return await Promise.resolve(handler.apply(target, args));
}
