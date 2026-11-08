"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getOptionalUser, requireAdmin, requireUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import {
  createCommunityPost,
  createCommunityReply,
  createCommunityReport,
  getPublishedPostById,
  setCommunityPostStatus,
  toggleHelpfulVote,
} from "@/lib/db/queries/community";
import { setOpenToMeetParents } from "@/lib/db/queries/preferences";
import { getResourceIdBySlug } from "@/lib/db/queries/resources";
import {
  COMMUNITY_POST_CATEGORIES,
  type CommunityModerationMeta,
} from "@/lib/db/schema-constants";
import { moderateCommunityContent } from "@/lib/moderation/pipeline";
import { checkRateLimit, countOpenReports } from "@/lib/rate-limit";

const postSchema = z.object({
  category: z.enum(COMMUNITY_POST_CATEGORIES),
  title: z.string().min(3).max(120),
  body: z.string().min(10).max(2000),
  resourceSlug: z.string().nullable(),
});

const replySchema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(3).max(1000),
});

const voteSchema = z.object({
  targetType: z.enum(["post", "reply"]),
  targetId: z.string().uuid(),
});

const reportSchema = z.object({
  targetType: z.enum(["post", "reply"]),
  targetId: z.string().uuid(),
  reason: z.enum([
    "personal_info",
    "harassment",
    "scam_or_promo",
    "unsafe_advice",
    "other",
  ]),
  note: z.string().max(500).optional(),
});

const adminPostSchema = z.object({
  postId: z.string().uuid(),
  decision: z.enum(["publish", "remove"]),
});

export async function createCommunityPostAction(
  input: z.infer<typeof postSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the title and body length." };
  }

  const user = await getOptionalUser();
  if (!user) {
    return { ok: false, error: "Sign in is required before posting." };
  }

  if (!isDatabaseConfigured()) {
    return {
      ok: false,
      error: "Database is not connected. Add DATABASE_URL to save posts.",
    };
  }

  const limit = await checkRateLimit(user.id, "post");
  if (!limit.ok) return limit;

  const moderation = await moderateCommunityContent({
    title: parsed.data.title,
    body: parsed.data.body,
  });
  if (moderation.blockedReason) {
    return { ok: false, error: moderation.blockedReason };
  }

  try {
    const resourceId = parsed.data.resourceSlug
      ? await getResourceIdBySlug(parsed.data.resourceSlug)
      : null;
    await createCommunityPost({
      authorId: user.id,
      category: parsed.data.category,
      title: parsed.data.title,
      body: parsed.data.body,
      resourceId,
      status: moderation.status,
      moderation: moderation.moderation as CommunityModerationMeta,
    });
    revalidatePath("/community");
    revalidatePath("/admin/moderation");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save your post. Try again later." };
  }
}

export async function createCommunityReplyAction(
  input: z.infer<typeof replySchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Reply must be 3 to 1000 characters." };
  }

  const user = await requireUser(`/community/${parsed.data.postId}`);
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "Database is not connected." };
  }

  const post = await getPublishedPostById(parsed.data.postId);
  if (!post) {
    return { ok: false, error: "That post is not available." };
  }

  const limit = await checkRateLimit(user.id, "reply");
  if (!limit.ok) return limit;

  const moderation = await moderateCommunityContent({
    body: parsed.data.body,
  });
  if (moderation.blockedReason) {
    return { ok: false, error: moderation.blockedReason };
  }

  try {
    await createCommunityReply({
      postId: parsed.data.postId,
      authorId: user.id,
      body: parsed.data.body,
      status: moderation.status,
      moderation: moderation.moderation as CommunityModerationMeta,
    });
    revalidatePath(`/community/${parsed.data.postId}`);
    revalidatePath("/admin/moderation");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save your reply." };
  }
}

export async function toggleHelpfulVoteAction(
  input: z.infer<typeof voteSchema>,
): Promise<
  | { ok: true; helpfulCount: number; voted: boolean }
  | { ok: false; error: string }
> {
  const parsed = voteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid vote target." };
  }
  const user = await getOptionalUser();
  if (!user) {
    return { ok: false, error: "Sign in to mark posts as helpful." };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "Database is not connected." };
  }

  try {
    const result = await toggleHelpfulVote({
      userId: user.id,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
    });
    revalidatePath("/community");
    return { ok: true, ...result };
  } catch {
    return { ok: false, error: "Could not update the vote." };
  }
}

export async function reportCommunityContentAction(
  input: z.infer<typeof reportSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Pick a report reason." };
  }
  const user = await getOptionalUser();
  if (!user) {
    return { ok: false, error: "Sign in to report content." };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "Database is not connected." };
  }

  const limit = await checkRateLimit(user.id, "report");
  if (!limit.ok) return limit;

  try {
    await createCommunityReport({
      reporterId: user.id,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
      note: parsed.data.note,
    });

    const open = await countOpenReports(
      parsed.data.targetType,
      parsed.data.targetId,
    );
    if (parsed.data.targetType === "post" && open >= 3) {
      await setCommunityPostStatus(parsed.data.targetId, "flagged");
    }

    revalidatePath("/community");
    revalidatePath("/admin/moderation");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not submit the report." };
  }
}

export async function moderateCommunityPostAction(
  input: z.infer<typeof adminPostSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = adminPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid moderation request." };
  }

  await requireAdmin();
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "Database is not connected." };
  }

  try {
    await setCommunityPostStatus(
      parsed.data.postId,
      parsed.data.decision === "publish" ? "published" : "removed",
    );
    revalidatePath("/community");
    revalidatePath("/admin/moderation");
    revalidatePath(`/community/${parsed.data.postId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update the post." };
  }
}

const meetParentsSchema = z.object({
  openToMeetParents: z.boolean(),
});

export async function setOpenToMeetParentsAction(
  input: z.infer<typeof meetParentsSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = meetParentsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid opt-in value." };
  }

  const user = await getOptionalUser();
  if (!user) {
    return { ok: false, error: "Sign in to opt in." };
  }

  if (!isDatabaseConfigured()) {
    return { ok: false, error: "Database is not configured yet." };
  }

  if (!/^[0-9a-f-]{36}$/i.test(user.id)) {
    return {
      ok: false,
      error:
        "Account sync is not ready. Try again after the database is connected.",
    };
  }

  try {
    await setOpenToMeetParents(user.id, parsed.data.openToMeetParents);
    revalidatePath("/community");
    revalidatePath("/account");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update your opt-in. Try again." };
  }
}
