"use client";

import React from "react";
import Editor, { loader } from "@monaco-editor/react";

// Configure Monaco before it mounts
if (typeof window !== "undefined") {
  loader.init().then((monaco) => {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      lib: ["esnext", "dom"],
      alwaysStrict: true,
      allowJs: true,
      esModuleInterop: true,
      moduleDetection: 3, // Force module detection
    });
  });
}

interface EditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
}

const CodeEditor: React.FC<EditorProps> = ({ code, onChange }) => {
  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-gray-200 bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        path="main.js"
        value={code}
        onChange={onChange}
        onMount={(editor, monaco) => {
          // Configure JS to be treated as a module
          monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ESNext,
            module: monaco.languages.typescript.ModuleKind.ESNext,
            allowNonTsExtensions: true,
            checkJs: true,
            allowJs: true,
          });

          // Add ZerithDB types to JS environment too
          monaco.languages.typescript.javascriptDefaults.addExtraLib(
            `
            declare interface ZerithDBApp {
              db(collection: string): {
                insert(data: any | any[]): Promise<string | string[]>;
                find(filter?: any): Promise<any[]>;
                findOne(filter: any): Promise<any | null>;
                update(filter: any, update: any): Promise<void>;
                remove(filter: any): Promise<void>;
              };
              sync: {
                enable(): void;
                disable(): void;
                status(): string;
                on(event: string, cb: Function): void;
              };
              auth: {
                getIdentity(): { publicKey: string };
                signIn(): Promise<void>;
                signOut(): Promise<void>;
              };
              network: {
                getPeers(): any[];
                isConnected(): boolean;
              };
              dispose(): Promise<void>;
            }
            declare function createApp(config: { 
              appId: string;
              sync?: { signalingUrl?: string; maxPeers?: number };
              auth?: { storageKey?: string };
              network?: { autoReconnect?: boolean; reconnectDelay?: number };
            }): ZerithDBApp;
          `,
            "zerithdb.d.ts"
          );
        }}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          quickSuggestions: true,
          codeLens: true,
          suggestOnTriggerCharacters: true,
          parameterHints: { enabled: true },
        }}
      />
    </div>
  );
};

export default CodeEditor;
