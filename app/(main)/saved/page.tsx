import Link from "next/link";
import { Bookmark } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { TaskList } from "@/components/plan/task-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOptionalUser, isAuthConfigured } from "@/lib/auth";
import { loginHref } from "@/lib/auth/paths";
import { isDatabaseConfigured } from "@/lib/db";
import { listSavedResourcesForUser } from "@/lib/db/queries/saved";
import { listTasksForUser } from "@/lib/db/queries/tasks";
import { categoryLabel } from "@/lib/resources/catalog";

export const metadata = {
  title: "Saved",
};

export const instant = false;

export default async function SavedPage() {
  const authReady = isAuthConfigured();
  const dbReady = isDatabaseConfigured();
  const user = authReady ? await getOptionalUser() : null;
  let items: Awaited<ReturnType<typeof listSavedResourcesForUser>> = [];
  let tasks: Awaited<ReturnType<typeof listTasksForUser>> = [];

  if (user && dbReady) {
    try {
      items = await listSavedResourcesForUser(user.id);
      tasks = await listTasksForUser(user.id);
    } catch {
      items = [];
      tasks = [];
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Your list"
        title="Saved items"
        description="Keep resources and a simple checklist across devices. Browsing works without an account."
      />

      {!authReady ? (
        <p className="mt-6 text-sm text-[var(--ink-muted)]">
          Add Auth0 variables to enable sign-in and saved lists.
        </p>
      ) : null}

      {authReady && !user ? (
        <div className="mt-12 flex flex-col items-center rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center shadow-[var(--shadow-xs)]">
          <Bookmark className="h-10 w-10 text-[var(--ink-muted)]" aria-hidden />
          <p className="mt-4 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
            Sign in to see saves
          </p>
          <Button asChild className="mt-6 rounded-full">
            <a href={loginHref("/saved")}>Sign in</a>
          </Button>
        </div>
      ) : null}

      {user ? (
        <div className="mt-10 space-y-12">
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
              Checklist
            </h2>
            <div className="mt-4">
              <TaskList
                initialTasks={tasks.map((task) => ({
                  id: task.id,
                  title: task.title,
                  status: task.status,
                  resourceSlug: task.resourceSlug,
                  resourceName: task.resourceName,
                }))}
              />
            </div>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
              Saved resources
            </h2>
            {items.length === 0 ? (
              <div className="mt-4 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
                <p className="text-sm text-[var(--ink-muted)]">
                  Nothing saved yet. Open a resource and tap Save.
                </p>
                <Button asChild variant="secondary" className="mt-5 rounded-full">
                  <Link href="/resources">Browse catalog</Link>
                </Button>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item.resourceId}>
                    <Link
                      href={`/resources/${item.slug}`}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 transition hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    >
                      <span>
                        <span className="block font-medium text-[var(--ink)]">
                          {item.name}
                        </span>
                        <Badge variant="category" className="mt-2">
                          {categoryLabel(item.category)}
                        </Badge>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
