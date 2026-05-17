"use client";

export function ThemeToggle() {
  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 rounded-md border border-border bg-muted px-4 py-2 text-sm"
    >
      Toggle Theme
    </button>
  );
}
