import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

// Configuration
const PORT = parseInt(process.env["PORT"] ?? "4000", 10);
const HOST = process.env["HOST"] ?? "0.0.0.0";

// Connection pooling / idle timeout settings
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes idle timeout
// Tracks the last activity timestamp for each peerId
const peerLastSeen = new Map<string, number>();

// roomId → Set of { peerId, ws }
const rooms = new Map<string, Set<{ peerId: string; ws: WebSocket }>>();

const server = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      service: "zerithdb-signaling",
      version: "0.1.0",
      rooms: rooms.size,
      peers: [...rooms.values()].reduce((acc, s) => acc + s.size, 0),
    })
  );
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  // Use a dummy base for parsing relative URLs
  const url = new URL(req.url ?? "/", "http://localhost");
  const roomId = url.searchParams.get("room");
  const peerId = url.searchParams.get("peer");

  if (!roomId || !peerId) {
    console.log(`[!] Rejected connection from ${req.socket.remoteAddress}: missing params`);
    ws.close(1008, "Missing room or peer query parameters");
    return;
  }

  // Ensure room exists
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  const room = rooms.get(roomId)!;

  // Add peer to room
  const peerEntry = { peerId, ws };
  room.add(peerEntry);

  // Record initial activity timestamp
  peerLastSeen.set(peerId, Date.now());

  console.log(`[+] peer=${peerId} joined room=${roomId} (room size: ${room.size})`);

  // Send the new peer the list of existing peers
  const existingPeerIds = [...room]
    .filter((p) => p.peerId !== peerId)
    .map((p) => p.peerId);

  ws.send(JSON.stringify({ type: "peer-list", from: "server", payload: existingPeerIds }));

  // Relay messages between peers
  ws.on("message", (data) => {
    let msg: { to?: string; from?: string; [key: string]: unknown };
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return; // Ignore malformed messages
    }

    // Update activity timestamp for this peer
    peerLastSeen.set(peerId, Date.now());

    // Stamp the sender
    msg.from = peerId;

    const serialized = JSON.stringify(msg);

    if (msg["to"] !== undefined) {
      // Unicast to a specific peer
      const target = [...room].find((p) => p.peerId === msg["to"]);
      if (target?.ws.readyState === WebSocket.OPEN) {
        target.ws.send(serialized);
      }
    } else {
      // Broadcast to all peers in the room except sender
      for (const peer of room) {
        if (peer.peerId !== peerId && peer.ws.readyState === WebSocket.OPEN) {
          peer.ws.send(serialized);
        }
      }
    }
  });

  ws.on("close", () => {
    // Cleanup on close
    room.delete(peerEntry);
    peerLastSeen.delete(peerId);
    console.log(`[-] peer=${peerId} left room=${roomId} (room size: ${room.size})`);

    // Clean up empty rooms
    if (room.size === 0) {
      rooms.delete(roomId);
    } else {
      // Notify remaining peers
      const leaveMsg = JSON.stringify({ type: "peer-left", from: "server", payload: peerId });
      for (const peer of room) {
        if (peer.ws.readyState === WebSocket.OPEN) {
          peer.ws.send(leaveMsg);
        }
      }
    }
  });

  ws.on("error", (err) => {
    console.error(`[!] peer=${peerId} error:`, err.message);
    room.delete(peerEntry);
  });
});

// Periodic cleanup of idle connections (basic connection pooling)
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    for (const peer of Array.from(room)) {
      const lastSeen = peerLastSeen.get(peer.peerId) ?? 0;
      if (now - lastSeen > IDLE_TIMEOUT_MS) {
        // Force close idle connection
        try {
          peer.ws.close(1000, "Idle timeout");
        } catch {}
        room.delete(peer);
        peerLastSeen.delete(peer.peerId);
        console.log(`[*] Closed idle peer=${peer.peerId} from room=${roomId}`);
      }
    }
    // Remove empty rooms after cleanup
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  }
}, 60_000); // run every minute

server.listen(PORT, HOST, () => {
  console.log(`🚀 ZerithDB Signaling Server running at ws://${HOST}:${PORT}`);
  console.log(`   HTTP health check: http://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down signaling server...");
  wss.close(() => server.close(() => process.exit(0)));
});
