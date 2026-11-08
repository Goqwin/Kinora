"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  applyTheme,
  type ThemeMode,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeMode {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start as light on server + first client paint to avoid hydration mismatch.
  // ThemeScript already painted the real theme on <html> before React loads.
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Defer so the first paint matches SSR; ThemeScript already set <html> class.
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (cancelled) return;
      const initial = readStoredTheme();
      setThemeState(initial);
      applyTheme(initial);
      setReady(true);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, ready }),
    [theme, setTheme, toggleTheme, ready],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
