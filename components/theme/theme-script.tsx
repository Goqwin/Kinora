import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Inline boot script to avoid a flash of the wrong theme before React hydrates.
 * Uses the saved choice if there is one, otherwise DEFAULT_THEME (light). The
 * OS dark-mode setting is deliberately ignored.
 */
export function ThemeScript() {
  const code = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t=${JSON.stringify(DEFAULT_THEME)}}var r=document.documentElement;r.classList.toggle("dark",t==="dark");r.style.colorScheme=t;r.dataset.theme=t}catch(e){}})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      suppressHydrationWarning
    />
  );
}
