import { and, count, eq, gte } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  communityPosts,
  communityReplies,
  communityReports,
} from "@/lib/db/schema";

const DAY_MS = 24 * 60 * 60 * 1000;

export type RateLimitKind = "post" | "reply" | "report";

const LIMITS: Record<RateLimitKind, number> = {
  post: 5,
  reply: 20,
  report: 10,
};

/**
 * DB-count rate limits (no Redis). Returns true when the caller is still under
 * the daily cap for the given action kind.
 */
export async function checkRateLimit(
  userId: string,
  kind: RateLimitKind,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const since = new Date(Date.now() - DAY_MS);
  const limit = LIMITS[kind];

  let used = 0;
  if (kind === "post") {
    const [row] = await db
      .select({ n: count() })
      .from(communityPosts)
      .where(
        and(
          eq(communityPosts.authorId, userId),
          gte(communityPosts.createdAt, since),
        ),
      );
    used = Number(row?.n ?? 0);
  } else if (kind === "reply") {
    const [row] = await db
      .select({ n: count() })
      .from(communityReplies)
      .where(
        and(
          eq(communityReplies.authorId, userId),
          gte(communityReplies.createdAt, since),
        ),
      );
    used = Number(row?.n ?? 0);
  } else {
    const [row] = await db
      .select({ n: count() })
      .from(communityReports)
      .where(
        and(
          eq(communityReports.reporterId, userId),
          gte(communityReports.createdAt, since),
        ),
      );
    used = Number(row?.n ?? 0);
  }

  if (used >= limit) {
    return {
      ok: false,
      error: `Daily limit reached (${limit} ${kind}${limit === 1 ? "" : "s"}). Try again tomorrow.`,
    };
  }
  return { ok: true };
}

/** Open report count for a target; auto-hide threshold is 3. */
export async function countOpenReports(
  targetType: "post" | "reply",
  targetId: string,
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: count() })
    .from(communityReports)
    .where(
      and(
        eq(communityReports.targetType, targetType),
        eq(communityReports.targetId, targetId),
        eq(communityReports.status, "open"),
      ),
    );
  return Number(row?.n ?? 0);
}
