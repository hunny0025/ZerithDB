import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClientLayout } from "./client-layout";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/ThemeToggle";
import ToasterProvider from "@/components/ToasterProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ZerithDB — Build apps with zero backend",
  description:
    "Local-first, peer-to-peer, CRDT-powered browser-native database platform. Build full-stack apps with ZERO backend. The browser is the server.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans antialiased transition-colors duration-300 selection:bg-accent/20 selection:text-accent">
        <ThemeProvider>
          <ThemeToggle />
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}