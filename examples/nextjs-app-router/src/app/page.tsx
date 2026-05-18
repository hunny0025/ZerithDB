"use client";

import { useEffect, useState } from "react";
import { getZerithApp } from "@/lib/zerith";
import type { Document } from "zerithdb-sdk";
import {
  Plus,
  Trash2,
  Cloud,
  CloudOff,
  Loader2,
} from "lucide-react";

interface Todo {
  text: string;
  completed: boolean;
}

export default function Home() {
  const [todos, setTodos] = useState<Document<Todo>[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSynced, setIsSynced] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const app = getZerithApp();
    const todoCollection = app.db<Todo>("todos");

    // Initial load
    const loadTodos = async () => {
      try {
        const results = await todoCollection.find({});
        setTodos(results);
      } finally {
        setIsLoading(false);
      }
    };

    loadTodos();

    // Subscribe to sync events
    const handleSyncChange = (state: { synced: boolean }) => {
      setIsSynced(state.synced);
    };

    // Poll for updates
    const interval = setInterval(loadTodos, 1000);

    app.sync.on("state:change", handleSyncChange);
    setIsSynced(app.sync.state.synced);

    return () => {
      clearInterval(interval);
      app.sync.off("state:change", handleSyncChange);
    };
  }, []);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputText.trim()) return;

    const app = getZerithApp();

    await app.db<Todo>("todos").insert({
      text: inputText,
      completed: false,
    });

    setInputText("");

    // Immediate local update for better UX
    const results = await app.db<Todo>("todos").find({});
    setTodos(results);
  };

  const deleteTodo = async (id: string) => {
    const app = getZerithApp();

    await app.db<Todo>("todos").delete({ _id: id } as any);

    const results = await app.db<Todo>("todos").find({});
    setTodos(results);
  };

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white transition-colors duration-300">
          ZerithDB + Next.js
        </h1>

        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors duration-300 ${
            isSynced
              ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300"
              : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300"
          }`}
        >
          {isSynced ? <Cloud size={16} /> : <CloudOff size={16} />}
          {isSynced ? "Live P2P Sync" : "Local Only"}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={addTodo} className="flex gap-2 mb-8">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors duration-300"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2"
        >
          <Plus size={20} />
          Add
        </button>
      </form>

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2
            className="animate-spin text-gray-400 dark:text-gray-500 transition-colors duration-300"
            size={32}
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {todos.length === 0 ? (
            <li className="text-center p-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl transition-colors duration-300">
              No todos yet. Add one above!
            </li>
          ) : (
            todos.map((todo) => (
              <li
                key={todo._id}
                className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-sm group hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300"
              >
                <span className="text-lg text-gray-900 dark:text-white transition-colors duration-300">
                  {todo.text}
                </span>

                <button
                  onClick={() => deleteTodo(String(todo._id))}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-zinc-700 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
        <p>
          This app uses <strong>ZerithDB</strong> for local-first persistence
          and P2P synchronization. Open this page in two different browsers to
          see sync in action!
        </p>
      </footer>
    </main>
  );
}