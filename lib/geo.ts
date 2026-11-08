const CALGARY_CENTER = { lat: 51.0447, lon: -114.0719 };

export function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

export function postalFsa(postal: string | null | undefined): string | null {
  if (!postal) return null;
  const cleaned = postal.replace(/\s+/g, "").toUpperCase();
  if (cleaned.length < 3) return null;
  return cleaned.slice(0, 3);
}

/**
 * MVP geocoding without Mapbox: known Calgary centroid plus tiny FSA offsets for demo.
 */
export function approximateFromPostal(postal: string | null): {
  lat: number;
  lon: number;
  fsa: string | null;
} {
  const fsa = postalFsa(postal);
  if (!fsa) {
    return {
      lat: roundCoord(CALGARY_CENTER.lat),
      lon: roundCoord(CALGARY_CENTER.lon),
      fsa: null,
    };
  }
  const hash = fsa
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const lat = roundCoord(CALGARY_CENTER.lat + ((hash % 7) - 3) * 0.01);
  const lon = roundCoord(CALGARY_CENTER.lon + ((hash % 5) - 2) * 0.01);
  return { lat, lon, fsa };
}
