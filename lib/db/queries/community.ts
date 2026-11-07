import { and, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  communityPosts,
  communityReplies,
  communityReports,
  communityVotes,
  users,
  type CommunityModerationMeta,
  type CommunityPost,
  type CommunityReply,
} from "@/lib/db/schema";

export type CommunityPostListItem = Pick<
  CommunityPost,
  "id" | "title" | "body" | "category" | "status" | "createdAt" | "helpfulCount"
> & { authorLabel: string };

export type CommunityPostDetail = CommunityPostListItem & {
  resourceId: string | null;
};

export type CommunityReplyItem = Pick<
  CommunityReply,
  "id" | "body" | "status" | "createdAt" | "helpfulCount"
> & { authorLabel: string };

export async function listPublishedCommunityPosts(): Promise<
  CommunityPostListItem[]
> {
  const db = getDb();
  const rows = await db
    .select({
      id: communityPosts.id,
      title: communityPosts.title,
      body: communityPosts.body,
      category: communityPosts.category,
      status: communityPosts.status,
      createdAt: communityPosts.createdAt,
      helpfulCount: communityPosts.helpfulCount,
      authorLabel: users.displayName,
    })
    .from(communityPosts)
    .innerJoin(users, eq(communityPosts.authorId, users.id))
    .where(eq(communityPosts.status, "published"))
    .orderBy(desc(communityPosts.createdAt))
    .limit(50);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    status: row.status,
    createdAt: row.createdAt,
    helpfulCount: row.helpfulCount,
    authorLabel: row.authorLabel ?? "Parent",
  }));
}

export async function listPendingCommunityPosts(): Promise<
  (CommunityPost & { authorLabel: string | null })[]
> {
  const db = getDb();
  const rows = await db
    .select({
      post: communityPosts,
      authorLabel: users.displayName,
    })
    .from(communityPosts)
    .innerJoin(users, eq(communityPosts.authorId, users.id))
    .where(eq(communityPosts.status, "pending"))
    .orderBy(desc(communityPosts.createdAt))
    .limit(100);

  return rows.map((row) => ({
    ...row.post,
    authorLabel: row.authorLabel,
  }));
}

export async function listCommunityPostsByAuthor(
  authorId: string,
): Promise<CommunityPostListItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: communityPosts.id,
      title: communityPosts.title,
      body: communityPosts.body,
      category: communityPosts.category,
      status: communityPosts.status,
      createdAt: communityPosts.createdAt,
      helpfulCount: communityPosts.helpfulCount,
      authorLabel: users.displayName,
    })
    .from(communityPosts)
    .innerJoin(users, eq(communityPosts.authorId, users.id))
    .where(eq(communityPosts.authorId, authorId))
    .orderBy(desc(communityPosts.createdAt))
    .limit(50);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    status: row.status,
    createdAt: row.createdAt,
    helpfulCount: row.helpfulCount,
    authorLabel: row.authorLabel ?? "Parent",
  }));
}

export async function getPublishedPostById(
  id: string,
): Promise<CommunityPostDetail | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: communityPosts.id,
      title: communityPosts.title,
      body: communityPosts.body,
      category: communityPosts.category,
      status: communityPosts.status,
      createdAt: communityPosts.createdAt,
      helpfulCount: communityPosts.helpfulCount,
      resourceId: communityPosts.resourceId,
      authorLabel: users.displayName,
    })
    .from(communityPosts)
    .innerJoin(users, eq(communityPosts.authorId, users.id))
    .where(
      and(eq(communityPosts.id, id), eq(communityPosts.status, "published")),
    )
    .limit(1);

  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    status: row.status,
    createdAt: row.createdAt,
    helpfulCount: row.helpfulCount,
    resourceId: row.resourceId,
    authorLabel: row.authorLabel ?? "Parent",
  };
}

export async function listPublishedRepliesForPost(
  postId: string,
): Promise<CommunityReplyItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: communityReplies.id,
      body: communityReplies.body,
      status: communityReplies.status,
      createdAt: communityReplies.createdAt,
      helpfulCount: communityReplies.helpfulCount,
      authorLabel: users.displayName,
    })
    .from(communityReplies)
    .innerJoin(users, eq(communityReplies.authorId, users.id))
    .where(
      and(
        eq(communityReplies.postId, postId),
        eq(communityReplies.status, "published"),
      ),
    )
    .orderBy(communityReplies.createdAt)
    .limit(100);

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    status: row.status,
    createdAt: row.createdAt,
    helpfulCount: row.helpfulCount,
    authorLabel: row.authorLabel ?? "Parent",
  }));
}

export async function createCommunityPost(input: {
  authorId: string;
  category: string;
  title: string;
  body: string;
  resourceId: string | null;
  status: "pending" | "published";
  moderation: CommunityModerationMeta;
}): Promise<string> {
  const db = getDb();
  const [row] = await db
    .insert(communityPosts)
    .values({
      authorId: input.authorId,
      category: input.category,
      title: input.title,
      body: input.body,
      resourceId: input.resourceId,
      status: input.status,
      moderation: input.moderation,
    })
    .returning({ id: communityPosts.id });
  if (!row) throw new Error("Post insert failed");
  return row.id;
}

export async function createCommunityReply(input: {
  postId: string;
  authorId: string;
  body: string;
  status: "pending" | "published";
  moderation: CommunityModerationMeta;
}): Promise<string> {
  const db = getDb();
  const [row] = await db
    .insert(communityReplies)
    .values({
      postId: input.postId,
      authorId: input.authorId,
      body: input.body,
      status: input.status,
      moderation: input.moderation,
    })
    .returning({ id: communityReplies.id });
  if (!row) throw new Error("Reply insert failed");
  return row.id;
}

export async function setCommunityPostStatus(
  postId: string,
  status: "published" | "removed" | "flagged" | "pending",
): Promise<void> {
  const db = getDb();
  await db
    .update(communityPosts)
    .set({ status, updatedAt: new Date() })
    .where(eq(communityPosts.id, postId));
}

export async function toggleHelpfulVote(input: {
  userId: string;
  targetType: "post" | "reply";
  targetId: string;
}): Promise<{ helpfulCount: number; voted: boolean }> {
  const db = getDb();
  const existing = await db
    .select({ userId: communityVotes.userId })
    .from(communityVotes)
    .where(
      and(
        eq(communityVotes.userId, input.userId),
        eq(communityVotes.targetType, input.targetType),
        eq(communityVotes.targetId, input.targetId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(communityVotes)
      .where(
        and(
          eq(communityVotes.userId, input.userId),
          eq(communityVotes.targetType, input.targetType),
          eq(communityVotes.targetId, input.targetId),
        ),
      );
    if (input.targetType === "post") {
      await db
        .update(communityPosts)
        .set({
          helpfulCount: sql`greatest(${communityPosts.helpfulCount} - 1, 0)`,
        })
        .where(eq(communityPosts.id, input.targetId));
    } else {
      await db
        .update(communityReplies)
        .set({
          helpfulCount: sql`greatest(${communityReplies.helpfulCount} - 1, 0)`,
        })
        .where(eq(communityReplies.id, input.targetId));
    }
  } else {
    await db.insert(communityVotes).values({
      userId: input.userId,
      targetType: input.targetType,
      targetId: input.targetId,
    });
    if (input.targetType === "post") {
      await db
        .update(communityPosts)
        .set({
          helpfulCount: sql`${communityPosts.helpfulCount} + 1`,
        })
        .where(eq(communityPosts.id, input.targetId));
    } else {
      await db
        .update(communityReplies)
        .set({
          helpfulCount: sql`${communityReplies.helpfulCount} + 1`,
        })
        .where(eq(communityReplies.id, input.targetId));
    }
  }

  if (input.targetType === "post") {
    const [row] = await db
      .select({ helpfulCount: communityPosts.helpfulCount })
      .from(communityPosts)
      .where(eq(communityPosts.id, input.targetId))
      .limit(1);
    return {
      helpfulCount: row?.helpfulCount ?? 0,
      voted: existing.length === 0,
    };
  }
  const [row] = await db
    .select({ helpfulCount: communityReplies.helpfulCount })
    .from(communityReplies)
    .where(eq(communityReplies.id, input.targetId))
    .limit(1);
  return {
    helpfulCount: row?.helpfulCount ?? 0,
    voted: existing.length === 0,
  };
}

export async function createCommunityReport(input: {
  reporterId: string;
  targetType: "post" | "reply";
  targetId: string;
  reason: string;
  note?: string | null;
}): Promise<string> {
  const db = getDb();
  const [row] = await db
    .insert(communityReports)
    .values({
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      note: input.note ?? null,
    })
    .returning({ id: communityReports.id });
  if (!row) throw new Error("Report insert failed");
  return row.id;
}
