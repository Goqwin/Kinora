"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme, ready: themeReady } = useTheme();
  // A Suspense boundary can hydrate after the provider is ready; gating on this
  // component's own hydration keeps its first client render identical to the server HTML.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const ready = themeReady && hydrated;
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!ready}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]",
        "hover:bg-[var(--surface-muted)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
        className,
      )}
      aria-label={
        !ready
          ? "Theme"
          : isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
      }
      title={!ready ? "Theme" : isDark ? "Light mode" : "Dark mode"}
    >
      {!ready ? (
        <span className="h-4 w-4" aria-hidden />
      ) : isDark ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
