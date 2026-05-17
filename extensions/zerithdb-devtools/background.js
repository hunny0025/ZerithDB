/**
 * Message bridge: content script (inspected page) → DevTools panel.
 */
const panelPorts = new Map();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "zerith-devtools-panel") return;

  port.onMessage.addListener((message) => {
    if (message?.type !== "zerith:register-panel") return;
    if (typeof message.tabId !== "number") return;

    panelPorts.set(message.tabId, port);

    port.onDisconnect.addListener(() => {
      if (panelPorts.get(message.tabId) === port) {
        panelPorts.delete(message.tabId);
      }
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== "zerith:memory-snapshot") return;

  const tabId = sender.tab?.id;
  if (tabId === undefined) return;

  const port = panelPorts.get(tabId);
  port?.postMessage({
    type: "zerith:memory-snapshot",
    snapshot: message.snapshot,
  });
});
