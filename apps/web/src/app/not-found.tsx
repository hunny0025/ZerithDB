import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found | ZerithDB",
  description:
    "This route doesn't exist in the mesh. Navigate back to ZerithDB's home, docs, or playground.",
};

export default function NotFound() {
  return (
    <main className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-110">
              <Image
                src="/logo.svg"
                alt="ZerithDB Logo"
                width={36}
                height={36}
                className="w-full h-full"
              />
            </div>
            <span className="font-semibold text-xl tracking-tight">ZerithDB</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/docs" className="hover:text-foreground transition-colors duration-300">
              Docs
            </Link>
            <Link
              href="/playground"
              className="hover:text-foreground transition-colors duration-300"
            >
              Playground
            </Link>
            <a
              href="https://github.com/Zerith-Labs/ZerithDB"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors duration-300"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* ── 404 HERO ── */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-20 text-center overflow-hidden transition-colors duration-300">
        {/* Background: dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Background blurred glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-blue-100/40 dark:bg-blue-900/20 blur-[120px] transition-colors duration-300"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-indigo-100/30 dark:bg-indigo-900/15 blur-[90px] transition-colors duration-300"
        />

        {/* Floating abstract decorative shapes */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-[8%] left-[6%] w-28 h-28 hidden xl:block rounded-[2.5rem] border border-blue-200/40 bg-white/10 dark:bg-white/5 backdrop-blur-md shadow-[0_16px_40px_rgba(59,130,246,0.10)] animate-[float1_12s_ease-in-out_infinite] transition-colors duration-300"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[10%] right-[7%] w-36 h-36 hidden xl:block rounded-[3rem] border border-indigo-200/30 bg-white/5 dark:bg-white/[0.03] backdrop-blur-sm shadow-[0_10px_30px_rgba(99,102,241,0.07)] animate-[float2_16s_ease-in-out_infinite] transition-colors duration-300"
        />

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-6 animate-[fadeInUp_0.7s_ease-out_both]">
          {/* 404 badge */}
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 shadow-sm transition-colors duration-300">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"
              aria-hidden
            />
            Error 404
          </span>

          {/* Giant 404 number */}
          <div className="relative select-none" aria-hidden>
            <span className="text-[7rem] sm:text-[10rem] lg:text-[13rem] font-extrabold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 drop-shadow-sm">
              404
            </span>
            {/* Subtle glow under the number */}
            <span
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-8 rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-xl transition-colors duration-300"
              aria-hidden
            />
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance -mt-2 transition-colors duration-300">
            This route doesn&apos;t exist in the mesh
          </h1>

          {/* Sub-copy */}
          <p className="text-base sm:text-lg text-muted-foreground text-balance max-w-md leading-relaxed transition-colors duration-300">
            The page you&apos;re looking for may have been moved, deleted, or never existed.
            Let&apos;s get you back on track.
          </p>

          {/* Primary CTA */}
          <Link
            href="/"
            id="back-to-home"
            className="group mt-2 inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-6 py-3 text-sm font-semibold shadow-sm hover:opacity-90 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 group-hover:-translate-x-1"
              aria-hidden
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>

          {/* Divider */}
          <div className="w-full flex items-center gap-4 mt-2">
            <span className="flex-1 h-px bg-border" aria-hidden />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              or explore
            </span>
            <span className="flex-1 h-px bg-border" aria-hidden />
          </div>

          {/* Quick navigation links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-1">
            <Link
              href="/docs"
              id="goto-docs"
              className="group flex items-center gap-3 rounded-xl border border-border bg-background hover:bg-muted dark:hover:bg-muted/60 px-5 py-4 text-left transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted group-hover:border-blue-200 group-hover:text-blue-600 transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors duration-300">
                  Documentation
                </p>
                <p className="text-xs text-muted-foreground">Guides &amp; API reference</p>
              </div>
            </Link>

            <Link
              href="/playground"
              id="goto-playground"
              className="group flex items-center gap-3 rounded-xl border border-border bg-background hover:bg-muted dark:hover:bg-muted/60 px-5 py-4 text-left transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted group-hover:border-blue-200 group-hover:text-blue-600 transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors duration-300">
                  Playground
                </p>
                <p className="text-xs text-muted-foreground">Try ZerithDB live</p>
              </div>
            </Link>

            <a
              href="https://github.com/Zerith-Labs/ZerithDB"
              target="_blank"
              rel="noopener noreferrer"
              id="goto-github"
              className="group flex items-center gap-3 rounded-xl border border-border bg-background hover:bg-muted dark:hover:bg-muted/60 px-5 py-4 text-left transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted group-hover:border-blue-200 group-hover:text-blue-600 transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors duration-300">
                  GitHub
                </p>
                <p className="text-xs text-muted-foreground">Source &amp; issues</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border py-8 px-6 bg-background transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center">
              <img src="/logo.svg" alt="ZerithDB Logo" className="w-full h-full" />
            </div>
            <span className="font-semibold text-foreground">ZerithDB</span>
          </div>

          <div className="flex items-center gap-5 text-xs text-muted-foreground font-medium">
            <Link href="/" className="hover:text-foreground transition-colors duration-300">
              Home
            </Link>
            <Link href="/docs" className="hover:text-foreground transition-colors duration-300">
              Docs
            </Link>
            <Link
              href="/playground"
              className="hover:text-foreground transition-colors duration-300"
            >
              Playground
            </Link>
            <a
              href="https://github.com/Zerith-Labs/ZerithDB"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors duration-300"
            >
              GitHub
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ZerithDB. Open Source.
          </p>
        </div>
      </footer>

      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(-15deg); }
          40%       { transform: translateY(-20px) rotate(5deg); }
          70%       { transform: translateY(10px) rotate(-25deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(20deg); }
          35%       { transform: translateY(18px) rotate(35deg); }
          70%       { transform: translateY(-12px) rotate(15deg); }
        }
      `}</style>
    </main>
  );
}
