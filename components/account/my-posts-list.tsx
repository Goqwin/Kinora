import Link from "next/link";

import type { CommunityPostListItem } from "@/lib/db/queries/community";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  published: "Published",
  flagged: "Flagged",
  removed: "Removed",
};

type MyPostsListProps = {
  posts: CommunityPostListItem[];
};

export function MyPostsList({ posts }: MyPostsListProps) {
  if (posts.length === 0) {
    return (
      <div
        className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-center"
        role="status"
      >
        <p className="text-sm font-medium text-[var(--ink)]">No posts yet</p>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          When you post in the community, they show here privately with their
          review status.
        </p>
        <Link
          href="/community/new"
          className="mt-4 inline-block text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
        >
          Write a post
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
      {posts.map((post) => (
        <li key={post.id} className="px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-medium text-[var(--ink)]">{post.title}</p>
            <span className="rounded-[var(--radius-pill)] bg-[var(--surface-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--ink-muted)]">
              {STATUS_LABEL[post.status] ?? post.status}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-[var(--ink-muted)]">
            {post.body}
          </p>
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            {post.category.replaceAll("_", " ")} ·{" "}
            {post.createdAt
              ? new Date(post.createdAt).toLocaleDateString("en-CA")
              : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
