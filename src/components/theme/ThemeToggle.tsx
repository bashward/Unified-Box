"use client";

import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const isDark = (resolvedTheme ?? theme) === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-2xl border border-border px-3 py-1.5 bg-card text-sm hover:shadow-soft"
      aria-label="Toggle theme"
    >
      <span className="text-muted-foreground" suppressHydrationWarning>
        {isDark ? "Dark" : "Light"}
      </span>
      <span suppressHydrationWarning>{isDark ? "🌙" : "☀️"}</span>
    </button>
  );
}
