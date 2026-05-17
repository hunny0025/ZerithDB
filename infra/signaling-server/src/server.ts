import { WebSocketServer, WebSocket } from "ws";
import { createServer, type IncomingMessage, type ServerResponse } from "http";

const PORT = parseInt(process.env["PORT"] ?? "4000", 10);
const HOST = process.env["HOST"] ?? "0.0.0.0";
type LogLevel = "debug" | "info" | "warn" | "error";

const validLogLevels: LogLevel[] = ["debug", "info", "warn", "error"];

const envLogLevel = process.env["LOG_LEVEL"];

const LOG_LEVEL: LogLevel =
  envLogLevel && validLogLevels.includes(envLogLevel as LogLevel)
    ? (envLogLevel as LogLevel)
    : "info";
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};
const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[LOG_LEVEL];
};
const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog("debug")) console.debug(...args);
  },

  info: (...args: unknown[]) => {
    if (shouldLog("info")) console.info(...args);
  },

  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) console.warn(...args);
  },

  error: (...args: unknown[]) => {
    if (shouldLog("error")) console.error(...args);
  },
};
const SERVER_START_TIME = Date.now();

// ─── Shared room state ──────────────────────────────────────────────────────

interface PeerEntry {
  peerId: string;
  ws?: WebSocket; // present for WebSocket peers
  sessionId?: string; // present for polling peers
}

// roomId → Set of PeerEntry
const rooms = new Map<string, Set<PeerEntry>>();

// ─── Polling session state ──────────────────────────────────────────────────

interface PollingSession {
  sessionId: string;
  peerId: string;
  roomId: string;
  messageQueue: string[];
  /** Pending long-poll response waiting for messages */
  pendingResponse: ServerResponse | null;
  /** Timestamp of last activity (poll or send) */
  lastActivity: number;
}

// sessionId → PollingSession
const pollingSessions = new Map<string, PollingSession>();

/** How long a polling session can be inactive before cleanup (ms) */
const SESSION_TIMEOUT_MS = 60_000;

/** How long a single long-poll request blocks waiting for messages (ms) */
const LONG_POLL_TIMEOUT_MS = 30_000;

// Clean up expired sessions every 15 seconds
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of pollingSessions) {
    if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
      cleanupPollingSession(sessionId);
    }
  }
}, 15_000);

// ─── HTTP server ────────────────────────────────────────────────────────────

const server = createServer((req, res) => {
  // CORS headers for polling requests from browsers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const pathname = url.pathname;

  // Health check (existing behavior)
  if ((pathname === "/" || pathname === "/health") && req.method === "GET") {
    const uptimeSeconds = Math.floor((Date.now() - SERVER_START_TIME) / 1000);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "zerithdb-signaling",
        version: "0.1.0",
        uptime_seconds: uptimeSeconds,
        active_ws_connections: wss.clients.size,
        active_polling_sessions: pollingSessions.size,
        rooms: rooms.size,
        peers: [...rooms.values()].reduce((acc, s) => acc + s.size, 0),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // ─── Long-polling endpoints ───────────────────────────────────────────

  if (pathname === "/poll/join" && req.method === "POST") {
    handlePollJoin(req, res);
    return;
  }

  if (pathname === "/poll/messages" && req.method === "GET") {
    handlePollMessages(url, res);
    return;
  }

  if (pathname === "/poll/send" && req.method === "POST") {
    handlePollSend(req, res);
    return;
  }

  if (pathname === "/poll/leave" && req.method === "POST") {
    handlePollLeave(req, res);
    return;
  }

  // 404 for everything else
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

// ─── WebSocket server ───────────────────────────────────────────────────────

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  // Use a dummy base for parsing relative URLs
  const url = new URL(req.url ?? "/", "http://localhost");
  const roomId = url.searchParams.get("room");
  const peerId = url.searchParams.get("peer");

  if (!roomId || !peerId) {
    logger.warn(`[!] Rejected connection from ${req.socket.remoteAddress}: missing params`);
    ws.close(1008, "Missing room or peer query parameters");
    return;
  }

  // Ensure room exists
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  const room = rooms.get(roomId)!;

  // Add peer to room
  const peerEntry: PeerEntry = { peerId, ws };
  room.add(peerEntry);

  logger.info(`[+] peer=${peerId} joined room=${roomId} (room size: ${room.size})`);
  logger.info(`[+] peer=${peerId} joined room=${roomId} via WebSocket (room size: ${room.size})`);

  // Send the new peer the list of existing peers
  const existingPeerIds = [...room].filter((p) => p.peerId !== peerId).map((p) => p.peerId);

  ws.send(JSON.stringify({ type: "peer-list", from: "server", payload: existingPeerIds }));

  // Relay messages between peers
  ws.on("message", (data) => {
    logger.debug(
      `[MESSAGE] peer=${peerId} room=${roomId}`
    );
    let msg: { to?: string; from?: string; [key: string]: unknown };
    try {
      msg = JSON.parse(data.toString());
    } catch {
        logger.warn(`[!] Invalid message from peer=${peerId}`);
        return;
      }

    // Stamp the sender
    msg.from = peerId;

    relayMessage(roomId, peerId, msg);
  });

  ws.on("close", () => {
    room.delete(peerEntry);
    logger.info(`[-] peer=${peerId} left room=${roomId} (room size: ${room.size})`);
    // Clean up empty rooms
    if (room.size === 0) {
      rooms.delete(roomId);
    } else {
      // Notify remaining peers
      broadcastToRoom(roomId, peerId, {
        type: "peer-left",
        from: "server",
        payload: peerId,
      });
    }
  });

  ws.on("error", (err) => {
    logger.error(
      `[!] peer=${peerId} error=${err.message}`
    );
    room.delete(peerEntry);
  });
});

// ─── Shared relay logic ─────────────────────────────────────────────────────

/**
 * Relay a signaling message within a room.
 * Handles both unicast (msg.to is set) and broadcast.
 * Delivers to both WebSocket and polling peers.
 */
function relayMessage(
  roomId: string,
  senderPeerId: string,
  msg: { to?: string; from?: string; [key: string]: unknown }
): void {
  const room = rooms.get(roomId);
  if (!room) return;

  const serialized = JSON.stringify(msg);

  if (msg.to !== undefined) {
    // Log unicast messaging details for debugging (Safely handle optional msg.to)
    logger.debug(`[UNICAST] from=${senderPeerId} to=${msg.to ?? "unknown"}`);

    // Unicast to a specific peer
    for (const peer of room) {
      if (peer.peerId === msg.to) {
        deliverToPeer(peer, serialized);
        break;
      }
    }
  } else {
    // Log broadcast messaging details for debugging
    logger.debug(`[BROADCAST] from=${senderPeerId} room=${roomId}`);

    // Broadcast to all peers except sender
    for (const peer of room) {
      if (peer.peerId !== senderPeerId) {
        deliverToPeer(peer, serialized);
      }
    }
  }
}

/**
 * Broadcast a server-originated message to all peers in a room except one.
 */
function broadcastToRoom(
  roomId: string,
  excludePeerId: string,
  msg: Record<string, unknown>
): void {
  const room = rooms.get(roomId);
  if (!room) return;

  const serialized = JSON.stringify(msg);
  for (const peer of room) {
    if (peer.peerId !== excludePeerId) {
      deliverToPeer(peer, serialized);
    }
  }
}

/**
 * Deliver a serialized message to a peer, whether WebSocket or polling.
 */
function deliverToPeer(peer: PeerEntry, serialized: string): void {
  if (peer.ws && peer.ws.readyState === WebSocket.OPEN) {
    peer.ws.send(serialized);
  } else if (peer.sessionId) {
    const session = pollingSessions.get(peer.sessionId);
    if (session) {
      enqueuePollingMessage(session, serialized);
    }
  }
}

// ─── Polling endpoint handlers ──────────────────────────────────────────────

/**
 * POST /poll/join
 * Body: { room: string, peer: string }
 * Response: { sessionId: string, peerList: string[] }
 */
function handlePollJoin(req: IncomingMessage, res: ServerResponse): void {
  readJsonBody(req, (err, body: { room?: string; peer?: string } | null) => {
    if (err || !body?.room || !body?.peer) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing room or peer" }));
      return;
    }

    const { room: roomId, peer: peerId } = body;
    const sessionId = crypto.randomUUID();

    // Ensure room exists
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    const room = rooms.get(roomId)!;

    // Build peer list BEFORE adding this peer
    const peerList = [...room].filter((p) => p.peerId !== peerId).map((p) => p.peerId);

    // Create session
    const session: PollingSession = {
      sessionId,
      peerId,
      roomId,
      messageQueue: [],
      pendingResponse: null,
      lastActivity: Date.now(),
    };
    pollingSessions.set(sessionId, session);

    // Add peer to room
    const peerEntry: PeerEntry = { peerId, sessionId };
    room.add(peerEntry);

    console.log(
      `[+] peer=${peerId} joined room=${roomId} via HTTP polling ` +
        `(session=${sessionId.slice(0, 8)}…, room size: ${room.size})`
    );

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ sessionId, peerList }));
  });
}

/**
 * GET /poll/messages?session=<id>&room=<room>
 * Long-polls for up to 30 seconds. Returns immediately if messages are queued.
 * Response: { messages: string[] }
 */
function handlePollMessages(url: URL, res: ServerResponse): void {
  const sessionId = url.searchParams.get("session");
  const roomId = url.searchParams.get("room");

  if (!sessionId || !roomId) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing session or room" }));
    return;
  }

  const session = pollingSessions.get(sessionId);
  if (!session || session.roomId !== roomId) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Session not found" }));
    return;
  }

  session.lastActivity = Date.now();

  // If there are queued messages, return them immediately
  if (session.messageQueue.length > 0) {
    const messages = session.messageQueue.splice(0);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ messages }));
    return;
  }

  // Otherwise, hold the connection open until a message arrives or timeout
  session.pendingResponse = res;

  const timer = setTimeout(() => {
    if (session.pendingResponse === res) {
      session.pendingResponse = null;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ messages: [] }));
    }
  }, LONG_POLL_TIMEOUT_MS);

  // Clean up if the client disconnects while waiting
  res.on("close", () => {
    clearTimeout(timer);
    if (session.pendingResponse === res) {
      session.pendingResponse = null;
    }
  });
}

/**
 * POST /poll/send
 * Body: { session: string, room: string, message: object }
 * Relays the message to other peers in the room.
 */
function handlePollSend(req: IncomingMessage, res: ServerResponse): void {
  readJsonBody(req, (err, body: { session?: string; room?: string; message?: any } | null) => {
    if (err || !body?.session || !body?.room || !body?.message) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing session, room, or message" }));
      return;
    }

    const session = pollingSessions.get(body.session);
    if (!session || session.roomId !== body.room) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Session not found" }));
      return;
    }

    session.lastActivity = Date.now();

    // Stamp the sender
    const msg = body.message;
    msg.from = session.peerId;

    relayMessage(body.room, session.peerId, msg);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });
}

/**
 * POST /poll/leave
 * Body: { session: string, room: string }
 * Graceful departure — cleans up immediately.
 */
function handlePollLeave(req: IncomingMessage, res: ServerResponse): void {
  readJsonBody(req, (err, body: { session?: string; room?: string } | null) => {
    if (err || !body?.session || !body?.room) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing session or room" }));
      return;
    }

    cleanupPollingSession(body.session);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });
}

// ─── Polling helpers ────────────────────────────────────────────────────────

/**
 * Enqueue a message for a polling session.
 * If there's a pending long-poll response, flush immediately.
 */
function enqueuePollingMessage(session: PollingSession, serialized: string): void {
  if (session.pendingResponse !== null) {
    // Long-poll is waiting — respond immediately with this message
    const res = session.pendingResponse;
    session.pendingResponse = null;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ messages: [serialized] }));
  } else {
    // Queue for next poll
    session.messageQueue.push(serialized);
  }
}

/**
 * Clean up a polling session: remove from room, notify peers, delete state.
 */
function cleanupPollingSession(sessionId: string): void {
  const session = pollingSessions.get(sessionId);
  if (!session) return;

  const { peerId, roomId } = session;

  // Cancel any pending long-poll response
  if (session.pendingResponse !== null) {
    try {
      session.pendingResponse.writeHead(410, { "Content-Type": "application/json" });
      session.pendingResponse.end(JSON.stringify({ error: "Session expired" }));
    } catch {
      // Response may already be closed
    }
    session.pendingResponse = null;
  }

  // Remove peer from room
  const room = rooms.get(roomId);
  if (room) {
    for (const entry of room) {
      if (entry.sessionId === sessionId) {
        room.delete(entry);
        break;
      }
    }

    if (room.size === 0) {
      rooms.delete(roomId);
    } else {
      broadcastToRoom(roomId, peerId, {
        type: "peer-left",
        from: "server",
        payload: peerId,
      });
    }
  }

  pollingSessions.delete(sessionId);
  console.log(
    `[-] peer=${peerId} left room=${roomId} via session cleanup ` +
      `(session=${sessionId.slice(0, 8)}…)`
  );
}

// ─── Utilities ──────────────────────────────────────────────────────────────

/**
 * Read and parse a JSON request body.
 */
function readJsonBody(req: IncomingMessage, cb: (err: Error | null, body: any) => void): void {
  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => chunks.push(chunk));
  req.on("end", () => {
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString());
      cb(null, body);
    } catch (e) {
      cb(e as Error, null);
    }
  });
  req.on("error", (err) => cb(err, null));
}

// ─── Start ──────────────────────────────────────────────────────────────────

server.listen(PORT, HOST, () => {
  logger.info(`🚀 ZerithDB Signaling Server running at ws://${HOST}:${PORT}`);
  logger.info(`   HTTP health check: http://${HOST}:${PORT}`);
  logger.info(`   HTTP long-polling: http://${HOST}:${PORT}/poll/*`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("Shutting down signaling server...");
  // Clean up all polling sessions
  for (const [sessionId] of pollingSessions) {
  cleanupPollingSession(sessionId);
  }
  wss.close(() => server.close(() => process.exit(0)));
});
