import { useState, useEffect, useCallback } from "react";

export type ThemePreference = "light" | "dark" | "system";

function getStoredTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "system";
}

function resolveIsDark(preference: ThemePreference): boolean {
  if (preference === "dark") return true;
  if (preference === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(isDark: boolean) {
  const html = document.documentElement;
  if (isDark) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
  const metaTheme = document.querySelector(
    'meta[name="theme-color"]',
  ) as HTMLMetaElement | null;
  if (metaTheme) {
    metaTheme.setAttribute(
      "content",
      isDark ? "#0a0a0a" : "#f9fafb",
    );
  }
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const pref = getStoredTheme();
    setPreference(pref);
    setIsDark(resolveIsDark(pref));
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore
    }
    setPreference(next);
    const dark = resolveIsDark(next);
    applyTheme(dark);
    setIsDark(dark);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
  }, [isDark, setTheme]);

  return { preference, isDark, setTheme, toggleTheme };
}
