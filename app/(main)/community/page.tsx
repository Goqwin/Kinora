import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { isDatabaseConfigured } from "@/lib/db";
import { listPublishedCommunityPosts } from "@/lib/db/queries/community";

export const metadata = {
  title: "Community",
};

export default async function CommunityPage() {
  const dbReady = isDatabaseConfigured();
  let posts: Awaited<ReturnType<typeof listPublishedCommunityPosts>> = [];
  if (dbReady) {
    try {
      posts = await listPublishedCommunityPosts();
    } catch {
      posts = [];
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="From parents"
        title="Ask other parents"
        description="Share what worked for you. Posts are community opinions, not verified information."
      >
        <Button asChild className="mt-2 rounded-full">
          <Link href="/community/new">
            Write a post
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </PageHeader>

      <p className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--ink-muted)]">
        Posts are community opinions, not verified information.
      </p>

      {!dbReady ? (
        <p className="mt-6 text-sm text-[var(--ink-muted)]" role="status">
          Add DATABASE_URL to load and store community posts.
        </p>
      ) : null}

      {dbReady && posts.length === 0 ? (
        <div
          className="mt-10 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center"
          role="status"
        >
          <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
            No published posts yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--ink-muted)]">
            New posts stay pending until moderation passes. Your submission will
            show here after review.
          </p>
        </div>
      ) : null}

      {posts.length > 0 ? (
        <ul className="mt-10 space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/community/${post.id}`}
                className="block rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-xs)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--accent)]">
                  {post.category.replaceAll("_", " ")}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                  {post.body}
                </p>
                <p className="mt-4 text-xs text-[var(--ink-muted)]">
                  {post.authorLabel}
                  {typeof post.helpfulCount === "number"
                    ? ` · ${post.helpfulCount} helpful`
                    : null}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </PageShell>
  );
}
