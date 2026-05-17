import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZerithDB Next.js Template",
  description: "Local-first P2P app built with ZerithDB and Next.js App Router",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
