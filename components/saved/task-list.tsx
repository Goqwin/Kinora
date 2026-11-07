"use client";

import { useState, useTransition } from "react";

import { createTaskAction, toggleTaskAction } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TaskItem = {
  id: string;
  title: string;
  status: string;
  resourceSlug: string | null;
  resourceName: string | null;
};

type TaskListProps = {
  initialTasks: TaskItem[];
};

export function TaskList({ initialTasks }: TaskListProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-5">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await createTaskAction({ title, resourceId: null });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setTitle("");
          });
        }}
      >
        <label htmlFor="task-title" className="sr-only">
          New checklist item
        </label>
        <input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          placeholder="Add a next step…"
          className="min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]/30"
        />
        <Button
          type="submit"
          disabled={pending || title.trim().length < 2}
          className="rounded-full"
        >
          Add
        </Button>
      </form>
      {error ? (
        <p className="text-sm text-[var(--crisis-fg)]" role="alert">
          {error}
        </p>
      ) : null}

      {initialTasks.length === 0 ? (
        <p className="text-sm text-[var(--ink-muted)]" role="status">
          No checklist items yet. Add one when you are ready.
        </p>
      ) : (
        <ul className="space-y-2">
          {initialTasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    await toggleTaskAction({ taskId: task.id });
                  });
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left transition hover:border-[var(--border-strong)]",
                  task.status === "done" && "opacity-70",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
                    task.status === "done"
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]"
                      : "border-[var(--border-strong)]",
                  )}
                >
                  {task.status === "done" ? "✓" : null}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-sm font-medium text-[var(--ink)]",
                      task.status === "done" && "line-through",
                    )}
                  >
                    {task.title}
                  </span>
                  {task.resourceName ? (
                    <span className="mt-1 block text-xs text-[var(--ink-muted)]">
                      Linked: {task.resourceName}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
