// E2E test worker - self-contained for SharedWorker
// This mimics the shared-worker behavior for testing purposes

// In-memory storage for subscription callbacks
const appContexts = new Map();

self.onconnect = (event) => {
  const [port] = event.ports;
  if (!port) return;
  
  port.start();
  
  port.onmessage = async (messageEvent) => {
    const message = messageEvent.data;
    console.log('[E2E Worker] Received:', message.kind);
    
    try {
      switch (message.kind) {
        case 'init': {
          const appId = message.appId;
          if (!appContexts.has(appId)) {
            appContexts.set(appId, {
              appId,
              ports: new Set(),
              collections: new Map(),
              subscriptions: new Map()
            });
          }
          const ctx = appContexts.get(appId);
          ctx.ports.add(port);
          
          port.postMessage({
            kind: 'response',
            id: 'init',
            ok: true,
            value: null
          });
          break;
        }
        
        case 'request': {
          const appCtx = appContexts.get(message.appId);
          if (!appCtx) throw new Error('App not initialized');
          
          if (message.scope === 'collection') {
            const collection = appCtx.collections.get(message.collectionName) || { docs: [] };
            
            if (message.method === 'insert') {
              const doc = message.args[0];
              doc._id = 'id-' + Date.now() + '-' + Math.random();
              doc._createdAt = Date.now();
              doc._updatedAt = Date.now();
              collection.docs.push(doc);
              appCtx.collections.set(message.collectionName, collection);
              
              // Notify all subscriptions for this collection
              broadcastCollectionUpdate(appCtx, message.collectionName, collection.docs);
              
              port.postMessage({
                kind: 'response',
                id: message.id,
                ok: true,
                value: { id: doc._id }
              });
            } else {
              throw new Error('Unknown collection method');
            }
          }
          break;
        }
        
        case 'subscribe': {
          const appCtx = appContexts.get(message.appId);
          if (!appCtx) throw new Error('App not initialized');
          
          const collection = appCtx.collections.get(message.collectionName) || { docs: [] };
          const subId = message.id;
          
          // Send initial snapshot
          port.postMessage({
            kind: 'subscription',
            appId: message.appId,
            collectionName: message.collectionName,
            subscriptionId: subId,
            documents: collection.docs
          });
          
          // Store subscription
          appCtx.subscriptions.set(subId, {
            port,
            collectionName: message.collectionName
          });
          break;
        }
        
        default:
          throw new Error('Unknown message kind: ' + message.kind);
      }
    } catch (error) {
      port.postMessage({
        kind: 'response',
        id: message.id,
        ok: false,
        error: {
          name: error.name,
          message: error.message
        }
      });
    }
  };
};

function broadcastCollectionUpdate(appCtx, collectionName, docs) {
  appCtx.subscriptions.forEach((sub, subId) => {
    if (sub.collectionName === collectionName) {
      sub.port.postMessage({
        kind: 'subscription',
        appId: appCtx.appId,
        collectionName: collectionName,
        subscriptionId: subId,
        documents: docs
      });
    }
  });
}
