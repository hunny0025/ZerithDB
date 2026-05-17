"use client";

import React, { useEffect, useState, useRef } from "react";
import { Terminal, Play, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";

interface PreviewProps {
  code: string;
  onReset: () => void;
}

interface LogEntry {
  type: "log" | "error" | "warn" | "info";
  content: unknown[];
}

const Preview: React.FC<PreviewProps> = ({ code, onReset }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const executeCode = async () => {
    setLogs([]);
    setError(null);
    setIsRunning(true);

    // Mock Console
    const mockConsole = {
      log: (...args: unknown[]) => {
        setLogs((prev) => [...prev, { type: "log", content: args }]);
      },
      error: (...args: unknown[]) => {
        setLogs((prev) => [...prev, { type: "error", content: args }]);
      },
      warn: (...args: unknown[]) => {
        setLogs((prev) => [...prev, { type: "warn", content: args }]);
      },
      info: (...args: unknown[]) => {
        setLogs((prev) => [...prev, { type: "info", content: args }]);
      },
    };

    // Mock ZerithDB in-memory store
    const memoryDB: Record<string, Record<string, unknown>[]> = {};

    const mockSDK = {
      createApp: (config: Record<string, unknown>) => {
        const appId = (config?.appId as string) || "demo-app";
        
        return {
          appId,
          config,
          db: (collection: string) => ({
            insert: async (data: Record<string, unknown> | Record<string, unknown>[]) => {
              if (!memoryDB[collection]) memoryDB[collection] = [];
              const docs = Array.isArray(data) ? data : [data];
              const docsWithId = docs.map(d => ({ 
                ...d, 
                id: (d.id as string) || Math.random().toString(36).substring(2, 9),
                _created: Date.now()
              }));
              memoryDB[collection].push(...docsWithId);
              return Array.isArray(data) ? docsWithId.map(d => d.id as string) : docsWithId[0].id as string;
            },
            find: async (filter: Record<string, unknown> = {}) => {
              const docs = memoryDB[collection] || [];
              return docs.filter(doc => {
                for (const key in filter) {
                  const val = filter[key];
                  if (typeof val === 'object' && val !== null) {
                    const obj = val as Record<string, number>;
                    if (obj.$gt !== undefined && !((doc[key] as number) > obj.$gt)) return false;
                    if (obj.$lt !== undefined && !((doc[key] as number) < obj.$lt)) return false;
                    if (obj.$gte !== undefined && !((doc[key] as number) >= obj.$gte)) return false;
                    if (obj.$lte !== undefined && !((doc[key] as number) <= obj.$lte)) return false;
                  } else if (doc[key] !== val) {
                    return false;
                  }
                }
                return true;
              });
            },
            findOne: async (filter: Record<string, unknown>) => {
              const docs = memoryDB[collection] || [];
              return docs.find(doc => {
                for (const key in filter) {
                  if (doc[key] !== filter[key]) return false;
                }
                return true;
              }) || null;
            },
            update: async (filter: Record<string, unknown>, update: { $set?: Record<string, unknown> }) => {
              const docs = memoryDB[collection] || [];
              docs.forEach(doc => {
                let match = true;
                for (const key in filter) {
                  if (doc[key] !== filter[key]) match = false;
                }
                if (match && update.$set) {
                  Object.assign(doc, update.$set);
                }
              });
            },
            remove: async (filter: Record<string, unknown>) => {
              if (!memoryDB[collection]) return;
              memoryDB[collection] = memoryDB[collection].filter(doc => {
                let match = true;
                for (const key in filter) {
                  if (doc[key] !== filter[key]) match = false;
                }
                return !match;
              });
            }
          }),
          sync: {
            enable: () => mockConsole.log("Sync enabled for", appId),
            disable: () => mockConsole.log("Sync disabled for", appId),
            status: () => "connected",
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            on: (event: string, cb: (...args: unknown[]) => void) => 
              mockConsole.log("Attached listener for", event)
          },
          auth: {
            getIdentity: () => ({ 
              publicKey: "ed25519:mock_key_" + Math.random().toString(36).substring(2, 7) 
            }),
            signIn: async () => mockConsole.log("Signed in as anonymous user"),
            signOut: async () => mockConsole.log("Signed out")
          },
          network: {
            getPeers: () => [],
            isConnected: () => true
          },
          dispose: async () => mockConsole.log("App disposed")
        };
      },
    };

    try {
      // Improved execution: wrap in an async IIFE to allow top-level await
      // We pass the mock functions as local variables
      const functionBody = `
        const { createApp } = sdk;
        return (async () => {
          try {
            ${code}
          } catch (err) {
            console.error("Runtime Error:", err.message);
            throw err;
          }
        })();
      `;
      
      const run = new Function("sdk", "console", functionBody);
      await run(mockSDK, mockConsole);
    } catch (err) {
      const errorObj = err as Error;
      setError(errorObj.message);
      // Already logged to mock console if caught inside
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Output</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-500"
            title="Reset Example"
            aria-label="Reset example code"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={executeCode}
            disabled={isRunning}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm"
            aria-label="Run code"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 font-mono text-sm overflow-y-auto bg-gray-900 text-gray-300">
        {logs.length === 0 && !error && (
          <div className="text-gray-500 italic">Click &quot;Run&quot; to see the output...</div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="mb-2 last:mb-0 animate-in fade-in slide-in-from-left-1 duration-200">
            <span className="text-gray-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
            {log.type === "error" ? (
              <span className="text-red-400">✖ {log.content.map(c => 
                typeof c === 'object' ? JSON.stringify(c, null, 2) : String(c)
              ).join(' ')}</span>
            ) : log.type === "warn" ? (
              <span className="text-yellow-400">⚠ {log.content.map(c => 
                typeof c === 'object' ? JSON.stringify(c, null, 2) : String(c)
              ).join(' ')}</span>
            ) : log.type === "info" ? (
              <span className="text-blue-400">ℹ {log.content.map(c => 
                typeof c === 'object' ? JSON.stringify(c, null, 2) : String(c)
              ).join(' ')}</span>
            ) : (
              <span className="text-green-400">› {log.content.map(c => 
                typeof c === 'object' ? JSON.stringify(c, null, 2) : String(c)
              ).join(' ')}</span>
            )}
          </div>
        ))}
        {error && (
          <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-start gap-2 animate-in zoom-in-95 duration-200">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div ref={logEndRef} />
      </div>

      {logs.length > 0 && !error && (
        <div className="px-4 py-2 bg-green-50 border-t border-green-100 flex items-center gap-2 text-green-700 text-xs font-medium animate-in slide-in-from-bottom-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Execution completed successfully
        </div>
      )}
    </div>
  );
};

export default Preview;
