/** Mapbox map defaults (Calgary). Lng/lat order for Mapbox GL. */
export const CALGARY_CENTER: [number, number] = [-114.0719, 51.0447];
export const DEFAULT_ZOOM = 12.8;
/** Zoom where Mapbox 3D building extrusions become visible. */
export const BUILDINGS_MIN_ZOOM = 14.05;
/** Immersive street-level pitch for 3D mode. */
export const DEFAULT_PITCH = 64;
export const DEFAULT_BEARING = -28;
export const IMMERSIVE_PITCH = 68;
export const MAP_STYLE_LIGHT = "mapbox://styles/mapbox/streets-v12";
export const MAP_STYLE_DARK = "mapbox://styles/mapbox/dark-v11";
/** @deprecated Prefer theme-aware helpers. */
export const MAP_STYLE = MAP_STYLE_LIGHT;
export const DEFAULT_RADIUS_KM = 15;
export const RADIUS_OPTIONS_KM = [5, 10, 15, 25, 50] as const;

export function mapStyleForTheme(theme: "light" | "dark"): string {
  return theme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;
}

/** Mapbox pk.* public tokens are typically well over this length when complete. */
export const MIN_MAPBOX_PUBLIC_TOKEN_LENGTH = 80;

export function getPublicMapboxToken(): string | undefined {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  if (!token) return undefined;
  return token;
}

export function isLikelyValidMapboxPublicToken(token: string | undefined): boolean {
  if (!token) return false;
  const trimmed = token.trim();
  if (!trimmed.startsWith("pk.")) return false;
  if (trimmed.length < MIN_MAPBOX_PUBLIC_TOKEN_LENGTH) return false;
  return true;
}

export function isMapboxConfigured(): boolean {
  return isLikelyValidMapboxPublicToken(getPublicMapboxToken());
}

/** Client map reads the public token only. */
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
