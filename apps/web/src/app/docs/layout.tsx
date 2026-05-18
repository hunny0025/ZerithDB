import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quickstart | ZerithDB Docs",
  description:
    "Get up and running with ZerithDB in under 2 minutes. Local-first, zero-backend setup guide.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
