/**
 * Relays memory snapshots from the inspected page to the extension background.
 * Listens for CustomEvents dispatched by zerithdb-devtools MemoryCollector.
 */
const ZERITH_MEMORY_EVENT = "zerith:memory";

window.addEventListener(ZERITH_MEMORY_EVENT, (event) => {
  const snapshot = event.detail;
  if (!snapshot || typeof snapshot.timestamp !== "number") return;

  chrome.runtime.sendMessage({
    type: "zerith:memory-snapshot",
    snapshot,
  });
});
