import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive CRDT Playground | ZerithDB",
  description: "Test offline/online P2P sync and CRDT conflict resolution live in your browser.",
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
