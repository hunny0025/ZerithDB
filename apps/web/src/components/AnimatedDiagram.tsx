"use client";

import { Database, Laptop, RefreshCcw } from "lucide-react";

export default function AnimatedDiagram() {
  return (
    <div className="w-full max-w-4xl mx-auto py-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 px-4 theme-transition">
      {/* Client 1 */}
      <div className="flex flex-col items-center z-10 w-48">
        <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-700 flex items-center justify-center relative mb-4 theme-transition">
          <Laptop className="w-10 h-10 text-gray-900 dark:text-white theme-transition" />

          <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-full flex items-center justify-center theme-transition">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-300 theme-transition" />
          </div>
        </div>

        <p className="font-semibold text-gray-900 dark:text-white theme-transition">
          Client A
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-400 theme-transition">
          IndexedDB
        </p>
      </div>

      {/* Network / CRDT Middle */}
      <div className="flex-1 flex flex-col items-center relative min-h-[160px] justify-center w-full">
        {/* Animated Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-zinc-700 -z-10 -translate-y-1/2 overflow-hidden theme-transition">
          <div
            className="h-full w-1/3 bg-blue-500 animate-[translate_2s_linear_infinite]"
            style={{ animationName: "slide" }}
          ></div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-full shadow-lg border border-gray-200 dark:border-zinc-700 z-10 flex flex-col items-center justify-center theme-transition">
          <RefreshCcw className="w-8 h-8 text-blue-600 dark:text-blue-300 mb-2 animate-[spin_4s_linear_infinite] theme-transition" />

          <span className="text-xs font-bold text-gray-900 dark:text-white px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded-md theme-transition">
            CRDT Merge
          </span>
        </div>

        <p className="text-sm font-medium text-blue-600 dark:text-blue-300 mt-4 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900 shadow-sm theme-transition">
          WebRTC Data Channel
        </p>

        {/* Animation styles */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `,
          }}
        />
      </div>

      {/* Client 2 */}
      <div className="flex flex-col items-center z-10 w-48">
        <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-700 flex items-center justify-center relative mb-4 theme-transition">
          <Laptop className="w-10 h-10 text-gray-900 dark:text-white theme-transition" />

          <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-full flex items-center justify-center theme-transition">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-300 theme-transition" />
          </div>
        </div>

        <p className="font-semibold text-gray-900 dark:text-white theme-transition">
          Client B
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-400 theme-transition">
          IndexedDB
        </p>
      </div>
    </div>
  );
}