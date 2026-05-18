"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowRightLeft,
  Database,
  Laptop,
  Play,
  Terminal,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { usePlaygroundSync } from "@/hooks/usePlaygroundSync";
import { MergeReviewCard } from "@/components/MergeReviewCard";
import {
  DEFAULT_PLAYGROUND_QUERY,
  mergePlaygroundNotes,
  runPlaygroundQuery,
  type PlaygroundNote,
} from "@/lib/playground-queries";

function ClientPanel({
  title,
  notes,
  isLoading,
  highlight,
}: {
  title: string;
  notes: PlaygroundNote[];
  isLoading: boolean;
  highlight?: boolean;
}) {
  return (
    <motion.div
      animate={highlight ? { scale: [1, 1.01, 1] } : { scale: 1 }}
      transition={{ duration: 0.35 }}
      className={`rounded-2xl border overflow-hidden flex flex-col h-[280px] bg-card shadow-lg ${
        highlight ? "border-blue-300 ring-2 ring-blue-100 dark:ring-blue-900" : "border-border"
      }`}
    >
      <motion.div className="bg-gray-900 px-4 py-2.5 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2 text-white text-sm font-semibold">
          <Laptop className="w-4 h-4" />
          {title}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono uppercase tracking-wide">
          <Database className="w-3 h-3" />
          IndexedDB
        </div>
      </motion.div>
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-zinc-900 space-y-2 theme-transition">
        {isLoading ? (
          [1, 2].map((item) => (
            <div
              key={item}
              className="bg-white dark:bg-zinc-800 p-3 rounded-lg border border-gray-100 dark:border-zinc-700 animate-pulse theme-transition"
            >
              <motion.div className="h-3 bg-gray-200 dark:bg-zinc-600 rounded w-4/5 mb-2 theme-transition" />
              <div className="h-2 bg-gray-100 dark:bg-zinc-700 rounded w-1/3 theme-transition" />
            </div>
          ))
        ) : notes.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-10 theme-transition">No documents yet.</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-white dark:bg-zinc-800 p-3 rounded-lg border border-gray-100 dark:border-zinc-700 shadow-sm text-sm theme-transition"
            >
              <p className="text-gray-800 dark:text-gray-100 theme-transition">{note.text}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-mono uppercase theme-transition">
                {note.id} • {new Date(note.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

export default function HomePlayground() {
  const [query, setQuery] = useState(DEFAULT_PLAYGROUND_QUERY);
  const [output, setOutput] = useState<string>(
    "Run a query to insert a document and watch it sync across peers."
  );
  const [syncPulse, setSyncPulse] = useState<"A" | "B" | null>(null);
  const {
    isOnline,
    setIsOnline,
    clientA,
    clientB,
    syncCount,
    isLoading,
    peerStatus,
    lastSyncedAt,
    mergeReview,
    approveMergeReview,
    dismissMergeReview,
    insertOnClientA,
  } = usePlaygroundSync();

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  const lineCount = useMemo(() => query.split("\n").length, [query]);

  const runQuery = () => {
    const mergedNotes = mergePlaygroundNotes(clientA, clientB);
    const result = runPlaygroundQuery(query, mergedNotes);

    if (!result.ok) {
      setOutput(`Error: ${result.error}`);
      return;
    }

    if (result.action === "find") {
      setOutput(
        result.notes.length
          ? `Found ${result.notes.length} document(s):\n${result.notes
              .map((note) => `• ${note.text}`)
              .join("\n")}`
          : "No documents matched your query."
      );
      return;
    }

    insertOnClientA(result.note);

    if (isOnline) {
      setSyncPulse("B");
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => setSyncPulse(null), 700);
      setOutput(
        `Inserted on Client A → AI merge review will appear if Client B diverges.\n• ${result.note.text}`
      );
    } else {
      setOutput(
        `Inserted on Client A while offline → queued for sync when connection is restored.\n• ${result.note.text}`
      );
    }
  };

  return (
    <section
      id="playground"
      className="py-24 px-6 bg-gradient-to-b from-blue-50/40 to-background dark:from-blue-950/20 border-y border-border"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 md:text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4 theme-transition">
            <Zap className="w-3.5 h-3.5" />
            Live on the homepage
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Interactive Playground
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Write ZerithDB-style queries in the editor, run them locally, and watch peer-to-peer
            sync merge state in real time—no backend required.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="bg-[#0D1117] rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-[#161B22] border-b border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
                <Terminal className="w-4 h-4 text-blue-400" />
                Query editor
              </div>
              <div className="flex gap-1.5">
                <motion.div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <motion.div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
            </div>

            <div className="relative flex-1 min-h-[220px]">
              <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#0D1117] border-r border-gray-800 text-[11px] text-gray-600 font-mono py-4 select-none text-right pr-2">
                {Array.from({ length: lineCount }, (_, index) => (
                  <div key={index}>{index + 1}</div>
                ))}
              </div>
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                spellCheck={false}
                aria-label="ZerithDB query editor"
                className="w-full h-full min-h-[220px] pl-12 pr-4 py-4 bg-transparent text-sm font-mono text-gray-200 leading-relaxed resize-none focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#161B22] border-t border-gray-800">
              <p className="text-xs text-gray-500">
                Try <code className="text-gray-400">insert</code> or{" "}
                <code className="text-gray-400">{"find()"}</code>
              </p>
              <button
                type="button"
                onClick={runQuery}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                Run query
              </button>
            </div>

            <pre className="px-4 py-3 text-xs font-mono text-green-400/90 bg-black/40 border-t border-gray-800 whitespace-pre-wrap min-h-[72px]">
              {output}
            </pre>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full ${
                  peerStatus === "connected"
                    ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300"
                    : peerStatus === "connecting"
                      ? "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300"
                      : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    peerStatus === "connected"
                      ? "bg-green-500"
                      : peerStatus === "connecting"
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-gray-400"
                  }`}
                />
                {peerStatus === "connected"
                  ? "Peers connected"
                  : peerStatus === "connecting"
                    ? "Connecting peers..."
                    : "Peers offline"}
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 px-3 py-1.5 rounded-full theme-transition">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Sync ops: {syncCount}
              </div>
              {lastSyncedAt && (
                <span className="text-xs text-gray-400">
                  Last sync {new Date(lastSyncedAt).toLocaleTimeString()}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsOnline(!isOnline)}
                className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isOnline
                    ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900"
                    : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900"
                }`}
              >
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {isOnline ? "P2P online" : "Offline mode"}
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <ClientPanel
                title="Client A (Alice)"
                notes={clientA}
                isLoading={isLoading}
                highlight={syncPulse === "A"}
              />
              <ClientPanel
                title="Client B (Bob)"
                notes={clientB}
                isLoading={isLoading}
                highlight={syncPulse === "B"}
              />
            </div>

            {mergeReview && (
              <MergeReviewCard
                review={mergeReview}
                onApprove={approveMergeReview}
                onDismiss={dismissMergeReview}
              />
            )}

            <p className="text-sm text-muted-foreground leading-relaxed">
              Edits on Client A propagate to Client B when the network is online. Toggle offline to
              queue changes, then reconnect to review and approve the AI-suggested merge.
            </p>

            <Link
              href="/playground"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 theme-transition"
            >
              Open full playground
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
