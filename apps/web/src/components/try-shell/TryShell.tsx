"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { EXAMPLES } from "./examples";
import { Code2, Sparkles, ChevronRight } from "lucide-react";

// Lazy load the editor to keep initial bundle size small
const CodeEditor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-gray-900 rounded-lg animate-pulse flex items-center justify-center">
      <span className="text-gray-500 font-mono">Loading Editor...</span>
    </div>
  ),
});

const Preview = dynamic(() => import("./Preview"), {
  ssr: false,
});

export const TryShell: React.FC = () => {
  const [activeExample, setActiveExample] = useState(EXAMPLES[0]);
  const [code, setCode] = useState(EXAMPLES[0].code);

  const handleExampleChange = (example: (typeof EXAMPLES)[0]) => {
    setActiveExample(example);
    setCode(example.code);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
            <Sparkles className="w-3 h-3" />
            Interactive Playground
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Try ZerithDB in <span className="text-blue-600">seconds.</span>
          </h2>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl">
            Run real queries directly in your browser. No installation, no backend, no configuration
            required.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => handleExampleChange(ex)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                activeExample.id === ex.id
                  ? "bg-black text-white border-black shadow-lg shadow-black/10"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              aria-label={`Switch to ${ex.title} example`}
              aria-pressed={activeExample.id === ex.id}
            >
              {ex.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-stretch">
        {/* Editor Pane */}
        <div className="lg:col-span-3 flex flex-col min-h-[450px]">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-t-xl border-b border-gray-800">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="ml-4 flex items-center gap-2 text-gray-400 text-xs font-mono">
              <Code2 className="w-3.5 h-3.5" />
              main.ts
            </div>
          </div>
          <div className="flex-1">
            <CodeEditor code={code} onChange={(val) => setCode(val || "")} />
          </div>
        </div>

        {/* Preview Pane */}
        <div className="lg:col-span-2">
          <Preview code={code} onReset={() => setCode(activeExample.code)} />

          <div className="mt-6 p-6 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Sparkles className="w-24 h-24 rotate-12" />
            </div>
            <h4 className="font-bold text-lg mb-2">Ready to build for real?</h4>
            <p className="text-blue-100 text-sm mb-4 leading-relaxed">
              Install the SDK and get your local-first app running in less than 5 minutes.
            </p>
            <a
              href="/docs"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors"
            >
              Get Started <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
