const MAX_POINTS = 60;
const RTC_WARN_BYTES = 512 * 1024;
const RTC_DANGER_BYTES = 2 * 1024 * 1024;

const peaks = { idb: 0, rtc: 0 };
const labels = [];
const idbData = [];
const rtcData = [];

const inspectedTabId = chrome.devtools.inspectedWindow.tabId;

const els = {
  idbCurrent: document.getElementById("idb-current"),
  idbPeak: document.getElementById("idb-peak"),
  idbRecords: document.getElementById("idb-records"),
  idbCard: document.getElementById("idb-card"),
  rtcCurrent: document.getElementById("rtc-current"),
  rtcPeak: document.getElementById("rtc-peak"),
  rtcPeers: document.getElementById("rtc-peers"),
  rtcCard: document.getElementById("rtc-card"),
  peerList: document.getElementById("peer-list"),
  status: document.getElementById("status"),
  clearBtn: document.getElementById("clear-btn"),
};

const chart = new Chart(document.getElementById("memory-chart"), {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "IndexedDB",
        data: idbData,
        borderColor: "#4fc3f7",
        backgroundColor: "rgba(79, 195, 247, 0.1)",
        tension: 0.25,
        fill: true,
        pointRadius: 0,
      },
      {
        label: "WebRTC buffers",
        data: rtcData,
        borderColor: "#81c784",
        backgroundColor: "rgba(129, 199, 132, 0.1)",
        tension: 0.25,
        fill: true,
        pointRadius: 0,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        labels: { color: "#e8e8e8", boxWidth: 12, font: { size: 11 } },
      },
    },
    scales: {
      x: {
        ticks: { color: "#9a9a9a", maxTicksLimit: 8, font: { size: 10 } },
        grid: { color: "rgba(255,255,255,0.06)" },
      },
      y: {
        ticks: {
          color: "#9a9a9a",
          font: { size: 10 },
          callback: (value) => formatBytes(value),
        },
        grid: { color: "rgba(255,255,255,0.06)" },
      },
    },
  },
});

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function setAlert(card, bytes, warnAt, dangerAt) {
  card.classList.remove("warn", "danger");
  if (bytes >= dangerAt) card.classList.add("danger");
  else if (bytes >= warnAt) card.classList.add("warn");
}

function updatePeerList(peers) {
  els.peerList.replaceChildren();

  if (!peers || peers.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No peers connected";
    els.peerList.appendChild(li);
    return;
  }

  for (const peer of peers) {
    const li = document.createElement("li");
    const id = document.createElement("span");
    id.className = "peer-id";
    id.textContent = peer.peerId;
    id.title = peer.peerId;

    const buf = document.createElement("span");
    buf.textContent = formatBytes(peer.bufferedAmount);

    li.append(id, buf);
    els.peerList.appendChild(li);
  }
}

function clearGraph() {
  labels.length = 0;
  idbData.length = 0;
  rtcData.length = 0;
  peaks.idb = 0;
  peaks.rtc = 0;
  chart.update();
  els.idbCurrent.textContent = "—";
  els.rtcCurrent.textContent = "—";
  els.idbPeak.textContent = "Peak: —";
  els.rtcPeak.textContent = "Peak: —";
}

function handleSnapshot(snapshot) {
  if (!snapshot?.indexedDB || !snapshot?.webrtc) return;

  const idbBytes = snapshot.indexedDB.totalBytes ?? 0;
  const rtcBytes = snapshot.webrtc.bufferedBytes ?? 0;

  peaks.idb = Math.max(peaks.idb, idbBytes);
  peaks.rtc = Math.max(peaks.rtc, rtcBytes);

  labels.push(formatTime(snapshot.timestamp));
  idbData.push(idbBytes);
  rtcData.push(rtcBytes);

  if (labels.length > MAX_POINTS) {
    labels.shift();
    idbData.shift();
    rtcData.shift();
  }

  els.idbCurrent.textContent = formatBytes(idbBytes);
  els.idbPeak.textContent = `Peak: ${formatBytes(peaks.idb)}`;
  els.idbRecords.textContent = `Records: ${snapshot.indexedDB.recordCount ?? 0}`;

  els.rtcCurrent.textContent = formatBytes(rtcBytes);
  els.rtcPeak.textContent = `Peak: ${formatBytes(peaks.rtc)}`;
  els.rtcPeers.textContent = `Peers: ${snapshot.webrtc.peerCount ?? 0}`;

  setAlert(els.rtcCard, rtcBytes, RTC_WARN_BYTES, RTC_DANGER_BYTES);

  updatePeerList(snapshot.webrtc.peers);
  chart.update();

  els.status.textContent = `Live · last update ${formatTime(snapshot.timestamp)}`;
  els.status.classList.add("live");
}

els.clearBtn.addEventListener("click", clearGraph);

const port = chrome.runtime.connect({ name: "zerith-devtools-panel" });
port.postMessage({ type: "zerith:register-panel", tabId: inspectedTabId });

port.onMessage.addListener((message) => {
  if (message?.type === "zerith:memory-snapshot") {
    handleSnapshot(message.snapshot);
  }
});

// Fallback poll when content-script relay is unavailable
setInterval(() => {
  chrome.devtools.inspectedWindow.eval(
    "window.__ZERITH_MEMORY_LATEST__",
    (result, exceptionInfo) => {
      if (exceptionInfo || !result) return;
      handleSnapshot(result);
    }
  );
}, 3000);
