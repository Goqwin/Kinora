import Link from "next/link";
import { notFound } from "next/navigation";

import { PostActions } from "@/components/community/post-actions";
import { ReplyForm } from "@/components/community/reply-form";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { getOptionalUser, isAuthConfigured } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import {
  getPublishedPostById,
  listPublishedRepliesForPost,
} from "@/lib/db/queries/community";

export const metadata = {
  title: "Community post",
};

export const instant = false;

type CommunityPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CommunityPostPage({
  params,
}: CommunityPostPageProps) {
  const { id } = await params;
  if (!isDatabaseConfigured()) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="From parents"
          title="Community post"
          description="Add DATABASE_URL to load posts."
        />
      </PageShell>
    );
  }

  const post = await getPublishedPostById(id);
  if (!post) notFound();

  const replies = await listPublishedRepliesForPost(id);
  const authReady = isAuthConfigured();
  const user = authReady ? await getOptionalUser() : null;

  return (
    <PageShell>
      <p className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--ink-muted)]">
        Posts are community opinions, not verified information.
      </p>

      <PageHeader eyebrow={post.category.replaceAll("_", " ")} title={post.title}>
        <p className="text-sm text-[var(--ink-muted)]">
          {post.authorLabel}
          {post.createdAt
            ? ` · ${new Date(post.createdAt).toLocaleDateString()}`
            : null}
        </p>
      </PageHeader>

      <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-[var(--ink)]">
        {post.body}
      </p>

      <div className="mt-6">
        <PostActions
          postId={post.id}
          helpfulCount={post.helpfulCount}
          signedIn={Boolean(user)}
        />
      </div>

      <section className="mt-12 space-y-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
          Replies
        </h2>
        {replies.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]" role="status">
            No published replies yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {replies.map((reply) => (
              <li
                key={reply.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4"
              >
                <p className="text-xs text-[var(--ink-muted)]">
                  {reply.authorLabel}
                  {reply.createdAt
                    ? ` · ${new Date(reply.createdAt).toLocaleDateString()}`
                    : null}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
                  {reply.body}
                </p>
              </li>
            ))}
          </ul>
        )}
        <ReplyForm postId={post.id} signedIn={Boolean(user)} />
      </section>

      <p className="mt-10 text-sm">
        <Link
          href="/community"
          className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
        >
          Back to community
        </Link>
      </p>
    </PageShell>
  );
}
