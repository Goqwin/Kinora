"use client";

import { useState, useTransition } from "react";

import { createCommunityReplyAction } from "@/app/actions/community";
import { Button } from "@/components/ui/button";

type ReplyFormProps = {
  postId: string;
  signedIn: boolean;
};

export function ReplyForm({ postId, signedIn }: ReplyFormProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4 text-sm text-[var(--ink-muted)]">
        <a href="/auth/login" className="font-medium text-[var(--accent)] underline-offset-2 hover:underline">
          Sign in
        </a>{" "}
        to reply. Posts stay moderated.
      </p>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await createCommunityReplyAction({ postId, body });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setBody("");
        });
      }}
    >
      <label htmlFor="reply-body" className="sr-only">
        Your reply
      </label>
      <textarea
        id="reply-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={1000}
        rows={4}
        placeholder="Share what helped you. No phone numbers or street addresses."
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--ink)] outline-none placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]/30"
      />
      {error ? (
        <p className="text-sm text-[var(--crisis-fg)]" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || body.trim().length < 3} className="rounded-full">
        {pending ? "Sending…" : "Post reply"}
      </Button>
    </form>
  );
}
