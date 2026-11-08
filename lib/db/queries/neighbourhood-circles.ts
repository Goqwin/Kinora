import { sql } from "drizzle-orm";

import {
  applyCircleFloor,
  filterAgeBandsForDisplay,
  type AgeBandCount,
} from "@/lib/community/circle-privacy";
import { getDb } from "@/lib/db";
import { CALGARY_FSA_CENTROIDS } from "@/lib/personalization/calgary-areas";

export type NeighbourhoodCircle = {
  fsa: string;
  label: string;
  /** 0 when belowFloor: the exact count is never passed on. */
  parentCount: number;
  openToMeetCount: number;
  ageBands: AgeBandCount[];
  /** Fewer than MIN_CIRCLE_PARENTS parents: show "Fewer than 5 parents" only. */
  belowFloor: boolean;
};

function fsaLabel(fsa: string): string {
  return CALGARY_FSA_CENTROIDS[fsa]?.label ?? fsa;
}

function normalizeFsa(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const fsa = raw.replace(/\s+/g, "").toUpperCase().slice(0, 3);
  if (!/^[A-Z]\d[A-Z]$/.test(fsa)) return null;
  return fsa;
}

async function loadAgeBandsForFsas(
  fsas: string[],
): Promise<Map<string, AgeBandCount[]>> {
  const byFsa = new Map<string, AgeBandCount[]>();
  if (fsas.length === 0) return byFsa;

  const db = getDb();
  const rows = (await db.execute(sql`
    SELECT
      postal_fsa,
      band,
      count(*)::int AS count
    FROM (
      SELECT postal_fsa, unnest(child_age_bands) AS band
      FROM user_preferences
      WHERE postal_fsa IN (${sql.join(
        fsas.map((fsa) => sql`${fsa}`),
        sql`, `,
      )})
        AND child_age_bands IS NOT NULL
        AND cardinality(child_age_bands) > 0
    ) bands
    GROUP BY postal_fsa, band
  `)) as unknown as {
    postal_fsa: string;
    band: string;
    count: number;
  }[];

  for (const row of rows) {
    const current = byFsa.get(row.postal_fsa) ?? [];
    current.push({ band: row.band, count: Number(row.count) });
    byFsa.set(row.postal_fsa, current);
  }

  for (const [fsa, bands] of byFsa) {
    byFsa.set(fsa, filterAgeBandsForDisplay(bands));
  }

  return byFsa;
}

export async function getCircleForFsa(
  rawFsa: string,
): Promise<NeighbourhoodCircle | null> {
  const fsa = normalizeFsa(rawFsa);
  if (!fsa) return null;

  const db = getDb();
  const rows = (await db.execute(sql`
    SELECT
      count(*)::int AS parent_count,
      count(*) FILTER (WHERE open_to_meet_parents)::int AS open_to_meet_count
    FROM user_preferences
    WHERE postal_fsa = ${fsa}
  `)) as unknown as {
    parent_count: number;
    open_to_meet_count: number;
  }[];

  const summary = rows[0];

  const parentCount = Number(summary?.parent_count ?? 0);
  const counts = {
    fsa,
    label: fsaLabel(fsa),
    parentCount,
    openToMeetCount: Number(summary?.open_to_meet_count ?? 0),
    ageBands: [] as AgeBandCount[],
  };
  // Small areas: skip the age-band query entirely; the floor hides them anyway.
  const floored = applyCircleFloor(counts);
  if (floored.belowFloor) return floored;

  const ageByFsa = await loadAgeBandsForFsas([fsa]);
  return { ...floored, ageBands: ageByFsa.get(fsa) ?? [] };
}

export async function listTopCircles(
  limit = 6,
): Promise<NeighbourhoodCircle[]> {
  const capped = Math.min(Math.max(limit, 1), 12);
  const db = getDb();
  const summaries = (await db.execute(sql`
    SELECT
      postal_fsa,
      count(*)::int AS parent_count,
      count(*) FILTER (WHERE open_to_meet_parents)::int AS open_to_meet_count
    FROM user_preferences
    WHERE postal_fsa IS NOT NULL
    GROUP BY postal_fsa
    ORDER BY count(*) DESC, postal_fsa ASC
    LIMIT ${capped}
  `)) as unknown as {
    postal_fsa: string;
    parent_count: number;
    open_to_meet_count: number;
  }[];

  const fsas = summaries.map((row) => row.postal_fsa);
  const ageByFsa = await loadAgeBandsForFsas(fsas);

  return summaries.map((row) =>
    applyCircleFloor({
      fsa: row.postal_fsa,
      label: fsaLabel(row.postal_fsa),
      parentCount: Number(row.parent_count),
      openToMeetCount: Number(row.open_to_meet_count),
      ageBands: ageByFsa.get(row.postal_fsa) ?? [],
    }),
  );
}

export { normalizeFsa as normalizeCircleFsa };
