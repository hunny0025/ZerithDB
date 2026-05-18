import React from "react";
import ReactDOM from "react-dom/client";
import { db } from "./db";
import { ensureIdentity } from "./auth";
import { App } from "./App";
import "./index.css";

async function bootstrap() {
  // Load or generate the Ed25519 keypair before any render.
  await ensureIdentity();

  // Enable P2P sync — connects to peers when online, queues offline writes.
  // All reads/writes work regardless; this just activates the sync layer.
  try {
    db.sync.enable();
  } catch {
    // sync not available in this build — local-only mode
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
