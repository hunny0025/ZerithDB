
"use client";

import Link from "next/link";
import { Zap, BookOpen, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function BlogPage() {
  return (
    <main className="flex flex-col min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              className="w-10 h-10 flex items-center justify-center overflow-hidden"
            >
              <img src="/logo.svg" alt="ZerithDB Logo" className="w-full h-full" />
            </motion.div>
            <span className="font-semibold text-xl tracking-tight text-gray-900">ZerithDB</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="/docs" className="hover:text-black transition-colors font-medium">
              Docs
            </Link>
            <Link href="/#features" className="hover:text-black transition-colors">
              Features
            </Link>
            <Link href="/#how-it-works" className="hover:text-black transition-colors">
              How it works
            </Link>
            <Link href="/#compare" className="hover:text-black transition-colors">
              Compare
            </Link>
            <Link
              href="/playground"
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" /> Playground
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Zerith-Labs/ZerithDB"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
              GitHub
            </a>
            <Link
              href="/#get-started"
              className="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── COMING SOON SECTION ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-32 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none overflow-visible">
          <motion.div
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 -left-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 20, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-40 -right-20 w-80 h-80 bg-indigo-100 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-blue-100">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            Blog{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Coming Soon
            </span>
          </h1>
          <p className="mt-6 text-xl text-gray-500 text-balance leading-relaxed">
            We&apos;re preparing deep dives into CRDTs, peer-to-peer web architecture, and tutorials
            on building offline-first applications. Stay tuned!
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 bg-black text-white px-6 py-3.5 rounded-xl font-medium text-base hover:bg-gray-800 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-200 py-12 px-6 bg-white mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/logo.svg" alt="ZerithDB Logo" className="w-full h-full" />
            </div>
            <span className="font-semibold text-gray-900 text-lg">ZerithDB</span>
          </Link>

          <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
            <Link href="/docs" className="hover:text-gray-900 transition-colors">
              Documentation
            </Link>
            <a
              href="https://github.com/Zerith-Labs/ZerithDB"
              className="hover:text-gray-900 transition-colors"
            >
              GitHub
            </a>
            <Link href="/blog" className="hover:text-gray-900 transition-colors">
              Blog
            </Link>
            <Link href="/pricing" className="hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <a href="#" className="hover:text-gray-900 transition-colors">
              Discord
            </a>
          </div>

          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} ZerithDB. Open Source.
          </div>
        </div>
      </footer>
    </main>
  );
}
