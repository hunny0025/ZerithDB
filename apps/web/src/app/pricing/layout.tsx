import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | ZerithDB",
  description: "ZerithDB is open-source and free to use. No subscriptions, no vendor lock-in.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
