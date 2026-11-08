export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "sn-theme";

/**
 * New visitors always get light mode, whatever their OS setting. Dark mode is
 * opt-in through the toggle, and the choice is remembered in localStorage.
 */
export const DEFAULT_THEME: ThemeMode = "light";

export function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  root.dataset.theme = theme;
}
