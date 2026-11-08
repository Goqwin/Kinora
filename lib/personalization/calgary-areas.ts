/**
 * Coarse location lookup for Calgary. We only ever use the postal code's
 * first three characters (FSA) or a neighbourhood name — never a full postal
 * code or address — and resolve it to an approximate area centre.
 *
 * ⚠️ Centroids are hand-approximated (good to ~1–2 km, plenty for ranking by
 * distance). Spot-check the ones your demo profile uses against a map, or
 * replace this table with Canada Post / City of Calgary open-data centroids.
 */

export type AreaCentroid = { lat: number; lng: number; label: string };

export const CALGARY_FSA_CENTROIDS: Record<string, AreaCentroid> = {
  T1Y: { lat: 51.08, lng: -113.96, label: "Rundle / Pineridge / Whitehorn" },
  T2A: { lat: 51.045, lng: -113.96, label: "Forest Lawn / Marlborough" },
  T2B: { lat: 51.03, lng: -113.97, label: "Dover / Penbrooke" },
  T2C: { lat: 50.98, lng: -113.99, label: "Ogden / Lynnwood" },
  T2E: { lat: 51.065, lng: -114.03, label: "Bridgeland / Renfrew / Mayland Heights" },
  T2G: { lat: 51.035, lng: -114.04, label: "Inglewood / Ramsay" },
  T2H: { lat: 50.98, lng: -114.07, label: "Kingsland / Fairview" },
  T2J: { lat: 50.95, lng: -114.05, label: "Acadia / Lake Bonavista" },
  T2K: { lat: 51.09, lng: -114.07, label: "Thorncliffe / Highwood" },
  T2L: { lat: 51.09, lng: -114.13, label: "Brentwood / Varsity" },
  T2M: { lat: 51.07, lng: -114.08, label: "Mount Pleasant / Tuxedo Park" },
  T2N: { lat: 51.06, lng: -114.11, label: "Hillhurst / Banff Trail" },
  T2P: { lat: 51.048, lng: -114.068, label: "Downtown" },
  T2R: { lat: 51.037, lng: -114.075, label: "Beltline / Mission" },
  T2S: { lat: 51.025, lng: -114.075, label: "Elbow Park / Rideau" },
  T2T: { lat: 51.035, lng: -114.11, label: "Killarney / Bankview" },
  T2V: { lat: 50.97, lng: -114.08, label: "Haysboro / Southwood" },
  T2W: { lat: 50.95, lng: -114.12, label: "Woodbine / Cedarbrae" },
  T2X: { lat: 50.9, lng: -114.05, label: "Midnapore / Sundance" },
  T2Y: { lat: 50.9, lng: -114.1, label: "Somerset / Evergreen" },
  T2Z: { lat: 50.9, lng: -113.97, label: "McKenzie Towne / Auburn Bay" },
  T3A: { lat: 51.11, lng: -114.16, label: "Dalhousie / Edgemont" },
  T3B: { lat: 51.09, lng: -114.2, label: "Bowness / Montgomery" },
  T3C: { lat: 51.04, lng: -114.13, label: "Shaganappi / Spruce Cliff" },
  T3E: { lat: 51.01, lng: -114.14, label: "Glenbrook / Lakeview / Signal Hill" },
  T3G: { lat: 51.13, lng: -114.21, label: "Tuscany / Arbour Lake" },
  T3H: { lat: 51.03, lng: -114.2, label: "Aspen Woods / Springbank Hill" },
  T3J: { lat: 51.11, lng: -113.95, label: "Saddle Ridge / Martindale" },
  T3K: { lat: 51.15, lng: -114.07, label: "Panorama Hills / Harvest Hills" },
  T3L: { lat: 51.15, lng: -114.21, label: "Rocky Ridge / Royal Oak" },
  T3M: { lat: 50.88, lng: -113.98, label: "Cranston / Seton / Mahogany" },
  T3N: { lat: 51.15, lng: -113.95, label: "Cityscape / Redstone / Cornerstone" },
  T3P: { lat: 51.17, lng: -114.12, label: "Evanston / Sage Hill" },
  T3R: { lat: 51.17, lng: -114.17, label: "Sherwood / Kincora" },
};

/** Common neighbourhood names → FSA. Lowercased, punctuation-free keys. */
export const NEIGHBOURHOOD_TO_FSA: Record<string, string> = {
  downtown: "T2P",
  "east village": "T2G",
  beltline: "T2R",
  mission: "T2R",
  inglewood: "T2G",
  ramsay: "T2G",
  bridgeland: "T2E",
  renfrew: "T2E",
  "forest lawn": "T2A",
  marlborough: "T2A",
  dover: "T2B",
  ogden: "T2C",
  hillhurst: "T2N",
  kensington: "T2N",
  sunnyside: "T2N",
  varsity: "T2L",
  brentwood: "T2L",
  bowness: "T3B",
  montgomery: "T3B",
  tuscany: "T3G",
  "saddle ridge": "T3J",
  martindale: "T3J",
  taradale: "T3J",
  falconridge: "T3J",
  rundle: "T1Y",
  pineridge: "T1Y",
  "panorama hills": "T3K",
  evanston: "T3P",
  "sage hill": "T3P",
  cityscape: "T3N",
  redstone: "T3N",
  cornerstone: "T3N",
  midnapore: "T2X",
  sundance: "T2X",
  evergreen: "T2Y",
  somerset: "T2Y",
  "mckenzie towne": "T2Z",
  "auburn bay": "T2Z",
  cranston: "T3M",
  seton: "T3M",
  mahogany: "T3M",
  haysboro: "T2V",
  southwood: "T2V",
  acadia: "T2J",
  "lake bonavista": "T2J",
  woodbine: "T2W",
  killarney: "T2T",
  shaganappi: "T3C",
  "signal hill": "T3E",
  dalhousie: "T3A",
  edgemont: "T3A",
};

/** Calgary FSAs all start with T1Y, T2*, or T3*. "T2R 0A1" → "T2R". */
export function extractCalgaryFsa(postalCode: string): string | null {
  const compact = postalCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const fsa = compact.slice(0, 3);
  return /^T[123][A-Z]$/.test(fsa) ? fsa : null;
}

export function normalizeNeighbourhood(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
