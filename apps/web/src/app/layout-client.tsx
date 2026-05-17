"use client";

import { useState } from "react";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <>
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 rounded-md border border-border bg-muted px-4 py-2 text-sm"
      >
        Toggle Theme
      </button>
      {children}
    </>
  );
}
