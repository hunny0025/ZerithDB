// Minimal SharedWorker for testing
self.onconnect = (event) => {
  const [port] = event.ports;
  if (port === void 0) return;
  
  port.start();
  
  port.onmessage = (messageEvent) => {
    const message = messageEvent.data;
    console.log('[Worker] Received:', message.kind);
    
    try {
      if (message.kind === 'init') {
        // Simple init response
        port.postMessage({
          kind: "response",
          id: "init",
          ok: true,
          value: null
        });
      } else if (message.kind === 'echo') {
        // Echo back the message
        port.postMessage({
          kind: "response",
          id: message.id,
          ok: true,
          value: message.data
        });
      } else {
        port.postMessage({
          kind: "response",
          id: message.id,
          ok: false,
          error: { message: "Unknown message kind" }
        });
      }
    } catch (error) {
      port.postMessage({
        kind: "response",
        id: message.id,
        ok: false,
        error: { message: error.message }
      });
    }
  };
};
