import { useEffect, useState } from "react";

export type ThemeMode = "morning" | "night" | "romantic";

function getAutoTheme(): ThemeMode {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 18 || hour < 5) return "night";
  return "romantic"; // afternoon warm
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(getAutoTheme);

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove("theme-morning", "theme-night", "theme-romantic");
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  // Auto-switch every hour
  useEffect(() => {
    const interval = setInterval(() => {
      setTheme(getAutoTheme());
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { theme, setTheme };
}
