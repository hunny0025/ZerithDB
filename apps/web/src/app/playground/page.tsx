"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  Laptop,
  Save,
  Database,
  ArrowRightLeft,
  Copy,
  Check,
} from "lucide-react";

type ClientId = "A" | "B";

type Note = {
  id: string;
  text: string;
  senderId: ClientId;
  timestamp: number;
};

type Toast = {
  id: string;
  message: string;
  type: "success" | "error";
};

type Client = {
  id: ClientId;
  name: string;
  color: string;
  notes: Note[];
  input: string;
  identity: string;
};

const dummyMessage: Note = {
  id: "1",
  text: "Hello from Client A!",
  senderId: "A",
  timestamp: Date.now(),
};

const CLIENTS_CONFIG: Omit<Client, "notes" | "input" | "identity">[] = [
  { id: "A", name: "Alice", color: "blue" },
  { id: "B", name: "Bob", color: "purple" },
];

const INSTRUCTIONS = [
  "Type a message in Browser A and click Save. See it instantly sync to Browser B.",
  {
    text: "Click the Network: Online button to simulate going offline.",
    highlight: "Network: Online",
    highlightColor: "red",
  },
  "Create different notes in Browser A and Browser B. Notice they don't sync.",
  {
    text: "Click Network: Offline to reconnect. Watch the CRDT engine automatically merge the states perfectly!",
    highlight: "Network: Offline",
    highlightColor: "green",
  },
];

// Helper to generate mock Ed25519 did:key identifiers
async function generateMockDID(): Promise<string> {
  const mockPublicKey = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0")
  ).join("");
  return `did:key:z${mockPublicKey}`;
}

// Separate component for better scalability and cleaner code
function ClientCard({
  client,
  isLoading,
  onAddNote,
  onUpdateInput,
  onCopyIdentity,
}: {
  client: Client;
  isLoading: boolean;
  onAddNote: (id: ClientId, text: string) => void;
  onUpdateInput: (id: ClientId, value: string) => void;
  onCopyIdentity: (text: string) => void;
}) {
  const isBlue = client.color === "blue";
  const textColor = isBlue ? "text-blue-400" : "text-purple-400";
  const bgColor = isBlue ? "bg-blue-50" : "bg-purple-50";
  const borderColor = isBlue ? "border-blue-100" : "border-purple-100";
  const identityBorder = isBlue ? "border-blue-200" : "border-purple-200";
  const identityText = isBlue ? "text-blue-700" : "text-purple-700";
  const identityIcon = isBlue
    ? "text-blue-500 hover:text-blue-700 hover:bg-blue-100"
    : "text-purple-500 hover:text-purple-700 hover:bg-purple-100";
  const focusRingColor = isBlue
    ? "focus:ring-blue-500/20 focus:border-blue-500"
    : "focus:ring-purple-500/20 focus:border-purple-500";

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-[600px]">
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2 text-white">
          <Laptop className={`w-4 h-4 ${textColor}`} />
          <span className="text-sm font-semibold tracking-wide">
            Browser {client.id} ({client.name})
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
          <Database className="w-3.5 h-3.5" /> IndexedDB Active
        </div>
      </div>

      {/* Identity Display */}
      <div className={`${bgColor} px-4 py-3 border-b ${borderColor}`}>
        <div
          className={`text-xs font-semibold ${isBlue ? "text-blue-900" : "text-purple-900"} mb-2 uppercase tracking-wide`}
        >
          Identity (Ed25519 Mock)
        </div>
        <div
          className={`flex items-center gap-2 bg-white rounded-lg px-3 py-2 border ${identityBorder}`}
        >
          <code className={`text-xs ${identityText} font-mono flex-1 truncate`}>
            {client.identity || "(generating...)"}
          </code>
          <button
            onClick={() => onCopyIdentity(client.identity)}
            disabled={!client.identity}
            className={`ml-2 p-1.5 ${identityIcon} disabled:text-gray-400 disabled:hover:bg-transparent rounded transition-colors flex-shrink-0`}
            title={client.identity ? "Copy public key" : "Loading..."}
            aria-label={`Copy Browser ${client.id} public key`}
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : client.notes.length === 0 ? (
          <div className="text-center text-gray-400 mt-20 text-sm">
            No documents. Type below to create one.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {client.notes.map((note) => (
              <div
                key={note.id}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <p className="text-gray-800 wrap-break-word whitespace-pre-wrap">{note.text}</p>
                <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider font-mono">
                  ID: {note.id} • {new Date(note.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAddNote(client.id, client.input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={client.input}
            onChange={(e) => onUpdateInput(client.id, e.target.value)}
            placeholder="Type a message offline/online..."
            className={`flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${focusRingColor}`}
          />
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncCount, setSyncCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  // Initialize clients
  const [clients, setClients] = useState<Client[]>(() =>
    CLIENTS_CONFIG.map((client) => ({
      ...client,
      notes: [dummyMessage],
      input: "",
      identity: "",
    }))
  );

  // Simulate DB initialization and generate identities
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsPeerConnected(true);
    }, 1500);

    (async () => {
      const newClients = await Promise.all(
        clients.map(async (c) => ({
          ...c,
          identity: await generateMockDID(),
        }))
      );
      setClients(newClients);
    })();

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOnline) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- simulate peer disconnect immediately
      setIsPeerConnected(false);
      return;
    }

    setIsPeerConnected(false);
    const timer = setTimeout(() => setIsPeerConnected(true), 1000);
    return () => clearTimeout(timer);
  }, [isOnline]);

  const peerStatus = !isOnline
    ? "offline"
    : isLoading || !isPeerConnected
      ? "connecting"
      : "connected";

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = toastTimeouts.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);

    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimeouts.current.delete(timeout);
    }, 2000);

    toastTimeouts.current.add(timeout);
  };

  const copyToClipboard = async (text: string) => {
    if (!text.trim()) {
      showToast("Failed to copy", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard!", "success");
    } catch {
      showToast("Failed to copy", "error");
    }
  };

  // Sync logic simulation
  useEffect(() => {
    if (!isOnline) return;

    // Merge all notes from all clients
    const allNotes = clients.flatMap((c) => c.notes);
    const merged = allNotes.reduce((acc, curr) => {
      const existing = acc.find((n) => n.id === curr.id);
      if (!existing) {
        acc.push(curr);
      } else if (curr.timestamp > existing.timestamp) {
        existing.text = curr.text;
        existing.timestamp = curr.timestamp;
        existing.senderId = curr.senderId;
      }
      return acc;
    }, [] as Note[]);

    // Update all clients with merged data if changed
    let hasChanges = false;
    const newClients = clients.map((client) => {
      if (JSON.stringify(client.notes) !== JSON.stringify(merged)) {
        hasChanges = true;
        return { ...client, notes: merged };
      }
      return client;
    });

    if (hasChanges) {
      setClients(newClients); // eslint-disable-line react-hooks/set-state-in-effect
      setSyncCount((prev) => prev + 1);
    }
  }, [clients, isOnline]);

  const addNote = (clientId: ClientId, text: string) => {
    if (!text.trim()) return;
    const newNote: Note = {
      id: Math.random().toString(36).substring(7),
      text,
      timestamp: Date.now(),
      senderId: clientId,
    };

    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? { ...client, notes: [...client.notes, newNote], input: "" }
          : client
      )
    );
  };

  const updateInput = (clientId: ClientId, value: string) => {
    setClients((prev) =>
      prev.map((client) => (client.id === clientId ? { ...client, input: value } : client))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-gray-500 hover:text-black transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/logo.svg" alt="ZerithDB Logo" className="w-full h-full" />
            </div>
            <span className="font-semibold text-gray-900 text-lg tracking-tight">
              Interactive Playground
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            CRDT Sync Operations: {syncCount}
          </div>

          <div
            className={`hidden md:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full ${
              peerStatus === "connected"
                ? "bg-green-50 text-green-700"
                : peerStatus === "connecting"
                  ? "bg-yellow-50 text-yellow-700"
                  : "bg-gray-100 text-gray-500"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                peerStatus === "connected"
                  ? "bg-green-500"
                  : peerStatus === "connecting"
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-gray-400"
              }`}
            />
            {peerStatus === "connected"
              ? "Peers Connected"
              : peerStatus === "connecting"
                ? "Connecting to Peers..."
                : "Peers Offline"}
          </div>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm border ${
              isOnline
                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            }`}
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {isOnline ? "Network: Online (P2P)" : "Network: Offline"}
          </button>
        </div>
      </header>

      {/* MAIN PLAYGROUND */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid md:grid-cols-2 gap-8 items-start mt-8">
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            isLoading={isLoading}
            onAddNote={addNote}
            onUpdateInput={updateInput}
            onCopyIdentity={copyToClipboard}
          />
        ))}
      </main>

      {/* INFO FOOTER */}
      <div className="max-w-3xl mx-auto text-center pb-12 px-6">
        <h3 className="font-semibold text-gray-900 mb-2">How to test the Playground:</h3>
        <ul className="text-sm text-gray-500 flex flex-col gap-2">
          {INSTRUCTIONS.map((instruction, index) => (
            <li key={index}>
              {index + 1}.{" "}
              {typeof instruction === "string" ? (
                instruction
              ) : (
                <>
                  Click the{" "}
                  <strong className={`text-${instruction.highlightColor}-600`}>
                    {instruction.highlight}
                  </strong>{" "}
                  {instruction.text.replace(instruction.highlight, "").trim()}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Toast Notifications */}
      <div
        className="fixed bottom-6 right-6 flex flex-col gap-2 pointer-events-none"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto ${
              toast.type === "success"
                ? "bg-black text-white"
                : "bg-red-100 text-red-900 border border-red-200"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <span className="text-lg">✕</span>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
