import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | ZerithDB",
  description:
    "Deep dives into CRDTs, peer-to-peer architecture, and offline-first application tutorials.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
