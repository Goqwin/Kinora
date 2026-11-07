import { ModerationActions } from "@/components/admin/moderation-actions";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { requireAdmin } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { listPendingCommunityPosts } from "@/lib/db/queries/community";

export const metadata = {
  title: "Moderation queue",
};

export const instant = false;

export default async function AdminModerationPage() {
  await requireAdmin();
  const dbReady = isDatabaseConfigured();
  let pending: Awaited<ReturnType<typeof listPendingCommunityPosts>> = [];
  if (dbReady) {
    try {
      pending = await listPendingCommunityPosts();
    } catch {
      pending = [];
    }
  }

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Admin"
        title="Moderation queue"
        description="Review pending community posts. Fail closed: unpublished until you publish."
      />

      {!dbReady ? (
        <p className="mt-6 text-sm text-[var(--ink-muted)]">
          DATABASE_URL is required to load the queue.
        </p>
      ) : null}

      {pending.length === 0 ? (
        <p
          className="mt-10 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center text-sm text-[var(--ink-muted)]"
          role="status"
        >
          No pending posts right now.
        </p>
      ) : (
        <ul className="mt-10 space-y-4">
          {pending.map((post) => (
            <li
              key={post.id}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-xs)]"
            >
              <p className="text-xs text-[var(--ink-muted)]">
                {post.authorLabel ?? "Parent"} · pending ·{" "}
                {post.category.replaceAll("_", " ")}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
                {post.title}
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-muted)]">
                {post.body}
              </p>
              <ModerationActions postId={post.id} />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
