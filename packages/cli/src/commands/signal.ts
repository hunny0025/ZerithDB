import chalk from "chalk";
import { execa } from "execa";

export async function signalCommand(options: { port: string }): Promise<void> {
  const port = parseInt(options.port, 10);

  console.log(chalk.cyan(`\n🔗 Starting ZerithDB signaling server on port ${port}...\n`));

  try {
    await execa(
      "node",
      [
        "--input-type=module",
        `--eval`,
        // Inline the minimal signaling server for dev usage
        `
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
const PORT = ${port};
const rooms = new Map();
const wss = new WebSocketServer({ port: PORT });
const maintenanceFile = path.join(process.cwd(), '.maintenance');
wss.on('connection', (ws, req) => {
  if (fs.existsSync(maintenanceFile)) {
    ws.close(1012, 'Maintenance mode');
    return;
  }
  const url = new URL(req.url, 'http://localhost');
  const roomId = url.searchParams.get('room');
  const peerId = url.searchParams.get('peer');
  if (!roomId || !peerId) { ws.close(1008); return; }
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  const room = rooms.get(roomId);
  const entry = { peerId, ws };
  room.add(entry);
  ws.send(JSON.stringify({ type: 'peer-list', from: 'server', payload: [...room].filter(p => p.peerId !== peerId).map(p => p.peerId) }));
  ws.on('message', data => {
    let msg; try { msg = JSON.parse(data.toString()); } catch { return; }
    msg.from = peerId;
    const s = JSON.stringify(msg);
    if (msg.to) { const t = [...room].find(p => p.peerId === msg.to); if (t?.ws.readyState === 1) t.ws.send(s); }
    else { for (const p of room) { if (p.peerId !== peerId && p.ws.readyState === 1) p.ws.send(s); } }
  });
  ws.on('close', () => { room.delete(entry); if (room.size === 0) rooms.delete(roomId); });
});
console.log('✅ Signaling server running at ws://localhost:${port}');
console.log('   Press Ctrl+C to stop.');
        `,
      ],
      { stdio: "inherit" }
    );
  } catch (err) {
    console.error(chalk.red("Failed to start signaling server:"), err);
    process.exit(1);
  }
}
