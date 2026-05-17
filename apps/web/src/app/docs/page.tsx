"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Terminal,
  Search,
  Book,
  Code,
  Server,
  Database,
  Globe,
  Zap,
  FileText,
} from "lucide-react";

type Framework = {
  id: string;
  name: string;
  language: string;
  install: string;
  steps: { title: string; code: string; description: string }[];
};

const FRAMEWORKS: Framework[] = [
  {
    id: "react",
    name: "React / Next.js",
    language: "tsx",
    install: "npm install zerithdb-sdk zerithdb-react",
    steps: [
      {
        title: "1. Wrap your app with the Provider",
        description: "Initialize the CRDT engine and WebRTC pool at the root of your application.",
        code: "import { ZerithProvider } from 'zerithdb-react';\n\nexport default function App({ children }) {\n  return (\n    <ZerithProvider config={{ appId: 'my-app', sync: true }}>\n      {children}\n    </ZerithProvider>\n  );\n}",
      },
      {
        title: "2. Read and Write Data",
        description:
          "Use our custom hooks to interact with local-first collections. Data instantly syncs across peers.",
        code: "import { useQuery } from 'zerithdb-react';\n\nfunction TodoList() {\n  // Subscribes to IndexedDB & WebRTC changes automatically\n  const { data: todos, insert } = useQuery('todos');\n\n  return (\n    <div>\n      {todos.map(todo => <p key={todo.id}>{todo.text}</p>)}\n      <button onClick={() => insert({ text: 'New Todo' })}>\n        Add Todo\n      </button>\n    </div>\n  );\n}",
      },
    ],
  },
  {
    id: "vanilla",
    name: "Vanilla JavaScript",
    language: "javascript",
    install: "npm install zerithdb-sdk",
    steps: [
      {
        title: "1. Initialize the Client",
        description: "Create a local-first database instance. Storage defaults to IndexedDB.",
        code: "import { createClient } from 'zerithdb-sdk';\n\nconst db = createClient({\n  appId: 'my-app',\n  storage: 'indexeddb',\n  p2p: true \n});",
      },
      {
        title: "2. Subscribe to Changes",
        description: "Listen for CRDT merges from other peers in real-time.",
        code: "db.collection('messages').subscribe((messages) => {\n  document.getElementById('msg-list').innerHTML = messages\n    .map(m => '<li>' + m.text + '</li>')\n    .join('');\n});",
      },
      {
        title: "3. Mutate Data",
        description:
          "Writes are synchronous locally (0ms) and broadcasted to peers asynchronously.",
        code: "async function sendMessage(text) {\n  await db.collection('messages').insert({\n    text,\n    timestamp: Date.now()\n  });\n}",
      },
    ],
  },
  {
    id: "python",
    name: "Python (Backend/CLI)",
    language: "python",
    install: "pip install zerithdb",
    steps: [
      {
        title: "1. Connect Python Client",
        description:
          "Instantiate the backend client to act as an authoritative peer or to ingest webhooks.",
        code: "from zerithdb import Client\n\n# Initialize the Python client\ndb = Client(app_id='my-app')",
      },
      {
        title: "2. Sync Server Events",
        description:
          "Insert events locally; the ZerithDB engine will relay them to all connected browser peers.",
        code: "def sync_event(event_data):\n    # Inserts into local storage & syncs via network\n    db.collection('events').insert(event_data)\n    print(f'Event synced: {event_data}')\n\nsync_event({\n    'type': 'server_restart',\n    'timestamp': 1690000000\n})",
      },
    ],
  },
];

const SIDEBAR_LINKS = [
  {
    category: "Getting Started",
    icon: Book,
    items: ["Introduction", "Quickstart", "Installation"],
  },
  {
    category: "Core Concepts",
    icon: Database,
    items: [
      "CRDT Synchronization",
      "Peer-to-Peer Networks",
      "Offline-First Storage",
      "Conflict Resolution",
    ],
  },
  {
    category: "API Reference",
    icon: Code,
    items: ["Client Configuration", "Collections", "Queries", "Auth & Permissions"],
  },
  {
    category: "Platform",
    icon: Server,
    items: ["Signaling Servers", "TURN / STUN Relays", "Troubleshooting", "Pricing", "Enterprise"],
  },
];

const DOC_CONTENT: Record<string, React.ReactNode> = {
  Introduction: (
    <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
      <p>
        ZerithDB is a revolutionary local-first, peer-to-peer database built for the modern web. It
        allows developers to build responsive, offline-capable applications without the latency and
        complexity of traditional cloud databases.
      </p>
      <h3 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Why Local-First?</h3>
      <p>
        Traditional web applications rely on a central server for every read and write operation.
        This means your app is only as fast as the network connection. Local-first applications
        reverse this paradigm: data is written to and read from a local database immediately, and
        then synced asynchronously in the background.
      </p>
      <h3 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Core Benefits</h3>
      <ul className="list-disc pl-6 space-y-3">
        <li>
          <strong>Zero Latency:</strong> Operations happen locally at the speed of the device.
        </li>
        <li>
          <strong>Offline Support:</strong> Apps work flawlessly without internet access.
        </li>
        <li>
          <strong>Real-time Multiplayer:</strong> Changes merge automatically using CRDTs.
        </li>
        <li>
          <strong>Reduced Server Costs:</strong> P2P syncing offloads bandwidth from your servers.
        </li>
      </ul>
    </div>
  ),
  Installation: (
    <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
      <p>
        ZerithDB is available as a set of NPM packages. Depending on your stack, you can install the
        core SDK or framework-specific wrappers.
      </p>
      <h3 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Core JavaScript SDK</h3>
      <div className="bg-gray-900 p-4 rounded-lg text-gray-300 font-mono text-sm border border-gray-800">
        npm install zerithdb-sdk
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mt-12 mb-4">React & Next.js</h3>
      <div className="bg-gray-900 p-4 rounded-lg text-gray-300 font-mono text-sm border border-gray-800">
        npm install zerithdb-react
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Python Backend</h3>
      <div className="bg-gray-900 p-4 rounded-lg text-gray-300 font-mono text-sm border border-gray-800">
        pip install zerithdb
      </div>
    </div>
  ),
  "CRDT Synchronization": (
    <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
      <p>
        At the heart of ZerithDB is a Conflict-free Replicated Data Type (CRDT) engine. CRDTs are
        data structures that can be replicated across multiple computers in a network, updated
        independently, and mathematically guaranteed to converge to the same state.
      </p>
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 mt-8">
        <strong>How it works:</strong> Instead of storing absolute values (e.g., &quot;count is
        5&quot;), ZerithDB stores causal operations (e.g., &quot;add 1 to count&quot;). By securely
        distributing these operations using vector clocks, all peers arrive at the same outcome
        without central locking.
      </div>
      <p className="mt-8">
        We use an optimized implementation of Yjs/Automerge-like algorithms customized for fast
        IndexedDB querying.
      </p>
    </div>
  ),
  "Peer-to-Peer Networks": (
    <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
      <p>
        To eliminate server bottlenecks, ZerithDB relies heavily on WebRTC data channels for
        real-time synchronization between clients.
      </p>
      <ul className="list-disc pl-6 space-y-3 mt-6">
        <li>
          <strong>Signaling:</strong> A lightweight WebSocket server is used only to exchange IP
          addresses.
        </li>
        <li>
          <strong>Direct Connection:</strong> Once connected, browsers exchange CRDT operations
          directly with zero server middleman.
        </li>
        <li>
          <strong>Mesh Topology:</strong> Clients form a resilient mesh network to distribute data
          even if some nodes go offline.
        </li>
      </ul>
    </div>
  ),
  "Offline-First Storage": (
    <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
      <p>
        All writes in ZerithDB are synchronously written to a local database before any network
        request is made. On the web, we use <code>IndexedDB</code>.
      </p>
      <p>
        If the user loses internet connection, they can continue interacting with the app. Once the
        connection is restored, the sync engine automatically flushes the queue of pending
        operations to the P2P network.
      </p>
    </div>
  ),
  Troubleshooting: (
    <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
      <p>
        Because ZerithDB is a local-first application platform operating entirely in the browser, it
        avoids traditional centralized server bottlenecks by forming a resilient, encrypted mesh
        network among peers. This decentralized synchronization relies heavily on browser-level
        WebRTC connections orchestrated initially via a minimal signaling server.
      </p>
      <p>
        However, real-world network configurations (firewalls, asymmetric NATs, and strict browser
        sandboxing) can occasionally prevent peers from handshaking or maintaining active data
        streams. Use this guide to diagnose and resolve common connectivity issues.
      </p>

      <h3
        id="webrtc-nat-issue"
        className="text-2xl font-bold text-gray-900 mt-12 mb-4 scroll-mt-20"
      >
        1. Initial Connection Fails Between Peers on Different Networks
      </h3>
      <ul className="list-disc pl-6 space-y-3">
        <li>
          <strong>Symptom:</strong> Peers on the same Wi-Fi network sync instantly, but a peer on a
          home network cannot connect to a peer on a corporate network or cellular data.
        </li>
        <li>
          <strong>Cause:</strong> This is typically caused by a NAT (Network Address Translation) or
          firewall restriction blocking direct P2P socket discovery. While simple STUN mapping
          handles basic routers, strict enterprise or symmetric NATs hide the internal IP/Port
          mapping dynamically, preventing direct connections via standard ICE candidates.
        </li>
        <li>
          <strong>Solution:</strong> You need a TURN (Traversal Using Relays around NAT) server to
          safely fallback and relay encrypted traffic between strict networks. Configure your
          initialization to supply custom ICE servers:
        </li>
      </ul>

      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm group mt-6">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
            <span className="ml-2 font-medium">app.config.ts</span>
          </div>
        </div>
        <div className="p-6 bg-gray-900 overflow-x-auto">
          <pre className="text-[13px] font-mono text-gray-300 leading-relaxed">
            <code>
              {`import { createApp } from "zerithdb-sdk";

const app = createApp({
  appId: "my-secure-app",
  sync: {
    signalingUrl: "wss://signal.zerithdb.dev",
    // Supply explicit TURN/STUN configuration for restrictive firewalls
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: "turn:your-custom-turn-server.com:3478",
        username: "zerith_user",
        credential: "secure_password_here"
      }
    ]
  }
});`}
            </code>
          </pre>
        </div>
      </div>

      <h3
        id="connection-drops"
        className="text-2xl font-bold text-gray-900 mt-12 mb-4 scroll-mt-20"
      >
        2. Connection Drops After Inactivity
      </h3>
      <p>
        Some aggressive NAT routers close UDP mappings if no data is exchanged for a short period
        (usually 30-60 seconds). ZerithDB automatically sends keep-alive heartbeats, but you can
        adjust the interval if you notice frequent reconnections on specific networks.
      </p>
    </div>
  ),
};

export default function DocsPage() {
  const [activeId, setActiveId] = useState("react");
  const [activeSection, setActiveSection] = useState("Quickstart");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedInstall, setCopiedInstall] = useState(false);

  const activeFramework = FRAMEWORKS.find((f) => f.id === activeId) || FRAMEWORKS[0];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyInstall = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  // Render specific content if available, otherwise generic text
  const renderContent = () => {
    if (activeSection === "Quickstart") {
      return (
        <>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed max-w-3xl">
            Get up and running with ZerithDB in less than 2 minutes. Choose your preferred framework
            below to see the boilerplate code required to initialize your local-first database.
          </p>

          <div className="flex flex-wrap gap-2 mb-10 border-b border-gray-200 pb-px">
            {FRAMEWORKS.map((fw) => (
              <button
                key={fw.id}
                onClick={() => setActiveId(fw.id)}
                className={
                  "px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px " +
                  (activeId === fw.id
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300")
                }
              >
                {fw.name}
              </button>
            ))}
          </div>

          <div className="mb-12">
            <h2
              id="install-the-sdk"
              className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 scroll-mt-20"
            >
              <Terminal className="w-5 h-5 text-gray-400" />
              Install the SDK
            </h2>
            <div className="flex items-center justify-between bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-800">
              <code className="text-sm font-mono text-gray-300">{activeFramework.install}</code>
              <button
                onClick={() => handleCopyInstall(activeFramework.install)}
                className="p-2 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-white"
                title="Copy command"
              >
                {copiedInstall ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-12">
            {activeFramework.steps.map((step, idx) => (
              <div key={idx} className="relative">
                <h3
                  id={slugify(step.title)}
                  className="text-lg font-bold text-gray-900 mb-2 scroll-mt-20"
                >
                  {step.title}
                </h3>
                <p className="text-gray-600 mb-4">{step.description}</p>

                <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm group">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                      <span className="ml-2 font-medium">example.{activeFramework.language}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(step.code, idx)}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-black transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copiedIndex === idx ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="p-6 bg-gray-900 overflow-x-auto">
                    <pre className="text-[13px] font-mono text-gray-300 leading-relaxed">
                      <code>{step.code}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            id="next-steps"
            className="mt-16 p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden scroll-mt-20"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Zap className="w-32 h-32" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">You&apos;re ready to build!</h3>
            <p className="text-gray-600 mb-6 max-w-xl">
              You&apos;ve successfully set up the foundation for a zero-backend application. Explore
              the advanced topics to unlock the full power of ZerithDB.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link
                href="/playground"
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Interactive Playground</div>
                  <div className="text-xs text-gray-500">Test offline/online sync locally</div>
                </div>
              </Link>
              <button
                onClick={() => setActiveSection("CRDT Synchronization")}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all group text-left"
              >
                <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Architecture Deep Dive</div>
                  <div className="text-xs text-gray-500">Learn how P2P CRDTs work</div>
                </div>
              </button>
            </div>
          </div>
        </>
      );
    }

    if (DOC_CONTENT[activeSection]) {
      return DOC_CONTENT[activeSection];
    }

    // Generic fallback for missing sections
    return (
      <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
        <p>
          Welcome to the <strong>{activeSection}</strong> documentation. ZerithDB is designed to
          handle this seamlessly, ensuring your applications remain fast, reliable, and real-time
          across the globe.
        </p>
        <p>
          In traditional architecture, handling {activeSection.toLowerCase()} requires immense
          overhead, central database locking, and complex state reconciliation. ZerithDB bypasses
          all of this by utilizing advanced local-first patterns.
        </p>
        <h3 className="text-2xl font-bold text-gray-900 mt-12 mb-4">Key Mechanisms</h3>
        <ul className="list-disc pl-6 space-y-3">
          <li>
            <strong>Optimistic Updates:</strong> The UI updates instantly without waiting for
            network verification.
          </li>
          <li>
            <strong>Background Sync:</strong> Data associated with {activeSection.toLowerCase()}{" "}
            synchronizes transparently when the network is available.
          </li>
          <li>
            <strong>Peer Discovery:</strong> WebRTC channels automatically negotiate direct
            connections to resolve state.
          </li>
        </ul>
        <div className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-2">Note on Implementation</h4>
          <p className="text-sm text-gray-500">
            The specific API surface for {activeSection.toLowerCase()} is currently being
            standardized in the upcoming v1.0 release. Check back soon for detailed code snippets.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between sticky top-0 z-50">
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
              Documentation
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documentation... (Press '/')"
              className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-all"
            />
          </div>
          <Link
            href="/playground"
            className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
          >
            Playground
          </Link>
          <a
            href="https://github.com/Zerith-Labs/ZerithDB"
            className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
        <aside className="w-72 border-r border-gray-100 py-8 pr-6 pl-6 hidden lg:block overflow-y-auto h-[calc(100vh-4rem)] sticky top-16">
          <div className="space-y-8">
            {SIDEBAR_LINKS.map((section, idx) => {
              const SectionIcon = section.icon;
              return (
                <div key={idx}>
                  <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3 flex items-center gap-2">
                    <SectionIcon className="w-3.5 h-3.5" />
                    {section.category}
                  </h3>
                  <ul className="flex flex-col gap-1.5 border-l border-gray-100 ml-1.5 pl-3">
                    {section.items.map((item, i) => (
                      <li key={i}>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveSection(item);
                          }}
                          className={
                            "text-sm font-medium transition-colors text-left w-full " +
                            (item === activeSection
                              ? "text-blue-600"
                              : "text-gray-500 hover:text-gray-900")
                          }
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 py-10 px-6 lg:px-16 overflow-y-auto scroll-smooth">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-400">
              <span className="hover:text-gray-900 cursor-pointer">Docs</span>
              <span>/</span>
              <span className="text-gray-900">{activeSection}</span>
            </div>

            <h1
              id="overview"
              className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight scroll-mt-20"
            >
              {activeSection}
            </h1>

            {renderContent()}
          </div>
        </main>

        {/* RIGHT SIDEBAR - ON THIS PAGE */}
        <aside className="w-64 py-10 pr-6 hidden xl:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-4">
            On this page
          </h4>
          <ul className="space-y-3 text-sm text-gray-500 font-medium border-l border-gray-100 pl-4">
            {activeSection === "Quickstart" ? (
              <>
                <li>
                  <a href="#overview" className="hover:text-blue-600 transition-colors">
                    Overview
                  </a>
                </li>
                <li>
                  <a href="#install-the-sdk" className="hover:text-blue-600 transition-colors">
                    Install the SDK
                  </a>
                </li>
                {activeFramework.steps.map((step, idx) => (
                  <li key={idx}>
                    <a
                      href={`#${slugify(step.title)}`}
                      className="hover:text-blue-600 transition-colors line-clamp-1"
                    >
                      {step.title}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#next-steps" className="hover:text-blue-600 transition-colors">
                    Next Steps
                  </a>
                </li>
              </>
            ) : activeSection === "Troubleshooting" ? (
              <>
                <li>
                  <a href="#overview" className="hover:text-blue-600 transition-colors">
                    Overview
                  </a>
                </li>
                <li>
                  <a href="#webrtc-nat-issue" className="hover:text-blue-600 transition-colors">
                    1. WebRTC & NAT Issues
                  </a>
                </li>
                <li>
                  <a href="#connection-drops" className="hover:text-blue-600 transition-colors">
                    2. Connection Drops
                  </a>
                </li>
              </>
            ) : (
              <li>
                <a href="#overview" className="text-blue-600 transition-colors">
                  Overview
                </a>
              </li>
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}
